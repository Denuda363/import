/**
 * Local Database Types
 */
import { DataRow, TransformationPipeline } from './transformer';

export interface SavedHistoryItem {
  id: string;
  title: string;
  fileName: string;
  sourceRowCount: number;
  targetRowCount: number;
  sourceColCount: number;
  targetColCount: number;
  sourceHeaders: string[];
  targetHeaders: string[];
  pipeline: TransformationPipeline;
  sampleSourceRows?: DataRow[];
  sampleTargetRows?: DataRow[];
  createdAt: string; // ISO string
}

export interface SavedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  pipeline: TransformationPipeline;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDataset {
  id: string;
  name: string;
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: DataRow[];
  totalRows: number;
  createdAt: string;
}

export interface LocalDatabaseStats {
  historyCount: number;
  templateCount: number;
  datasetCount: number;
  estimatedSizeBytes: number;
  lastUpdated: string;
}

export interface DatabaseBackup {
  version: number;
  exportedAt: string;
  history: SavedHistoryItem[];
  templates: SavedTemplate[];
  datasets: SavedDataset[];
}
