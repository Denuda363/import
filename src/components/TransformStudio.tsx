import React, { useState } from 'react';
import {
  Wand2,
  Columns,
  TableCellsSplit,
  ArrowDownToLine,
  Filter,
  Plus,
  Trash2,
  Sparkles,
  MoveUp,
  MoveDown,
  Info,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  ColumnActionType,
  ColumnMappingRule,
  TransformationPipeline,
} from '../types/transformer';

interface TransformStudioProps {
  sourceHeaders: string[];
  pipeline: TransformationPipeline;
  onUpdatePipeline: (newPipeline: TransformationPipeline) => void;
  onApplyPipeline: () => void;
  onTriggerAiTransform: (prompt: string) => Promise<void>;
  isAiProcessing: boolean;
}

export const TransformStudio: React.FC<TransformStudioProps> = ({
  sourceHeaders,
  pipeline,
  onUpdatePipeline,
  onApplyPipeline,
  onTriggerAiTransform,
  isAiProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<
    'unpivot' | 'filldown' | 'columns' | 'clean' | 'ai'
  >('unpivot');
  const [aiPrompt, setAiPrompt] = useState('');

  // Unpivot toggles
  const handleToggleUnpivot = (enabled: boolean) => {
    onUpdatePipeline({
      ...pipeline,
      unpivot: {
        ...pipeline.unpivot,
        enabled,
      },
    });
  };

  const handleToggleIdColumn = (col: string) => {
    const currentIds = pipeline.unpivot.config.idColumns;
    const exists = currentIds.includes(col);
    const newIds = exists ? currentIds.filter((c) => c !== col) : [...currentIds, col];

    // Remove from valueColumns if it was there
    const newVals = pipeline.unpivot.config.valueColumns.filter((c) => !newIds.includes(c));

    onUpdatePipeline({
      ...pipeline,
      unpivot: {
        ...pipeline.unpivot,
        config: {
          ...pipeline.unpivot.config,
          idColumns: newIds,
          valueColumns: newVals,
        },
      },
    });
  };

  const handleToggleValueColumn = (col: string) => {
    const currentVals = pipeline.unpivot.config.valueColumns;
    const exists = currentVals.includes(col);
    const newVals = exists ? currentVals.filter((c) => c !== col) : [...currentVals, col];

    // Remove from idColumns if it was there
    const newIds = pipeline.unpivot.config.idColumns.filter((c) => !newVals.includes(c));

    onUpdatePipeline({
      ...pipeline,
      unpivot: {
        ...pipeline.unpivot,
        config: {
          ...pipeline.unpivot.config,
          idColumns: newIds,
          valueColumns: newVals,
        },
      },
    });
  };

  // Fill down toggles
  const handleToggleFillDownCol = (col: string) => {
    const current = pipeline.fillDown.targetColumns;
    const exists = current.includes(col);
    const targetColumns = exists ? current.filter((c) => c !== col) : [...current, col];

    onUpdatePipeline({
      ...pipeline,
      fillDown: { targetColumns },
    });
  };

  // Column rule updates
  const handleAddColumnRule = () => {
    const newRule: ColumnMappingRule = {
      id: String(Date.now()),
      sourceColumn: sourceHeaders[0] || 'Kolom_1',
      targetColumn: `Kolom_${pipeline.columnMappings.length + 1}`,
      action: 'keep',
    };
    onUpdatePipeline({
      ...pipeline,
      columnMappings: [...pipeline.columnMappings, newRule],
    });
  };

  const handleUpdateRule = (index: number, updated: Partial<ColumnMappingRule>) => {
    const newRules = [...pipeline.columnMappings];
    newRules[index] = { ...newRules[index], ...updated };
    onUpdatePipeline({
      ...pipeline,
      columnMappings: newRules,
    });
  };

  const handleDeleteRule = (index: number) => {
    const newRules = pipeline.columnMappings.filter((_, idx) => idx !== index);
    onUpdatePipeline({
      ...pipeline,
      columnMappings: newRules,
    });
  };

  const handleMoveRule = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === pipeline.columnMappings.length - 1) return;
    const newRules = [...pipeline.columnMappings];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newRules[index];
    newRules[index] = newRules[targetIdx];
    newRules[targetIdx] = temp;
    onUpdatePipeline({
      ...pipeline,
      columnMappings: newRules,
    });
  };

  const handleResetColumnRules = () => {
    const defaultRules: ColumnMappingRule[] = sourceHeaders.map((h, i) => ({
      id: String(i),
      sourceColumn: h,
      targetColumn: h,
      action: 'keep',
    }));
    onUpdatePipeline({
      ...pipeline,
      columnMappings: defaultRules,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Studio Header & Tab Navigation */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Studio Transformasi (Konfigurasi Format Image 2)
              </h2>
              <p className="text-xs text-slate-500">
                Atur bagaimana data Format Image 1 diubah menjadi Format Image 2
              </p>
            </div>
          </div>

          <button
            onClick={onApplyPipeline}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Terapkan Perubahan</span>
          </button>
        </div>

        {/* Tab Pills */}
        <div className="mt-3 flex space-x-1 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('unpivot')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'unpivot'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <TableCellsSplit className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. Unpivot (Matrix ke Baris)</span>
            {pipeline.unpivot.enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('filldown')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'filldown'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Fill-Down (Merge Cell)</span>
            {pipeline.fillDown.targetColumns.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('columns')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'columns'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-purple-600" />
            <span>3. Kolom & Format Target</span>
            {pipeline.columnMappings.length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 text-[10px] rounded-full font-bold">
                {pipeline.columnMappings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('clean')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'clean'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>4. Filter & Bersihkan</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium whitespace-nowrap transition-colors ${
              activeTab === 'ai'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold border border-slate-200'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-600" />
            <span>AI Smart Transform</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-5 text-xs">
        {/* TAB 1: UNPIVOT */}
        {activeTab === 'unpivot' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
              <div className="flex items-start space-x-2.5">
                <TableCellsSplit className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">
                    Fitur Unpivot (Wide Matrix ke Flat Records)
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    Gunakan ini jika Image 1 memiliki kolom berulang (seperti kolom bulan Januari,
                    Februari, Maret atau Tanggal 1 s/d 31) dan Image 2 ingin menjadikannya satu
                    kolom Periode dan satu kolom Nilai.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={pipeline.unpivot.enabled}
                  onChange={(e) => handleToggleUnpivot(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {pipeline.unpivot.enabled ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fixed ID Columns */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">
                      Kolom Kunci Tetap (ID Columns):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {pipeline.unpivot.config.idColumns.length} terpilih
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Kolom yang nilainya tetap/diulang pada setiap baris (misal: Kode Produk, Nama,
                    Kategori):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white border border-slate-200 rounded">
                    {sourceHeaders.map((col) => {
                      const isSelected = pipeline.unpivot.config.idColumns.includes(col);
                      return (
                        <button
                          key={col}
                          onClick={() => handleToggleIdColumn(col)}
                          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 mr-0.5" />}
                          <span>{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Matrix / Value Columns */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">
                      Kolom Matrix yang Diubah ke Baris:
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {pipeline.unpivot.config.valueColumns.length} terpilih
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Kolom-kolom yang ingin di-unpivot (misal: Jan, Feb, Mar, Apr):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white border border-slate-200 rounded">
                    {sourceHeaders.map((col) => {
                      const isSelected = pipeline.unpivot.config.valueColumns.includes(col);
                      return (
                        <button
                          key={col}
                          onClick={() => handleToggleValueColumn(col)}
                          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 mr-0.5" />}
                          <span>{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Column Names */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Header Kolom Atribut di Image 2:
                    </label>
                    <input
                      type="text"
                      value={pipeline.unpivot.config.attributeHeader}
                      onChange={(e) =>
                        onUpdatePipeline({
                          ...pipeline,
                          unpivot: {
                            ...pipeline.unpivot,
                            config: {
                              ...pipeline.unpivot.config,
                              attributeHeader: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Contoh: Bulan / Periode"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Header Kolom Nilai di Image 2:
                    </label>
                    <input
                      type="text"
                      value={pipeline.unpivot.config.valueHeader}
                      onChange={(e) =>
                        onUpdatePipeline({
                          ...pipeline,
                          unpivot: {
                            ...pipeline.unpivot,
                            config: {
                              ...pipeline.unpivot.config,
                              valueHeader: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="Contoh: Jumlah / Nilai Penjualan"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                Unpivot saat ini tidak aktif. Aktifkan saklar di atas jika format Image 1 adalah tabel
                matrix dan Image 2 adalah tabel vertikal panjang.
              </p>
            )}
          </div>
        )}

        {/* TAB 2: FILL DOWN */}
        {activeTab === 'filldown' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2.5">
                <ArrowDownToLine className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">
                    Isi Sel Kosong / Merged Cell (Forward Fill-Down)
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    Di Excel, saat beberapa baris di-merge (misalnya 1 No Faktur memiliki 5 barang,
                    baris 2 s/d 5 selnya kosong). Fitur ini otomatis menduplikasi nilai baris atas ke
                    sel yang kosong di bawahnya.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Pilih Kolom yang Memiliki Sel Kosong / Merge Cell:
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {sourceHeaders.map((col) => {
                  const isSelected = pipeline.fillDown.targetColumns.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={() => handleToggleFillDownCol(col)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{col}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLUMNS & TARGET FORMAT */}
        {activeTab === 'columns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800">
                  Daftar Kolom Format Target (Image 2)
                </h4>
                <p className="text-slate-500">
                  Sesuaikan nama header, urutan kolom, rumus, pemisahan teks, atau format mata uang
                  / tanggal
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleResetColumnRules}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-300 bg-white rounded hover:bg-slate-50 transition-colors font-medium"
                >
                  Muat Ulang Kolom
                </button>
                <button
                  onClick={handleAddColumnRule}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center space-x-1 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kolom</span>
                </button>
              </div>
            </div>

            {/* Column Rules List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {pipeline.columnMappings.map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center gap-2 hover:border-slate-300 transition-colors"
                >
                  {/* Order controls */}
                  <div className="flex flex-col space-y-0.5">
                    <button
                      onClick={() => handleMoveRule(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Geser ke Atas"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveRule(idx, 'down')}
                      disabled={idx === pipeline.columnMappings.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                      title="Geser ke Bawah"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-6 text-center font-bold text-slate-400">{idx + 1}</span>

                  {/* Source Column Selector */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Kolom Asal (Image 1)
                    </label>
                    <select
                      value={rule.sourceColumn}
                      onChange={(e) => handleUpdateRule(idx, { sourceColumn: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      {sourceHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transformation Action */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Aksi / Transformasi
                    </label>
                    <select
                      value={rule.action}
                      onChange={(e) =>
                        handleUpdateRule(idx, { action: e.target.value as ColumnActionType })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="keep">Biarkan Asli</option>
                      <option value="rename">Ganti Nama Saja</option>
                      <option value="uppercase">HURUF BESAR (UPPERCASE)</option>
                      <option value="lowercase">huruf kecil (lowercase)</option>
                      <option value="titlecase">Huruf Kapital Awal (Title Case)</option>
                      <option value="currency_format">Format Rupiah (Rp 1.000.000)</option>
                      <option value="number_format">Format Angka Ribuan (1.000)</option>
                      <option value="date_format">Format Tanggal (DD/MM/YYYY)</option>
                      <option value="split">Pecah Kolom (Split Delimiter)</option>
                      <option value="combine">Gabungkan dengan Kolom Lain</option>
                    </select>
                  </div>

                  {/* Target Column Name */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                      Nama Header Target (Image 2)
                    </label>
                    <input
                      type="text"
                      value={rule.targetColumn}
                      onChange={(e) => handleUpdateRule(idx, { targetColumn: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-emerald-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Extra options for Split */}
                  {rule.action === 'split' && (
                    <div className="w-full sm:w-auto flex items-center space-x-2 bg-purple-50 p-1.5 rounded border border-purple-200 mt-1">
                      <div>
                        <span className="text-[10px] text-purple-700 font-semibold mr-1">
                          Pemisah:
                        </span>
                        <input
                          type="text"
                          value={rule.splitDelimiter || ' - '}
                          onChange={(e) => handleUpdateRule(idx, { splitDelimiter: e.target.value })}
                          className="w-14 px-1.5 py-0.5 bg-white border border-purple-300 rounded text-center text-xs"
                          placeholder="misal - atau ,"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-700 font-semibold mr-1">
                          Bagian ke:
                        </span>
                        <select
                          value={rule.splitIndex ?? 0}
                          onChange={(e) =>
                            handleUpdateRule(idx, { splitIndex: parseInt(e.target.value) })
                          }
                          className="px-1.5 py-0.5 bg-white border border-purple-300 rounded text-xs"
                        >
                          <option value={0}>Bagian 1 (Awal)</option>
                          <option value={1}>Bagian 2</option>
                          <option value={2}>Bagian 3</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Extra options for Combine */}
                  {rule.action === 'combine' && (
                    <div className="w-full sm:w-auto flex items-center space-x-2 bg-blue-50 p-1.5 rounded border border-blue-200 mt-1">
                      <span className="text-[10px] text-blue-700 font-semibold">Gabung dengan:</span>
                      <select
                        value={rule.combineWithColumn || ''}
                        onChange={(e) => handleUpdateRule(idx, { combineWithColumn: e.target.value })}
                        className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs"
                      >
                        <option value="">Pilih kolom...</option>
                        {sourceHeaders
                          .filter((h) => h !== rule.sourceColumn)
                          .map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        value={rule.combineSeparator ?? ' - '}
                        onChange={(e) => handleUpdateRule(idx, { combineSeparator: e.target.value })}
                        className="w-14 px-1.5 py-0.5 bg-white border border-blue-300 rounded text-center text-xs"
                        placeholder="Pemisah"
                      />
                    </div>
                  )}

                  {/* Delete Rule */}
                  <button
                    onClick={() => handleDeleteRule(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors self-center"
                    title="Hapus Kolom ini dari Image 2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: FILTER & CLEAN */}
        {activeTab === 'clean' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2.5">
                <Filter className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">Pembersihan Baris & Spasi</h4>
                  <p className="text-slate-600 mt-0.5">
                    Hapus baris kosong dan baris rekapan 'TOTAL' atau 'SUBTOTAL' yang biasanya ada di
                    bawah file Excel lama agar tidak mengotori database Image 2.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pipeline.filterClean.removeEmptyRows}
                  onChange={(e) =>
                    onUpdatePipeline({
                      ...pipeline,
                      filterClean: {
                        ...pipeline.filterClean,
                        removeEmptyRows: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-700">Hapus Baris Kosong Total</span>
                  <p className="text-[11px] text-slate-500">
                    Otomatis buang baris yang tidak memiliki data apapun.
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pipeline.filterClean.removeTotalRows}
                  onChange={(e) =>
                    onUpdatePipeline({
                      ...pipeline,
                      filterClean: {
                        ...pipeline.filterClean,
                        removeTotalRows: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-700">
                    Hapus Baris Subtotal / Grand Total
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Mendeteksi kata kunci seperti "Total", "Grand Total", "Subtotal", atau "Jumlah"
                    dan menghapusnya dari data transaksi.
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pipeline.filterClean.trimAllWhitespace}
                  onChange={(e) =>
                    onUpdatePipeline({
                      ...pipeline,
                      filterClean: {
                        ...pipeline.filterClean,
                        trimAllWhitespace: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-slate-700">
                    Bersihkan Spasi Berlebih (Trim Whitespace)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Menghilangkan spasi tak terlihat di depan atau di belakang teks di setiap sel.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* TAB 5: AI SMART PROMPT */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="p-3 bg-pink-50/60 border border-pink-200 rounded-lg">
              <div className="flex items-start space-x-2.5">
                <Sparkles className="w-5 h-5 text-pink-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800">
                    AI Smart Prompt (Transformasi dengan Perintah Teks)
                  </h4>
                  <p className="text-slate-600 mt-0.5">
                    Ketik perintah dalam Bahasa Indonesia untuk memerintahkan AI memformat tabel
                    sesuai keinginan Anda.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Contoh: Gabungkan kolom Nama Depan dan Nama Belakang jadi satu kolom Nama Lengkap, lalu ubah angka di kolom Gaji menjadi format Rupiah."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 font-sans bg-slate-50"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  disabled={!aiPrompt.trim() || isAiProcessing}
                  onClick={() => onTriggerAiTransform(aiPrompt)}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAiProcessing ? 'AI Sedang Memproses...' : 'Proses dengan AI'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
