import React from 'react';
import {
  X,
  FileSpreadsheet,
  ArrowRight,
  TableCellsSplit,
  ArrowDownToLine,
  Columns,
  Download,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Panduan Mengubah Format Excel (Image 1 ke Image 2)
              </h3>
              <p className="text-xs text-slate-500">
                Langkah mudah merestrukturisasi tabel spreadsheet secara cepat dan presisi
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

        <div className="p-6 space-y-5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Step 1 */}
          <div className="flex space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Impor Data Excel (Format Image 1)
              </h4>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Tarik file Excel Anda (.xlsx, .xls, .csv) atau cukup salin dan tempel (Ctrl+V) langsung
                dari Microsoft Excel / Google Sheets ke tab "Tempel Data".
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Tentukan Aturan Transformasi yang Diinginkan
              </h4>
              <div className="mt-2 space-y-2">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-emerald-800 flex items-center space-x-1 mb-0.5">
                    <TableCellsSplit className="w-3.5 h-3.5" />
                    <span>Unpivot (Kolom Berulang ke Baris)</span>
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    Jika Image 1 memiliki kolom bulan horizontal (Jan, Feb, Mar...) dan Image 2
                    menjadikannya kolom "Bulan" & kolom "Jumlah".
                  </p>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-blue-800 flex items-center space-x-1 mb-0.5">
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Fill-Down (Mengisi Sel Kosong / Merged Cells)</span>
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    Jika di Image 1 terdapat sel kosong akibat merge cell (misal nomor faktur hanya ada di
                    baris teratas tiap transaksi).
                  </p>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="font-bold text-purple-800 flex items-center space-x-1 mb-0.5">
                    <Columns className="w-3.5 h-3.5" />
                    <span>Penataan Kolom (Rename, Split, Combine, Format Rp/Date)</span>
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    Ganti nama header, urutkan posisi kolom, pecah kolom nama, atau format angka
                    menjadi mata uang Rupiah.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Lihat Pratinjau Berdampingan (Image 1 vs Image 2)
              </h4>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Gunakan mode "Bandingkan (Image 1 vs 2)" untuk memeriksa kesesuaian data baris demi
                baris secara langsung sebelum diekspor.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Download File Excel (.xlsx) / Salin ke Clipboard
              </h4>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Klik tombol hijau "Download Excel (.xlsx)" untuk mengunduh berkas spreadsheet murni
                yang siap diolah lebih lanjut, atau klik "Salin Data" untuk mem-paste langsung kembali
                ke lembar kerja Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            Mengerti & Mulai
          </button>
        </div>
      </div>
    </div>
  );
};
