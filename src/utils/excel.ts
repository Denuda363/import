/**
 * Excel File Utilities (Read, Write, Format, Parse)
 */
import * as XLSX from 'xlsx';
import { DataRow, TableData } from '../types/transformer';

/**
 * Parse an Excel or CSV file buffer/arrayBuffer
 */
export async function parseExcelFile(file: File): Promise<TableData> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const sheetNames = workbook.SheetNames;
  const firstSheetName = sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with raw values
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  // Extract headers
  let headers: string[] = [];
  if (rawRows.length > 0) {
    headers = Object.keys(rawRows[0]);
  } else {
    // If empty or raw rows couldn't detect header, extract from sheet range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let c = range.s.c; c <= range.e.c; ++c) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
      headers.push(cell ? String(cell.v) : `Kolom_${c + 1}`);
    }
  }

  // Format clean rows
  const cleanRows = rawRows.map((row) => {
    const formattedRow: DataRow = {};
    headers.forEach((h) => {
      const val = row[h];
      formattedRow[h] = val !== undefined && val !== null ? val : '';
    });
    return formattedRow;
  });

  return {
    fileName: file.name,
    sheetNames,
    currentSheet: firstSheetName,
    headers,
    rows: cleanRows,
    totalRows: cleanRows.length,
  };
}

/**
 * Switch sheet in an existing file
 */
export async function parseSheet(file: File, sheetName: string): Promise<TableData> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
  });

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet ${sheetName} tidak ditemukan`);
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  let headers: string[] = [];
  if (rawRows.length > 0) {
    headers = Object.keys(rawRows[0]);
  }

  const cleanRows = rawRows.map((row) => {
    const formattedRow: DataRow = {};
    headers.forEach((h) => {
      const val = row[h];
      formattedRow[h] = val !== undefined && val !== null ? val : '';
    });
    return formattedRow;
  });

  return {
    fileName: file.name,
    sheetNames: workbook.SheetNames,
    currentSheet: sheetName,
    headers,
    rows: cleanRows,
    totalRows: cleanRows.length,
  };
}

/**
 * Parse raw pasted TSV or CSV text
 */
export function parsePastedText(text: string, defaultName = 'Pasted_Data.xlsx'): TableData {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Teks yang ditempel kosong.');
  }

  // Detect delimiter: tab or comma or semicolon
  const firstLine = trimmed.split('\n')[0] || '';
  let delimiter = '\t';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  } else if (firstLine.includes(',')) {
    delimiter = ',';
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('Tidak ada baris data yang ditemukan.');
  }

  const headerLine = lines[0];
  const headers = headerLine.split(delimiter).map((h, idx) => {
    const val = h.replace(/^["']|["']$/g, '').trim();
    return val || `Kolom_${idx + 1}`;
  });

  const rows: DataRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delimiter);
    const rowObj: DataRow = {};
    headers.forEach((h, idx) => {
      const rawVal = parts[idx] !== undefined ? parts[idx].replace(/^["']|["']$/g, '').trim() : '';
      rowObj[h] = rawVal;
    });
    rows.push(rowObj);
  }

  return {
    fileName: defaultName,
    sheetNames: ['Sheet1'],
    currentSheet: 'Sheet1',
    headers,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Export rows and headers to Excel XLSX file
 */
export function exportToExcel(
  headers: string[],
  rows: DataRow[],
  fileName = 'Hasil_Transformasi_Image2.xlsx'
) {
  if (headers.length === 0 || rows.length === 0) {
    throw new Error('Tidak ada data untuk diekspor');
  }

  // Create clean 2D array representation
  const dataForSheet: any[][] = [];
  dataForSheet.push(headers);

  rows.forEach((row) => {
    const rowData = headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      // Try to convert to number if it's purely numeric
      if (typeof val === 'string') {
        const trimmed = val.trim();
        // Check for standard number
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          const num = Number(trimmed);
          if (!isNaN(num)) return num;
        }
      }
      return val;
    });
    dataForSheet.push(rowData);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(dataForSheet);

  // Auto calculate column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    // Check first 100 rows for length
    const sampleLimit = Math.min(rows.length, 100);
    for (let r = 0; r < sampleLimit; r++) {
      const val = String(rows[r][header] || '');
      if (val.length > maxLen) {
        maxLen = val.length;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Hasil Image 2');

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, finalFileName);
}

/**
 * Export rows to CSV
 */
export function exportToCsv(
  headers: string[],
  rows: DataRow[],
  fileName = 'Hasil_Transformasi_Image2.csv',
  delimiter = ','
) {
  if (headers.length === 0 || rows.length === 0) {
    throw new Error('Tidak ada data untuk diekspor');
  }

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(delimiter) || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(delimiter);
  const dataLines = rows.map((r) => headers.map((h) => escapeCell(r[h])).join(delimiter));

  const csvContent = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy table data to clipboard in TSV format for direct paste into Excel
 */
export async function copyTableToClipboard(headers: string[], rows: DataRow[]): Promise<void> {
  const headerLine = headers.join('\t');
  const dataLines = rows.map((r) => headers.map((h) => String(r[h] ?? '')).join('\t'));
  const text = [headerLine, ...dataLines].join('\n');
  await navigator.clipboard.writeText(text);
}
