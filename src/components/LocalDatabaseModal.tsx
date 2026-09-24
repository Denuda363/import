import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Database,
  History,
  Bookmark,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  Play,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Plus,
  Save,
  AlertTriangle,
} from 'lucide-react';
import {
  LocalDatabaseStats,
  SavedDataset,
  SavedHistoryItem,
  SavedTemplate,
} from '../types/database';
import {
  clearAllHistory,
  clearEntireLocalDatabase,
  deleteCustomTemplate,
  deleteDataset,
  deleteHistoryItem,
  exportDatabaseBackup,
  getAllDatasets,
  getAllHistory,
  getAllTemplates,
  getLocalDatabaseStats,
  importDatabaseBackup,
  saveCustomTemplate,
  saveDataset,
} from '../utils/localDatabase';
import { TableData, TransformationPipeline } from '../types/transformer';

interface LocalDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPipeline: TransformationPipeline;
  currentTableData: TableData;
  onLoadHistoryItem: (item: SavedHistoryItem) => void;
  onLoadTemplate: (template: SavedTemplate) => void;
  onLoadDataset: (dataset: SavedDataset) => void;
}

export const LocalDatabaseModal: React.FC<LocalDatabaseModalProps> = ({
  isOpen,
  onClose,
  currentPipeline,
  currentTableData,
  onLoadHistoryItem,
  onLoadTemplate,
  onLoadDataset,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'templates' | 'datasets' | 'backup'>('history');
  const [stats, setStats] = useState<LocalDatabaseStats | null>(null);
  const [historyList, setHistoryList] = useState<SavedHistoryItem[]>([]);
  const [templateList, setTemplateList] = useState<SavedTemplate[]>([]);
  const [datasetList, setDatasetList] = useState<SavedDataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Template Form Dialog
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateCat, setNewTemplateCat] = useState('Kustom');

  // New Dataset Form Dialog
  const [showNewDatasetDialog, setShowNewDatasetDialog] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');

  const backupInputRef = useRef<HTMLInputElement>(null);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [st, hist, tpls, dts] = await Promise.all([
        getLocalDatabaseStats(),
        getAllHistory(),
        getAllTemplates(),
        getAllDatasets(),
      ]);
      setStats(st);
      setHistoryList(hist);
      setTemplateList(tpls);
      setDatasetList(dts);
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const showMsg = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isOpen) return null;

  // Handle saving new template
  const handleSaveCurrentAsTemplate = async () => {
    if (!newTemplateName.trim()) return;
    try {
      await saveCustomTemplate({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || 'Template transformasi pengguna',
        category: newTemplateCat.trim() || 'Kustom',
        pipeline: currentPipeline,
      });
      setShowNewTemplateDialog(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      await refreshData();
      showMsg('Template berhasil disimpan ke Database Lokal!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan template');
    }
  };

  // Handle saving current dataset
  const handleSaveCurrentDataset = async () => {
    if (!newDatasetName.trim() || !currentTableData) return;
    try {
      await saveDataset({
        name: newDatasetName.trim(),
        fileName: currentTableData.fileName,
        sheetName: currentTableData.currentSheet,
        headers: currentTableData.headers,
        rows: currentTableData.rows,
        totalRows: currentTableData.totalRows,
      });
      setShowNewDatasetDialog(false);
      setNewDatasetName('');
      await refreshData();
      showMsg('Dataset berhasil disimpan ke Database Lokal!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan dataset');
    }
  };

  // Delete handlers
  const handleDeleteHistory = async (id: string) => {
    await deleteHistoryItem(id);
    await refreshData();
    showMsg('Riwayat dihapus.');
  };

  const handleClearHistory = async () => {
    if (confirm('Yakin ingin menghapus seluruh riwayat konversi?')) {
      await clearAllHistory();
      await refreshData();
      showMsg('Seluruh riwayat dibersihkan.');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteCustomTemplate(id);
    await refreshData();
    showMsg('Template dihapus.');
  };

  const handleDeleteDataset = async (id: string) => {
    await deleteDataset(id);
    await refreshData();
    showMsg('Dataset dihapus.');
  };

  // Backup & Restore
  const handleExportBackup = async () => {
    await exportDatabaseBackup();
    showMsg('Backup database berhasil diunduh!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await importDatabaseBackup(json);
        await refreshData();
        showMsg(
          `Berhasil memulihkan: ${res.importedHistory} riwayat, ${res.importedTemplates} template, ${res.importedDatasets} dataset.`
        );
      } catch (err: any) {
        alert('Gagal memproses file backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (confirm('PERINGATAN: Ini akan mengosongkan seluruh database lokal (riwayat, template, dataset). Lanjutkan?')) {
      await clearEntireLocalDatabase();
      await refreshData();
      showMsg('Seluruh database lokal telah di-reset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">Database Lokal (Local Database)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Tersimpan Offline di Perangkat
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penyimpanan persisten lokal untuk riwayat konversi, template aturan, dan dataset
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Overview Quick Bar */}
        <div className="bg-slate-800 text-slate-300 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs border-b border-slate-700 gap-3">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Kapasitas Terpakai:{' '}
                <strong className="text-white font-mono">
                  {stats ? `${(stats.estimatedSizeBytes / 1024).toFixed(1)} KB` : '0 KB'}
                </strong>
              </span>
            </span>
            <span>
              Total Entri:{' '}
              <strong className="text-white">
                {(stats?.historyCount || 0) + (stats?.templateCount || 0) + (stats?.datasetCount || 0)}
              </strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>IndexedDB Siap</span>
            </span>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold text-center transition-all">
            {notification}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 flex space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Konversi ({historyList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'templates'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Template Saya ({templateList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('datasets')}
            className={`py-3 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'datasets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Dataset Tersimpan ({datasetList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 flex items-center space-x-1.5 border-b-2 transition-colors ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Backup & Kelola</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-700 space-y-4">
          {/* TAB 1: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">
                  Daftar seluruh proses konversi Image 1 ke Image 2 yang pernah Anda jalankan.
                </p>
                {historyList.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-red-600 hover:text-red-700 text-xs font-semibold flex items-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Seluruh Riwayat</span>
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Belum Ada Riwayat Konversi</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Setiap kali Anda menerapkan transformasi atau mengunduh Excel, data akan otomatis
                    tercatat di database ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 text-sm">{item.title}</span>
                          <span className="text-slate-400 text-[11px]">
                            ({new Date(item.createdAt).toLocaleString('id-ID')})
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
                          <span>Berkas: {item.fileName}</span>
                          <span>•</span>
                          <span>
                            {item.sourceRowCount} b / {item.sourceColCount} k &rarr;{' '}
                            <strong className="text-emerald-700 font-bold">
                              {item.targetRowCount} b / {item.targetColCount} k
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onLoadHistoryItem(item);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1 transition-colors shadow-2xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Muat Data Ini</span>
                        </button>

                        <button
                          onClick={() => handleDeleteHistory(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Hapus entri riwayat ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">
                  Simpan pola kolom dan aturan transformasi agar bisa digunakan kembali kapan saja.
                </p>
                <button
                  onClick={() => setShowNewTemplateDialog(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Aturan Saat Ini</span>
                </button>
              </div>

              {/* Add New Template Form */}
              {showNewTemplateDialog && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-emerald-900 text-sm">
                    Simpan Konfigurasi Saat Ini Sebagai Template
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Template:
                      </label>
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Misal: Format Laporan Shopee ke Jurnal"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kategori:
                      </label>
                      <input
                        type="text"
                        value={newTemplateCat}
                        onChange={(e) => setNewTemplateCat(e.target.value)}
                        placeholder="Misal: Keuangan / Penjualan"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Deskripsi:
                      </label>
                      <input
                        type="text"
                        value={newTemplateDesc}
                        onChange={(e) => setNewTemplateDesc(e.target.value)}
                        placeholder="Penjelasan singkat format Image 2 yang dihasilkan"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowNewTemplateDialog(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveCurrentAsTemplate}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                    >
                      Simpan Template
                    </button>
                  </div>
                </div>
              )}

              {templateList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Belum Ada Template Kustom</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Klik tombol "Simpan Aturan Saat Ini" di atas untuk menyimpan pengaturan kolom Anda ke
                    database lokal.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templateList.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 text-sm">{tpl.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-2">{tpl.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Diperbarui: {new Date(tpl.updatedAt).toLocaleDateString('id-ID')}
                        </span>
                        <div className="flex space-x-1.5">
                          <button
                            onClick={() => {
                              onLoadTemplate(tpl);
                              onClose();
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold flex items-center space-x-1 shadow-2xs"
                          >
                            <Play className="w-3 h-3" />
                            <span>Terapkan</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Hapus template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DATASETS */}
          {activeTab === 'datasets' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-slate-500">
                  Simpan file data tabel ke database lokal agar tidak perlu upload ulang dari file explorer.
                </p>
                <button
                  onClick={() => setShowNewDatasetDialog(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan Tabel Saat Ini</span>
                </button>
              </div>

              {/* Add Dataset Form */}
              {showNewDatasetDialog && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <h4 className="font-bold text-emerald-900 text-sm">
                    Simpan Tabel Saat Ini ke Database Lokal
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Dataset:
                    </label>
                    <input
                      type="text"
                      value={newDatasetName}
                      onChange={(e) => setNewDatasetName(e.target.value)}
                      placeholder="Misal: Data Penjualan Cabang Q3"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowNewDatasetDialog(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveCurrentDataset}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold"
                    >
                      Simpan Dataset
                    </button>
                  </div>
                </div>
              )}

              {datasetList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Belum Ada Dataset Tersimpan</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    Simpan tabel spreadsheet yang sering dipakai langsung ke database lokal browser Anda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {datasetList.map((dt) => (
                    <div
                      key={dt.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-800 text-sm">{dt.name}</span>
                          <span className="text-[11px] text-slate-400">({dt.fileName})</span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                          {dt.totalRows} baris • {dt.headers.length} kolom: {dt.headers.slice(0, 4).join(', ')}...
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onLoadDataset(dt);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold flex items-center space-x-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Buka Tabel</span>
                        </button>
                        <button
                          onClick={() => handleDeleteDataset(dt.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          title="Hapus dataset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BACKUP & MANAGEMENT */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Cadangkan / Ekspor Database Lokal</span>
                </h4>
                <p className="text-slate-600 text-xs">
                  Unduh seluruh isi database lokal (riwayat konversi, template kustom, dan dataset
                  tersimpan) ke dalam berkas JSON cadangan.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Cadangan Database (.json)</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Pulihkan / Impor Cadangan Database</span>
                </h4>
                <p className="text-slate-600 text-xs">
                  Pulihkan data riwayat atau template dari file cadangan JSON yang pernah Anda simpan
                  sebelumnya.
                </p>
                <input
                  ref={backupInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackup}
                />
                <button
                  onClick={() => backupInputRef.current?.click()}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center space-x-2 shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Pilih File Backup JSON untuk Dipulihkan</span>
                </button>
              </div>

              <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <h4 className="font-bold text-red-800 text-sm flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Zona Bahaya: Reset Database Lokal</span>
                </h4>
                <p className="text-red-700 text-xs">
                  Menghapus permanen seluruh riwayat, template kustom, dan dataset yang tersimpan di
                  browser komputer ini.
                </p>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Kosongkan Seluruh Database Lokal</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Database tersimpan di: <strong>IndexedDB Browser (ExcelTransformerLocalDB)</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
