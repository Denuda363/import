/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { FileUploadZone } from './components/FileUploadZone';
import { TransformStudio } from './components/TransformStudio';
import { DataPreviewTable } from './components/DataPreviewTable';
import { AiVisionModal } from './components/AiVisionModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { LocalDatabaseModal } from './components/LocalDatabaseModal';
import { PRESET_SCENARIOS } from './utils/presets';
import {
  ColumnMappingRule,
  PresetScenario,
  TableData,
  TransformationPipeline,
} from './types/transformer';
import {
  SavedDataset,
  SavedHistoryItem,
  SavedTemplate,
} from './types/database';
import { executeTransformationPipeline } from './utils/transformEngine';
import { parseSheet } from './utils/excel';
import { saveHistoryItem } from './utils/localDatabase';

export default function App() {
  // Active Preset ID
  const [currentPresetId, setCurrentPresetId] = useState<string | null>('unpivot-sales');

  // Source Table Data (Image 1 Format)
  const [tableData, setTableData] = useState<TableData>(() => {
    const defaultPreset = PRESET_SCENARIOS[0];
    return {
      fileName: 'Sample_Rekap_Penjualan_Image1.xlsx',
      sheetNames: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: defaultPreset.sampleInput.headers,
      rows: defaultPreset.sampleInput.rows,
      totalRows: defaultPreset.sampleInput.rows.length,
    };
  });

  // Current active original file reference for sheet switching
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  // Transformation Pipeline
  const [pipeline, setPipeline] = useState<TransformationPipeline>(() => {
    const defaultPreset = PRESET_SCENARIOS[0];
    return {
      fillDown: {
        targetColumns: defaultPreset.pipelineConfig.fillDown?.targetColumns || [],
      },
      unpivot: {
        enabled: defaultPreset.pipelineConfig.unpivot?.enabled ?? true,
        config: defaultPreset.pipelineConfig.unpivot?.config || {
          idColumns: ['Kode_Produk', 'Nama_Produk', 'Kategori'],
          valueColumns: ['Januari', 'Februari', 'Maret', 'April'],
          attributeHeader: 'Periode_Bulan',
          valueHeader: 'Jumlah_Terjual',
          removeEmptyValues: true,
        },
      },
      pivot: {
        enabled: false,
        config: {
          rowColumns: [],
          pivotColumn: '',
          valueColumn: '',
          aggregation: 'sum',
        },
      },
      columnMappings: defaultPreset.pipelineConfig.columnMappings || [],
      filterClean: {
        removeEmptyRows: true,
        removeTotalRows: true,
        totalRowKeywords: ['total', 'subtotal', 'grand total', 'jumlah'],
        trimAllWhitespace: true,
        skipHeaderRowsCount: 0,
      },
    };
  });

  // Target Transformed Data (Image 2 Format)
  const [targetData, setTargetData] = useState<{
    headers: string[];
    rows: Record<string, any>[];
    logs: string[];
  }>({
    headers: [],
    rows: [],
    logs: [],
  });

  // Modals state
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Compute transformed target data
  const runPipeline = () => {
    if (!tableData || tableData.headers.length === 0) return;
    const result = executeTransformationPipeline(
      tableData.headers,
      tableData.rows,
      pipeline
    );
    setTargetData(result);
  };

  // Re-run pipeline when tableData or pipeline changes
  useEffect(() => {
    runPipeline();
  }, [tableData, pipeline]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetScenario) => {
    setCurrentPresetId(preset.id);
    setCurrentFile(null);

    setTableData({
      fileName: `${preset.id}.xlsx`,
      sheetNames: ['Sheet1'],
      currentSheet: 'Sheet1',
      headers: preset.sampleInput.headers,
      rows: preset.sampleInput.rows,
      totalRows: preset.sampleInput.rows.length,
    });

    setPipeline({
      fillDown: {
        targetColumns: preset.pipelineConfig.fillDown?.targetColumns || [],
      },
      unpivot: {
        enabled: preset.pipelineConfig.unpivot?.enabled ?? false,
        config: preset.pipelineConfig.unpivot?.config || {
          idColumns: [],
          valueColumns: [],
          attributeHeader: 'Periode',
          valueHeader: 'Nilai',
          removeEmptyValues: true,
        },
      },
      pivot: {
        enabled: false,
        config: {
          rowColumns: [],
          pivotColumn: '',
          valueColumn: '',
          aggregation: 'sum',
        },
      },
      columnMappings: preset.pipelineConfig.columnMappings || [],
      filterClean: {
        removeEmptyRows: preset.pipelineConfig.filterClean?.removeEmptyRows ?? true,
        removeTotalRows: preset.pipelineConfig.filterClean?.removeTotalRows ?? true,
        totalRowKeywords: preset.pipelineConfig.filterClean?.totalRowKeywords || ['total', 'subtotal'],
        trimAllWhitespace: preset.pipelineConfig.filterClean?.trimAllWhitespace ?? true,
        skipHeaderRowsCount: 0,
      },
    });
  };

  // Handle Uploaded Data
  const handleDataLoaded = (data: TableData) => {
    setCurrentPresetId(null);
    setTableData(data);

    // Auto generate initial column mappings matching the imported file
    const initialMappings: ColumnMappingRule[] = data.headers.map((h, i) => ({
      id: String(i),
      sourceColumn: h,
      targetColumn: h,
      action: 'keep',
    }));

    setPipeline((prev) => ({
      ...prev,
      unpivot: {
        ...prev.unpivot,
        enabled: false,
        config: {
          ...prev.unpivot.config,
          idColumns: data.headers.slice(0, Math.min(2, data.headers.length)),
          valueColumns: data.headers.slice(Math.min(2, data.headers.length)),
        },
      },
      fillDown: {
        targetColumns: [],
      },
      columnMappings: initialMappings,
    }));
  };

  // Switch Sheet
  const handleSheetChange = async (sheetName: string) => {
    if (!currentFile) return;
    try {
      const data = await parseSheet(currentFile, sheetName);
      setTableData(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Save transformation to local database
  const handleSaveToHistory = async () => {
    try {
      const itemToSave = {
        title: `Konversi ${tableData.fileName}`,
        fileName: tableData.fileName,
        sourceRowCount: tableData.rows.length,
        targetRowCount: targetData.rows.length,
        sourceColCount: tableData.headers.length,
        targetColCount: targetData.headers.length,
        sourceHeaders: tableData.headers,
        targetHeaders: targetData.headers,
        pipeline,
        sampleSourceRows: tableData.rows.slice(0, 5),
        sampleTargetRows: targetData.rows.slice(0, 5),
      };

      // 1. Save to Client IndexedDB
      await saveHistoryItem(itemToSave);

      // 2. Also sync to local backend filesystem if available
      try {
        await fetch('/api/db/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemToSave),
        });
      } catch {
        // Local client storage already succeeded
      }
    } catch (err) {
      console.error('Failed to save to local database:', err);
    }
  };

  // Load from local DB
  const handleLoadHistoryItem = (item: SavedHistoryItem) => {
    setCurrentPresetId(null);
    if (item.sampleSourceRows && item.sampleSourceRows.length > 0) {
      setTableData({
        fileName: item.fileName,
        sheetNames: ['Sheet1'],
        currentSheet: 'Sheet1',
        headers: item.sourceHeaders,
        rows: item.sampleSourceRows,
        totalRows: item.sampleSourceRows.length,
      });
    }
    setPipeline(item.pipeline);
  };

  const handleLoadTemplate = (tpl: SavedTemplate) => {
    setCurrentPresetId(null);
    setPipeline(tpl.pipeline);
  };

  const handleLoadDataset = (dataset: SavedDataset) => {
    setCurrentPresetId(null);
    setTableData({
      fileName: dataset.fileName || `${dataset.name}.xlsx`,
      sheetNames: [dataset.sheetName || 'Sheet1'],
      currentSheet: dataset.sheetName || 'Sheet1',
      headers: dataset.headers,
      rows: dataset.rows,
      totalRows: dataset.totalRows,
    });
  };

  // Apply suggested pipeline from AI Vision Modal
  const handleApplyAiPipeline = (suggested: Partial<TransformationPipeline>) => {
    setPipeline((prev) => ({
      ...prev,
      ...suggested,
      fillDown: suggested.fillDown || prev.fillDown,
      unpivot: suggested.unpivot || prev.unpivot,
      filterClean: suggested.filterClean || prev.filterClean,
      columnMappings: suggested.columnMappings || prev.columnMappings,
    }));
  };

  // Trigger Natural Language AI Smart Transform
  const handleTriggerAiTransform = async (prompt: string) => {
    setIsAiProcessing(true);
    try {
      const res = await fetch('/api/ai-transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers: tableData.headers,
          rows: tableData.rows,
          prompt,
        }),
      });
      const data = await res.json();
      if (data.success && data.headers && data.rows) {
        setTargetData({
          headers: data.headers,
          rows: data.rows,
          logs: [data.message || 'Transformasi AI berhasil diterapkan'],
        });
      } else {
        alert(data.message || 'Gagal menjalankan transformasi AI. Coba gunakan studio konfigurasi.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat menghubungi API AI.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    handleSelectPreset(PRESET_SCENARIOS[0]);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        currentPresetId={currentPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenVisionModal={() => setIsVisionModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        onReset={handleReset}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step 1: Upload / Input Zone */}
        <FileUploadZone
          tableData={tableData}
          onDataLoaded={handleDataLoaded}
          onSheetChange={handleSheetChange}
        />

        {/* Step 2: Transformation Engine Studio */}
        <TransformStudio
          sourceHeaders={tableData.headers}
          pipeline={pipeline}
          onUpdatePipeline={setPipeline}
          onApplyPipeline={runPipeline}
          onTriggerAiTransform={handleTriggerAiTransform}
          isAiProcessing={isAiProcessing}
        />

        {/* Step 3: Interactive Dual Preview & Export Table */}
        <DataPreviewTable
          sourceHeaders={tableData.headers}
          sourceRows={tableData.rows}
          targetHeaders={targetData.headers.length > 0 ? targetData.headers : tableData.headers}
          targetRows={targetData.rows.length > 0 ? targetData.rows : tableData.rows}
          transformationLogs={targetData.logs}
          onSaveToDatabase={handleSaveToHistory}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>
          Excel Data Format Transformer — Konversi spreadsheet cepat, aman, dan presisi dari Format
          Image 1 ke Format Image 2 didukung Database Lokal terintegrasi.
        </p>
      </footer>

      {/* Modals */}
      <LocalDatabaseModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        currentPipeline={pipeline}
        currentTableData={tableData}
        onLoadHistoryItem={handleLoadHistoryItem}
        onLoadTemplate={handleLoadTemplate}
        onLoadDataset={handleLoadDataset}
      />

      <AiVisionModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        onApplyPipeline={handleApplyAiPipeline}
        sampleHeaders={tableData.headers}
        sampleRows={tableData.rows}
      />

      <HelpGuideModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
