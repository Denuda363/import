/**
 * Data Transformation Engine
 * Handles unpivot, pivot, fill down, column mapping, split, combine, and clean/filter.
 */

import {
  ColumnMappingRule,
  DataRow,
  FillDownConfig,
  FilterCleanConfig,
  PivotConfig,
  TransformationPipeline,
  UnpivotConfig,
} from '../types/transformer';

/**
 * Fill down merged cells:
 * Copies values from the cell above when the current cell is empty/blank.
 */
export function applyFillDown(
  headers: string[],
  rows: DataRow[],
  config: FillDownConfig
): { headers: string[]; rows: DataRow[] } {
  if (!config.targetColumns || config.targetColumns.length === 0) {
    return { headers, rows };
  }

  const lastKnownValues: Record<string, any> = {};

  const transformedRows = rows.map((row) => {
    const newRow = { ...row };

    config.targetColumns.forEach((col) => {
      const val = newRow[col];
      const isBlank =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '');

      if (!isBlank) {
        lastKnownValues[col] = val;
      } else if (lastKnownValues[col] !== undefined) {
        newRow[col] = lastKnownValues[col];
      }
    });

    return newRow;
  });

  return { headers, rows: transformedRows };
}

/**
 * Filter and Clean rows:
 * Removes empty rows, removes rows with "Total" / "Subtotal", trims strings.
 */
export function applyFilterClean(
  headers: string[],
  rows: DataRow[],
  config: FilterCleanConfig
): { headers: string[]; rows: DataRow[] } {
  const {
    removeEmptyRows,
    removeTotalRows,
    totalRowKeywords,
    trimAllWhitespace,
  } = config;

  const lowerKeywords = (totalRowKeywords || ['total', 'subtotal', 'grand total', 'jumlah', 'ringkasan']).map(
    (k) => k.toLowerCase().trim()
  );

  const cleanedRows: DataRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Check if row is entirely empty
    if (removeEmptyRows) {
      const hasAnyValue = headers.some((h) => {
        const v = row[h];
        return v !== undefined && v !== null && String(v).trim() !== '';
      });
      if (!hasAnyValue) {
        continue;
      }
    }

    // Check if row contains total/subtotal keywords
    if (removeTotalRows) {
      const isTotalRow = headers.some((h) => {
        const v = row[h];
        if (v === undefined || v === null) return false;
        const str = String(v).toLowerCase();
        return lowerKeywords.some((keyword) => str === keyword || str.startsWith(keyword + ' ') || str.endsWith(' ' + keyword));
      });
      if (isTotalRow) {
        continue;
      }
    }

    // Trim whitespace if enabled
    const processedRow: DataRow = {};
    headers.forEach((h) => {
      let v = row[h];
      if (trimAllWhitespace && typeof v === 'string') {
        v = v.trim();
      }
      processedRow[h] = v;
    });

    cleanedRows.push(processedRow);
  }

  return { headers, rows: cleanedRows };
}

/**
 * Unpivot (Wide to Long):
 * Transforms columns into rows.
 * E.g., [Produk, Jan, Feb, Mar] -> [Produk, Bulan, Penjualan]
 */
export function applyUnpivot(
  headers: string[],
  rows: DataRow[],
  config: UnpivotConfig
): { headers: string[]; rows: DataRow[] } {
  const {
    idColumns,
    valueColumns,
    attributeHeader = 'Atribut / Periode',
    valueHeader = 'Nilai',
    removeEmptyValues = true,
  } = config;

  if (valueColumns.length === 0) {
    return { headers, rows };
  }

  const newHeaders = [...idColumns, attributeHeader, valueHeader];
  const newRows: DataRow[] = [];

  rows.forEach((row) => {
    valueColumns.forEach((valCol) => {
      const val = row[valCol];
      if (
        removeEmptyValues &&
        (val === undefined || val === null || (typeof val === 'string' && val.trim() === ''))
      ) {
        return;
      }

      const newRow: DataRow = {};
      idColumns.forEach((idCol) => {
        newRow[idCol] = row[idCol] !== undefined ? row[idCol] : '';
      });

      newRow[attributeHeader] = valCol;
      newRow[valueHeader] = val !== undefined ? val : '';
      newRows.push(newRow);
    });
  });

  return { headers: newHeaders, rows: newRows };
}

/**
 * Pivot (Long to Wide):
 * Transforms row values into distinct columns.
 */
export function applyPivot(
  headers: string[],
  rows: DataRow[],
  config: PivotConfig
): { headers: string[]; rows: DataRow[] } {
  const { rowColumns, pivotColumn, valueColumn, aggregation = 'sum' } = config;

  if (!pivotColumn || !valueColumn || rowColumns.length === 0) {
    return { headers, rows };
  }

  // Find unique pivot column values
  const pivotValuesSet = new Set<string>();
  rows.forEach((r) => {
    const pVal = r[pivotColumn];
    if (pVal !== undefined && pVal !== null && String(pVal).trim() !== '') {
      pivotValuesSet.add(String(pVal).trim());
    }
  });

  const pivotValues = Array.from(pivotValuesSet).sort();
  const newHeaders = [...rowColumns, ...pivotValues];

  // Group by rowColumns
  const groups = new Map<string, { baseRow: DataRow; cells: Record<string, any[]> }>();

  rows.forEach((row) => {
    const groupKey = rowColumns.map((c) => String(row[c] || '')).join('___');
    if (!groups.has(groupKey)) {
      const baseRow: DataRow = {};
      rowColumns.forEach((c) => {
        baseRow[c] = row[c];
      });
      groups.set(groupKey, { baseRow, cells: {} });
    }

    const group = groups.get(groupKey)!;
    const pVal = String(row[pivotColumn] || '').trim();
    if (pVal) {
      if (!group.cells[pVal]) {
        group.cells[pVal] = [];
      }
      group.cells[pVal].push(row[valueColumn]);
    }
  });

  const newRows: DataRow[] = [];
  groups.forEach(({ baseRow, cells }) => {
    const row: DataRow = { ...baseRow };
    pivotValues.forEach((pVal) => {
      const vals = cells[pVal] || [];
      if (vals.length === 0) {
        row[pVal] = 0;
      } else if (aggregation === 'sum') {
        const sum = vals.reduce((acc, v) => {
          const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0;
          return acc + num;
        }, 0);
        row[pVal] = sum;
      } else if (aggregation === 'count') {
        row[pVal] = vals.length;
      } else if (aggregation === 'first') {
        row[pVal] = vals[0];
      } else if (aggregation === 'last') {
        row[pVal] = vals[vals.length - 1];
      } else if (aggregation === 'concat') {
        row[pVal] = vals.join(', ');
      }
    });
    newRows.push(row);
  });

  return { headers: newHeaders, rows: newRows };
}

/**
 * Apply Column Mappings, Splits, Combines, and Formatters
 */
export function applyColumnMappings(
  headers: string[],
  rows: DataRow[],
  rules: ColumnMappingRule[]
): { headers: string[]; rows: DataRow[] } {
  if (!rules || rules.length === 0) {
    return { headers, rows };
  }

  // Prepare active rules and target headers
  const activeRules = rules.filter((r) => r.action !== 'delete');
  const targetHeaders = activeRules.map((r) => r.targetColumn || r.sourceColumn);

  const transformedRows = rows.map((row) => {
    const newRow: DataRow = {};

    activeRules.forEach((rule) => {
      const sourceVal = row[rule.sourceColumn];
      let finalVal: any = sourceVal !== undefined ? sourceVal : '';

      switch (rule.action) {
        case 'uppercase':
          finalVal = String(finalVal).toUpperCase();
          break;
        case 'lowercase':
          finalVal = String(finalVal).toLowerCase();
          break;
        case 'titlecase':
          finalVal = String(finalVal)
            .toLowerCase()
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          break;
        case 'trim':
          finalVal = String(finalVal).trim();
          break;
        case 'currency_format': {
          const num = parseFloat(String(finalVal).replace(/[^0-9.-]/g, ''));
          finalVal = isNaN(num) ? finalVal : `Rp ${num.toLocaleString('id-ID')}`;
          break;
        }
        case 'number_format': {
          const num = parseFloat(String(finalVal).replace(/[^0-9.-]/g, ''));
          finalVal = isNaN(num) ? finalVal : num.toLocaleString('id-ID');
          break;
        }
        case 'date_format': {
          if (finalVal) {
            try {
              const d = new Date(finalVal);
              if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                finalVal = `${day}/${month}/${year}`;
              }
            } catch {
              // keep as is
            }
          }
          break;
        }
        case 'split': {
          const delimiter = rule.splitDelimiter || ',';
          const splitIdx = rule.splitIndex ?? 0;
          const parts = String(finalVal).split(delimiter);
          finalVal = parts[splitIdx] !== undefined ? parts[splitIdx].trim() : '';
          break;
        }
        case 'combine': {
          const secondColVal = rule.combineWithColumn ? row[rule.combineWithColumn] : '';
          const sep = rule.combineSeparator !== undefined ? rule.combineSeparator : ' - ';
          finalVal = `${finalVal}${sep}${secondColVal || ''}`;
          break;
        }
        case 'custom_formula': {
          // Simple addition, subtraction, multiplication between columns
          if (rule.formula) {
            try {
              let expr = rule.formula;
              headers.forEach((h) => {
                const val = parseFloat(String(row[h]).replace(/[^0-9.-]/g, '')) || 0;
                expr = expr.split(`[${h}]`).join(String(val));
              });
              // Safe evaluation for basic math + - * /
              if (/^[0-9+\-*/().\s]+$/.test(expr)) {
                // eslint-disable-next-line no-eval
                finalVal = Function(`'use strict'; return (${expr})`)();
              }
            } catch {
              // fallback
            }
          }
          break;
        }
        case 'keep':
        case 'rename':
        default:
          break;
      }

      if (rule.prefix) {
        finalVal = `${rule.prefix}${finalVal}`;
      }
      if (rule.suffix) {
        finalVal = `${finalVal}${rule.suffix}`;
      }

      newRow[rule.targetColumn || rule.sourceColumn] = finalVal;
    });

    return newRow;
  });

  return { headers: targetHeaders, rows: transformedRows };
}

/**
 * Execute the complete transformation pipeline
 */
export function executeTransformationPipeline(
  headers: string[],
  rows: DataRow[],
  pipeline: TransformationPipeline
): { headers: string[]; rows: DataRow[]; logs: string[] } {
  const logs: string[] = [];
  let currentHeaders = [...headers];
  let currentRows = [...rows];

  // 1. Fill Down (Merge Cells)
  if (pipeline.fillDown && pipeline.fillDown.targetColumns.length > 0) {
    const res = applyFillDown(currentHeaders, currentRows, pipeline.fillDown);
    currentHeaders = res.headers;
    currentRows = res.rows;
    logs.push(`Menerapkan Fill-down pada kolom: ${pipeline.fillDown.targetColumns.join(', ')}`);
  }

  // 2. Filter & Clean
  if (pipeline.filterClean) {
    const beforeCount = currentRows.length;
    const res = applyFilterClean(currentHeaders, currentRows, pipeline.filterClean);
    currentHeaders = res.headers;
    currentRows = res.rows;
    const removedCount = beforeCount - currentRows.length;
    if (removedCount > 0) {
      logs.push(`Membersihkan ${removedCount} baris kosong/subtotal`);
    }
  }

  // 3. Unpivot (Wide to Long)
  if (pipeline.unpivot && pipeline.unpivot.enabled && pipeline.unpivot.config.valueColumns.length > 0) {
    const res = applyUnpivot(currentHeaders, currentRows, pipeline.unpivot.config);
    currentHeaders = res.headers;
    currentRows = res.rows;
    logs.push(
      `Unpivot ${pipeline.unpivot.config.valueColumns.length} kolom menjadi baris (${currentRows.length} baris dihasilkan)`
    );
  }

  // 4. Pivot (Long to Wide)
  if (pipeline.pivot && pipeline.pivot.enabled && pipeline.pivot.config.pivotColumn) {
    const res = applyPivot(currentHeaders, currentRows, pipeline.pivot.config);
    currentHeaders = res.headers;
    currentRows = res.rows;
    logs.push(
      `Pivot berdasarkan kolom '${pipeline.pivot.config.pivotColumn}' (${currentRows.length} baris hasil grup)`
    );
  }

  // 5. Column Mappings, Splits, Combines, and Formatting
  if (pipeline.columnMappings && pipeline.columnMappings.length > 0) {
    const res = applyColumnMappings(currentHeaders, currentRows, pipeline.columnMappings);
    currentHeaders = res.headers;
    currentRows = res.rows;
    logs.push(`Menerapkan ${pipeline.columnMappings.length} aturan penataan kolom Image 2`);
  }

  return { headers: currentHeaders, rows: currentRows, logs };
}
