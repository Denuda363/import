import React, { useRef, useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileImage,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { AiAnalysisResult, TransformationPipeline } from '../types/transformer';

interface AiVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPipeline: (pipeline: Partial<TransformationPipeline>) => void;
  sampleHeaders?: string[];
  sampleRows?: Record<string, any>[];
}

export const AiVisionModal: React.FC<AiVisionModalProps> = ({
  isOpen,
  onClose,
  onApplyPipeline,
  sampleHeaders,
  sampleRows,
}) => {
  const [image1Base64, setImage1Base64] = useState<string | null>(null);
  const [image2Base64, setImage2Base64] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (file: File, target: 1 | 2) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (target === 1) setImage1Base64(base64);
      else setImage2Base64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image1Base64 && !image2Base64 && !userPrompt.trim()) {
      setErrorMsg('Silakan unggah minimal salah satu gambar atau tuliskan deskripsi format.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/analyze-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image1Base64,
          image2Base64,
          prompt: userPrompt,
          sampleInputHeaders: sampleHeaders,
          sampleInputRows: sampleRows,
        }),
      });

      const data = await res.json();
      if (data.success || data.explanation) {
        setAnalysisResult({
          title: 'Hasil Analisis Struktur Format',
          explanation: data.explanation || 'Analisis berhasil diselesaikan.',
          detectedFormat1: data.detectedFormat1 || 'Format Asal',
          detectedFormat2: data.detectedFormat2 || 'Format Target',
          changesSummary: data.changesSummary || ['Penyesuaian tata letak tabel'],
          recommendedTransformType: data.recommendedTransformType || 'column_mapping',
          suggestedPipeline: data.suggestedPipeline,
        });
      } else {
        throw new Error(data.message || 'Gagal menganalisis gambar.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || 'Terjadi kesalahan saat menganalisis gambar. Pastikan koneksi atau API aktif.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (analysisResult?.suggestedPipeline) {
      onApplyPipeline(analysisResult.suggestedPipeline);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Analisis Vision: Ubah Format Image 1 ke Image 2
              </h3>
              <p className="text-xs text-slate-500">
                Unggah tangkapan layar (screenshot) format asal & target untuk deteksi otomatis oleh AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Images Upload Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Image 1: Asal */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>Image 1: Format Asal / Input</span>
                </span>
                {image1Base64 && (
                  <button
                    onClick={() => setImage1Base64(null)}
                    className="text-red-500 hover:underline text-[11px]"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {image1Base64 ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-300 max-h-48 flex items-center justify-center bg-black/5">
                  <img
                    src={image1Base64}
                    alt="Image 1 Format Asal"
                    className="max-h-48 object-contain"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef1.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-6 text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/20"
                >
                  <input
                    ref={fileInputRef1}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0], 1);
                      }
                    }}
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Pilih Screenshot Image 1</p>
                  <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WEBP</p>
                </div>
              )}
            </div>

            {/* Image 2: Target */}
            <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-800 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Image 2: Format Target / Output</span>
                </span>
                {image2Base64 && (
                  <button
                    onClick={() => setImage2Base64(null)}
                    className="text-red-500 hover:underline text-[11px]"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {image2Base64 ? (
                <div className="relative rounded-lg overflow-hidden border border-emerald-300 max-h-48 flex items-center justify-center bg-black/5">
                  <img
                    src={image2Base64}
                    alt="Image 2 Format Target"
                    className="max-h-48 object-contain"
                  />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef2.current?.click()}
                  className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-lg p-6 text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/50"
                >
                  <input
                    ref={fileInputRef2}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageUpload(e.target.files[0], 2);
                      }
                    }}
                  />
                  <Upload className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-emerald-800">Pilih Screenshot Image 2</p>
                  <p className="text-[11px] text-emerald-600/70 mt-1">PNG, JPG, WEBP</p>
                </div>
              )}
            </div>
          </div>

          {/* Optional Prompt Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan / Instruksi Khusus (Opsional):
            </label>
            <textarea
              rows={2}
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Contoh: Kolom Jan-Des diubah jadi baris, format Rupiah, dan buang baris total di bawah."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* AI Analysis Findings Display */}
          {analysisResult && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Hasil Analisis Gemini Vision</span>
              </div>

              <div className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-emerald-100">
                <p className="font-medium">{analysisResult.explanation}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white rounded border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-0.5">Format Image 1:</span>
                  <span className="text-slate-600">{analysisResult.detectedFormat1}</span>
                </div>
                <div className="p-2.5 bg-white rounded border border-emerald-200">
                  <span className="font-bold text-emerald-800 block mb-0.5">Format Image 2:</span>
                  <span className="text-emerald-700">{analysisResult.detectedFormat2}</span>
                </div>
              </div>

              {analysisResult.changesSummary.length > 0 && (
                <div>
                  <span className="font-bold text-emerald-900 block mb-1">
                    Ringkasan Langkah Transformasi:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {analysisResult.changesSummary.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium hover:bg-slate-200 rounded-lg transition-colors text-xs"
          >
            Tutup
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'Menganalisis Gambar...' : 'Mulai Analisis AI'}</span>
            </button>

            {analysisResult?.suggestedPipeline && (
              <button
                onClick={handleApply}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Aturan ke Excel Saya</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
