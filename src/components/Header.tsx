import React from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  HelpCircle,
  RotateCcw,
  Layers,
  ArrowRight,
  ImageIcon,
  Database,
} from 'lucide-react';
import { PRESET_SCENARIOS } from '../utils/presets';
import { PresetScenario } from '../types/transformer';

interface HeaderProps {
  currentPresetId: string | null;
  onSelectPreset: (preset: PresetScenario) => void;
  onOpenVisionModal: () => void;
  onOpenHelpModal: () => void;
  onOpenDatabaseModal: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPresetId,
  onSelectPreset,
  onOpenVisionModal,
  onOpenHelpModal,
  onOpenDatabaseModal,
  onReset,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-4 ring-emerald-50">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Excel Data Format Transformer
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Image 1 <ArrowRight className="w-3 h-3 mx-1" /> Image 2
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ubah format spreadsheet Excel/CSV sesuai pola yang Anda inginkan
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Local Database Button */}
            <button
              onClick={onOpenDatabaseModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-2xs"
              title="Buka Manajemen Database Lokal (Riwayat, Template, Dataset tersimpan)"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Database Lokal</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Database Lokal Aktif"></span>
            </button>

            <button
              onClick={onOpenVisionModal}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
              title="Unggah screenshot Image 1 dan Image 2 untuk dianalisis oleh AI"
            >
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Bandingkan Gambar</span>
              <span className="inline md:hidden">Vision AI</span>
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
            </button>

            <button
              onClick={onOpenHelpModal}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Panduan Penggunaan"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={onReset}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Reset ke Awal"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Selector Banner */}
        <div className="py-2.5 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs scrollbar-thin">
          <span className="font-semibold text-slate-600 flex items-center space-x-1 shrink-0 pl-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Contoh Kasus Cepat:</span>
          </span>
          <div className="flex items-center space-x-2 pb-0.5">
            {PRESET_SCENARIOS.map((preset) => {
              const isActive = currentPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {preset.title.split(':')[0]}: {preset.category}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
