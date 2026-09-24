/**
 * Type definitions for Excel Data Transformer
 */

export type CellValue = string | number | boolean | null | undefined;
export type DataRow = Record<string, any>;

export interface TableData {
  fileName: string;
  sheetNames: string[];
  currentSheet: string;
  headers: string[];
  rows: DataRow[];
  totalRows: number;
}

export type TransformType =
  | 'preset'
  | 'unpivot'
  | 'pivot'
  | 'fill_down'
  | 'column_mapping'
  | 'split_merge'
  | 'filter_clean'
  | 'ai_smart';

export interface UnpivotConfig {
  idColumns: string[]; // Fixed columns (e.g. ['Kode', 'Nama'])
  valueColumns: string[]; // Matrix columns to turn into rows (e.g. ['Jan', 'Feb', 'Mar'])
  attributeHeader: string; // Target column for header names (e.g. 'Bulan' or 'Periode')
  valueHeader: string; // Target column for cell values (e.g. 'Jumlah' or 'Penjualan')
  removeEmptyValues?: boolean;
}

export interface PivotConfig {
  rowColumns: string[]; // Rows identifier
  pivotColumn: string; // Column whose unique values become headers
  valueColumn: string; // Column whose values populate the cells
  aggregation: 'sum' | 'count' | 'first' | 'last' | 'concat';
}

export interface FillDownConfig {
  targetColumns: string[]; // Columns where blank cells should take the value of the cell above
}

export type ColumnActionType =
  | 'keep'
  | 'rename'
  | 'delete'
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'trim'
  | 'number_format'
  | 'date_format'
  | 'currency_format'
  | 'split'
  | 'combine'
  | 'custom_formula';

export interface ColumnMappingRule {
  id: string;
  sourceColumn: string;
  targetColumn: string;
  action: ColumnActionType;
  splitDelimiter?: string;
  splitIndex?: number; // 0 for first part, 1 for second part, etc.
  combineWithColumn?: string;
  combineSeparator?: string;
  prefix?: string;
  suffix?: string;
  formatType?: 'number' | 'currency' | 'date_dmy' | 'date_ymd';
  formula?: string; // e.g., "colA + colB" or "colA * 0.11"
}

export interface FilterCleanConfig {
  removeEmptyRows: boolean;
  removeTotalRows: boolean;
  totalRowKeywords: string[]; // e.g. ['total', 'subtotal', 'grand total', 'jumlah']
  trimAllWhitespace: boolean;
  skipHeaderRowsCount: number;
}

export interface TransformationPipeline {
  fillDown: FillDownConfig;
  unpivot: {
    enabled: boolean;
    config: UnpivotConfig;
  };
  pivot: {
    enabled: boolean;
    config: PivotConfig;
  };
  columnMappings: ColumnMappingRule[];
  filterClean: FilterCleanConfig;
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  category: string;
  image1Description: string;
  image2Description: string;
  sampleInput: {
    headers: string[];
    rows: DataRow[];
  };
  pipelineConfig: Partial<TransformationPipeline>;
}

export interface AiAnalysisResult {
  title: string;
  explanation: string;
  detectedFormat1: string;
  detectedFormat2: string;
  changesSummary: string[];
  recommendedTransformType: TransformType;
  suggestedPipeline?: Partial<TransformationPipeline>;
  transformedPreview?: {
    headers: string[];
    rows: DataRow[];
  };
}
