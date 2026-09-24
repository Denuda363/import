import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({});
}

export interface AnalyzeVisionRequest {
  image1Base64?: string; // Format Asal
  image2Base64?: string; // Format Target
  prompt?: string;
  sampleInputHeaders?: string[];
  sampleInputRows?: Record<string, any>[];
}

export interface AnalyzeVisionResponse {
  success: boolean;
  message?: string;
  explanation: string;
  detectedFormat1: string;
  detectedFormat2: string;
  changesSummary: string[];
  recommendedTransformType: string;
  suggestedPipeline?: any;
  transformedSampleHeaders?: string[];
  transformedSampleRows?: Record<string, any>[];
}

/**
 * Analyze Image 1 and Image 2 with Gemini 3.8 Flash Vision
 */
export async function analyzeTransformationWithVision(
  params: AnalyzeVisionRequest
): Promise<AnalyzeVisionResponse> {
  const ai = getAiClient();
  if (!ai) {
    return {
      success: false,
      message: 'GEMINI_API_KEY belum disetel pada environment.',
      explanation: 'Sistem menggunakan analisis lokal berbasis aturan otomatis.',
      detectedFormat1: 'Format Input Terdeteksi',
      detectedFormat2: 'Format Output Target',
      changesSummary: [
        'Identifikasi kolom input dan target',
        'Gunakan Unpivot jika format memiliki kolom periode berulang',
        'Gunakan Fill Down jika terdapat merge cell',
      ],
      recommendedTransformType: 'unpivot',
    };
  }

  try {
    const parts: any[] = [];

    const promptText = `
Anda adalah ahli pengolah data spreadsheet dan format Excel (Microsoft Excel / Google Sheets).
Pengguna ingin mengubah format data dari Format Awal (Image 1) menjadi Format Target (Image 2) untuk aplikasi otomasi Excel.

Tugas Anda:
1. Analisis struktur tabel pada Gambar 1 (Format Asal / Input). Sebutkan nama-nama kolom atau pola datanya.
2. Analisis struktur tabel pada Gambar 2 (Format Target / Output). Sebutkan kolom-kolomnya dan bagaimana data ditata.
3. Jelaskan langkah transformasi secara runut dalam Bahasa Indonesia (contoh: Unpivot kolom bulan ke baris, pengisian sel kosong/merge cell fill-down, pemisahan kolom, pengubahan nama kolom, dll).
4. Berikan konfigurasi aturan transformasi (pipeline) dalam format JSON yang valid agar aplikasi dapat langsung menerapkannya pada data Excel.

Instruksi tambahan pengguna: ${params.prompt || 'Ubah data sesuai perbedaan Image 1 ke Image 2.'}

${params.sampleInputHeaders ? `Kolom data input saat ini: ${JSON.stringify(params.sampleInputHeaders)}` : ''}
${params.sampleInputRows ? `Contoh 3 baris data input: ${JSON.stringify(params.sampleInputRows.slice(0, 3))}` : ''}

Jawab HANYA dalam format JSON dengan struktur:
{
  "explanation": "Penjelasan mendalam tentang perbedaan struktur tabel dan proses transformasinya",
  "detectedFormat1": "Deskripsi struktur Image 1",
  "detectedFormat2": "Deskripsi struktur Image 2",
  "changesSummary": ["Poin 1 perubahan", "Poin 2 perubahan", "Poin 3 perubahan"],
  "recommendedTransformType": "unpivot" | "fill_down" | "column_mapping" | "pivot" | "split_merge" | "custom",
  "suggestedPipeline": {
    "fillDown": { "targetColumns": [] },
    "filterClean": { "removeEmptyRows": true, "removeTotalRows": true },
    "unpivot": {
      "enabled": false,
      "config": {
        "idColumns": [],
        "valueColumns": [],
        "attributeHeader": "Periode",
        "valueHeader": "Nilai"
      }
    },
    "columnMappings": [
      { "id": "1", "sourceColumn": "...", "targetColumn": "...", "action": "keep" | "rename" | "uppercase" | "currency_format" | "split" }
    ]
  }
}
`;

    parts.push({ text: promptText });

    // Attach Image 1 if present
    if (params.image1Base64) {
      const clean1 = params.image1Base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const mime1 = params.image1Base64.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/png';
      parts.push({
        inlineData: {
          mimeType: mime1,
          data: clean1,
        },
      });
      parts.push({ text: '[Di atas adalah Image 1: Format Awal/Asal]' });
    }

    // Attach Image 2 if present
    if (params.image2Base64) {
      const clean2 = params.image2Base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const mime2 = params.image2Base64.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/png';
      parts.push({
        inlineData: {
          mimeType: mime2,
          data: clean2,
        },
      });
      parts.push({ text: '[Di atas adalah Image 2: Format Target/Tujuan]' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text || '{}';
    const parsed = JSON.parse(textOutput);

    return {
      success: true,
      explanation: parsed.explanation || 'Analisis berhasil dilakukan.',
      detectedFormat1: parsed.detectedFormat1 || 'Format Asal',
      detectedFormat2: parsed.detectedFormat2 || 'Format Tujuan',
      changesSummary: parsed.changesSummary || ['Penyesuaian format kolom'],
      recommendedTransformType: parsed.recommendedTransformType || 'column_mapping',
      suggestedPipeline: parsed.suggestedPipeline,
    };
  } catch (error: any) {
    console.error('Error analyzing vision transformation:', error);
    return {
      success: false,
      message: error.message || 'Gagal memproses analisis gambar dengan AI.',
      explanation: 'Terjadi kendala saat memproses gambar. Anda tetap dapat menggunakan template atau visual mapping.',
      detectedFormat1: 'Format Input',
      detectedFormat2: 'Format Target',
      changesSummary: ['Silakan pilih template yang sesuai atau atur kolom secara manual'],
      recommendedTransformType: 'unpivot',
    };
  }
}

/**
 * Smart transformation using natural language prompt and table data
 */
export async function executeAiSmartTransform(
  headers: string[],
  rows: Record<string, any>[],
  prompt: string
): Promise<{ success: boolean; headers: string[]; rows: Record<string, any>[]; message: string }> {
  const ai = getAiClient();
  if (!ai) {
    return {
      success: false,
      headers,
      rows,
      message: 'GEMINI_API_KEY tidak tersedia untuk transformasi AI. Gunakan pengaturan manual.',
    };
  }

  try {
    const sampleRows = rows.slice(0, 30); // Send up to 30 rows for transformation example or processing
    const promptText = `
Anda adalah mesin pengubah struktur data tabel Excel.
Berikut adalah kolom input: ${JSON.stringify(headers)}
Berikut adalah baris data: ${JSON.stringify(sampleRows)}

Instruksi Pengguna (Bahasa Indonesia):
"${prompt}"

Tugas Anda:
1. Lakukan transformasi persis sesuai instruksi pengguna terhadap data di atas.
2. Keluarkan struktur data tabel hasil transformasi yang baru.
3. Berikan dalam format JSON:
{
  "newHeaders": ["Kolom1", "Kolom2", ...],
  "newRows": [
    { "Kolom1": "...", "Kolom2": "..." },
    ...
  ],
  "explanation": "Ringkasan ringkas perubahan yang dilakukan"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.newHeaders && parsed.newRows) {
      return {
        success: true,
        headers: parsed.newHeaders,
        rows: parsed.newRows,
        message: parsed.explanation || 'Transformasi AI berhasil diterapkan.',
      };
    }

    return {
      success: false,
      headers,
      rows,
      message: 'Format output AI tidak sesuai spesifikasi.',
    };
  } catch (error: any) {
    console.error('Error in AI Smart Transform:', error);
    return {
      success: false,
      headers,
      rows,
      message: error.message || 'Gagal menjalankan transformasi AI.',
    };
  }
}
