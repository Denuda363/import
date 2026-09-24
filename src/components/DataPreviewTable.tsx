import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
  Search,
  ArrowRight,
  SplitSquareVertical,
  Columns,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DataRow } from '../types/transformer';
import { copyTableToClipboard, exportToCsv, exportToExcel } from '../utils/excel';

interface DataPreviewTableProps {
  sourceHeaders: string[];
  sourceRows: DataRow[];
  targetHeaders: string[];
  targetRows: DataRow[];
  transformationLogs: string[];
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  sourceHeaders,
  sourceRows,
  targetHeaders,
  targetRows,
  transformationLogs,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'target' | 'source'>('split');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportName, setExportName] = useState('Data_Hasil_Image2');

  // Pagination for Source
  const [sourcePage, setSourcePage] = useState(1);
  const rowsPerPage = 10;

  // Pagination for Target
  const [targetPage, setTargetPage] = useState(1);

  // Filter Target Rows
  const filteredTargetRows = targetRows.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return targetHeaders.some((h) => String(row[h] ?? '').toLowerCase().includes(term));
  });

  // Filter Source Rows
  const filteredSourceRows = sourceRows.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return sourceHeaders.some((h) => String(row[h] ?? '').toLowerCase().includes(term));
  });

  const totalTargetPages = Math.ceil(filteredTargetRows.length / rowsPerPage) || 1;
  const currentTargetSlice = filteredTargetRows.slice(
    (targetPage - 1) * rowsPerPage,
    targetPage * rowsPerPage
  );

  const totalSourcePages = Math.ceil(filteredSourceRows.length / rowsPerPage) || 1;
  const currentSourceSlice = filteredSourceRows.slice(
    (sourcePage - 1) * rowsPerPage,
    sourcePage * rowsPerPage
  );

  const handleCopyClipboard = async () => {
    try {
      await copyTableToClipboard(targetHeaders, targetRows);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportXlsx = () => {
    exportToExcel(targetHeaders, targetRows, `${exportName}.xlsx`);
  };

  const handleExportCsv = () => {
    exportToCsv(targetHeaders, targetRows, `${exportName}.csv`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Header bar with controls & download buttons */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-all ${
              viewMode === 'split'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bandingkan (Image 1 vs 2)</span>
          </button>
          <button
            onClick={() => setViewMode('target')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-all ${
              viewMode === 'target'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hasil Akhir (Image 2)</span>
          </button>
          <button
            onClick={() => setViewMode('source')}
            className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition-all ${
              viewMode === 'source'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-slate-600" />
            <span>Format Asal (Image 1)</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari data dalam tabel..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleCopyClipboard}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center space-x-1.5 transition-all shadow-2xs"
            title="Salin data hasil ke Clipboard agar bisa langsung di-paste di Excel (Ctrl+V)"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Salin Data</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center space-x-1.5 transition-all shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportXlsx}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="px-4 py-2 bg-emerald-50/40 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Format Awal (Image 1):</span>
            <span className="font-semibold text-slate-800">
              {sourceRows.length} baris, {sourceHeaders.length} kolom
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Format Hasil (Image 2):</span>
            <span className="font-bold text-emerald-700">
              {targetRows.length} baris, {targetHeaders.length} kolom
            </span>
          </div>
        </div>

        {transformationLogs.length > 0 && (
          <div className="text-[11px] text-emerald-800 font-medium bg-emerald-100/60 px-2 py-0.5 rounded">
            {transformationLogs[transformationLogs.length - 1]}
          </div>
        )}
      </div>

      {/* Tables View Area */}
      <div className="p-4 overflow-hidden">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Image 1 (Source) */}
            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span>Format Awal (Image 1)</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {filteredSourceRows.length} baris
                </span>
              </div>
              <div className="overflow-x-auto max-h-96 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2 w-10 text-center text-slate-400">#</th>
                      {sourceHeaders.map((h) => (
                        <th key={h} className="p-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {currentSourceSlice.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400 select-none">
                          {(sourcePage - 1) * rowsPerPage + idx + 1}
                        </td>
                        {sourceHeaders.map((h) => (
                          <td key={h} className="p-2 whitespace-nowrap text-slate-800">
                            {row[h] !== undefined && row[h] !== null ? String(row[h]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {currentSourceSlice.length === 0 && (
                      <tr>
                        <td
                          colSpan={sourceHeaders.length + 1}
                          className="p-6 text-center text-slate-400 italic"
                        >
                          Tidak ada data yang ditampilkan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Source Pagination */}
              <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Hal {sourcePage} dari {totalSourcePages}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSourcePage((p) => Math.max(1, p - 1))}
                    disabled={sourcePage === 1}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSourcePage((p) => Math.min(totalSourcePages, p + 1))}
                    disabled={sourcePage === totalSourcePages}
                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Image 2 (Target) */}
            <div className="border border-emerald-200 rounded-lg overflow-hidden flex flex-col bg-emerald-50/10">
              <div className="bg-emerald-600 px-3 py-2 text-white flex items-center justify-between">
                <span className="text-xs font-bold flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Format Target (Image 2) - Siap Ekspor</span>
                </span>
                <span className="text-[11px] text-emerald-100">
                  {filteredTargetRows.length} baris
                </span>
              </div>
              <div className="overflow-x-auto max-h-96 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-emerald-50 text-emerald-900 font-semibold sticky top-0 border-b border-emerald-200">
                    <tr>
                      <th className="p-2 w-10 text-center text-emerald-600">#</th>
                      {targetHeaders.map((h) => (
                        <th key={h} className="p-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 font-mono text-[11px]">
                    {currentTargetSlice.map((row, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/40">
                        <td className="p-2 text-center text-emerald-700 font-semibold select-none">
                          {(targetPage - 1) * rowsPerPage + idx + 1}
                        </td>
                        {targetHeaders.map((h) => (
                          <td key={h} className="p-2 whitespace-nowrap text-slate-800">
                            {row[h] !== undefined && row[h] !== null ? String(row[h]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {currentTargetSlice.length === 0 && (
                      <tr>
                        <td
                          colSpan={targetHeaders.length + 1}
                          className="p-6 text-center text-slate-400 italic"
                        >
                          Tidak ada data yang ditampilkan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Target Pagination */}
              <div className="p-2 bg-emerald-50/60 border-t border-emerald-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Hal {targetPage} dari {totalTargetPages}
                </span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setTargetPage((p) => Math.max(1, p - 1))}
                    disabled={targetPage === 1}
                    className="p-1 rounded hover:bg-emerald-100 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTargetPage((p) => Math.min(totalTargetPages, p + 1))}
                    disabled={targetPage === totalTargetPages}
                    className="p-1 rounded hover:bg-emerald-100 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : viewMode === 'target' ? (
          /* Full Screen Target */
          <div className="border border-emerald-200 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-emerald-600 px-4 py-2.5 text-white flex items-center justify-between">
              <span className="text-sm font-bold flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>Format Hasil Target (Image 2)</span>
              </span>
              <span className="text-xs text-emerald-100">
                Total {filteredTargetRows.length} baris data
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px] text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-emerald-50 text-emerald-900 font-semibold sticky top-0 border-b border-emerald-200">
                  <tr>
                    <th className="p-2.5 w-12 text-center text-emerald-600">#</th>
                    {targetHeaders.map((h) => (
                      <th key={h} className="p-2.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 font-mono text-xs">
                  {currentTargetSlice.map((row, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30">
                      <td className="p-2.5 text-center text-emerald-700 font-bold select-none">
                        {(targetPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      {targetHeaders.map((h) => (
                        <td key={h} className="p-2.5 whitespace-nowrap text-slate-800">
                          {row[h] !== undefined && row[h] !== null ? String(row[h]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-emerald-50/60 border-t border-emerald-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                Menampilkan halaman {targetPage} dari {totalTargetPages} (
                {filteredTargetRows.length} total baris)
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setTargetPage((p) => Math.max(1, p - 1))}
                  disabled={targetPage === 1}
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-30 font-medium"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setTargetPage((p) => Math.min(totalTargetPages, p + 1))}
                  disabled={targetPage === totalTargetPages}
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-30 font-medium"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Screen Source */
          <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-slate-800 px-4 py-2.5 text-white flex items-center justify-between">
              <span className="text-sm font-bold flex items-center space-x-2">
                <Columns className="w-4 h-4" />
                <span>Format Asal Input (Image 1)</span>
              </span>
              <span className="text-xs text-slate-300">
                Total {filteredSourceRows.length} baris data
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px] text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-semibold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-12 text-center text-slate-400">#</th>
                    {sourceHeaders.map((h) => (
                      <th key={h} className="p-2.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {currentSourceSlice.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-center text-slate-400 select-none">
                        {(sourcePage - 1) * rowsPerPage + idx + 1}
                      </td>
                      {sourceHeaders.map((h) => (
                        <td key={h} className="p-2.5 whitespace-nowrap text-slate-800">
                          {row[h] !== undefined && row[h] !== null ? String(row[h]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                Menampilkan halaman {sourcePage} dari {totalSourcePages} (
                {filteredSourceRows.length} total baris)
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setSourcePage((p) => Math.max(1, p - 1))}
                  disabled={sourcePage === 1}
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-30 font-medium"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() => setSourcePage((p) => Math.min(totalSourcePages, p + 1))}
                  disabled={sourcePage === totalSourcePages}
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-30 font-medium"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
