import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  ClipboardPaste,
  CheckCircle2,
  TableProperties,
} from 'lucide-react';
import { parseExcelFile, parsePastedText } from '../utils/excel';
import { TableData } from '../types/transformer';

interface FileUploadZoneProps {
  tableData: TableData | null;
  onDataLoaded: (data: TableData) => void;
  onSheetChange?: (sheetName: string) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  tableData,
  onDataLoaded,
  onSheetChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await parseExcelFile(file);
      onDataLoaded(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal membaca file Excel. Pastikan format valid (.xlsx, .xls, .csv).');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMsg('Silakan tempel data tabel terlebih dahulu.');
      return;
    }
    try {
      const data = parsePastedText(pastedText, 'Data_Clipboard.xlsx');
      onDataLoaded(data);
      setPastedText('');
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Format teks tabel tidak valid.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-slate-50">
        <div className="flex space-x-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Unggah File Excel/CSV (Image 1)</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Tempel Data (Copy-Paste)</span>
          </button>
        </div>

        {tableData && (
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              File Terbuka
            </span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {activeTab === 'upload' ? (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50/60 ring-4 ring-emerald-50'
                  : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {isLoading ? 'Sedang memproses file...' : 'Tarik & Letakkan file Excel Anda di sini'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mendukung file .xlsx, .xls, .csv (Format Image 1 yang ingin Anda ubah)
                </p>
                <button
                  type="button"
                  className="mt-3 px-4 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-2xs"
                >
                  Pilih Berkas dari Komputer
                </button>
              </div>
            </div>

            {/* Current Loaded File Details & Sheet Picker */}
            {tableData && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{tableData.fileName}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">{tableData.totalRows} baris</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">{tableData.headers.length} kolom</span>
                </div>

                {tableData.sheetNames.length > 1 && onSheetChange && (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-medium">Pilih Sheet:</span>
                    <select
                      value={tableData.currentSheet}
                      onChange={(e) => onSheetChange(e.target.value)}
                      className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {tableData.sheetNames.map((sheet) => (
                        <option key={sheet} value={sheet}>
                          {sheet}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Salin (Ctrl+C) data dari Excel/Google Sheets Anda dan tempel (Ctrl+V) di sini..."
              className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50"
            />
            <div className="mt-2 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Pemisah kolom (Tab, Koma, atau Titik Koma) akan dideteksi secara otomatis.
              </span>
              <button
                type="button"
                onClick={handlePasteSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <TableProperties className="w-4 h-4" />
                <span>Muat Data dari Clipboard</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
