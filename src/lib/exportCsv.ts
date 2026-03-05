/**
 * exportCsv — Converts an array of objects to a CSV string and triggers
 * a browser download. Handles escaping, unicode BOM for Excel, and
 * customizable column headers.
 */

interface ExportOptions {
  /** Custom filename (without extension) */
  filename?: string;
  /** Map of key → display label. Only listed keys are exported (in order). */
  columns?: Record<string, string>;
  /** Delimiter character (default: ',') */
  delimiter?: string;
}

function escapeCell(value: unknown, delimiter: string): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function arrayToCsv(
  data: Record<string, unknown>[],
  options: ExportOptions = {},
): string {
  if (data.length === 0) return '';
  const delimiter = options.delimiter || ',';

  // Determine columns
  const keys = options.columns
    ? Object.keys(options.columns)
    : Object.keys(data[0]);

  const headers = keys.map((k) =>
    escapeCell(options.columns?.[k] || k, delimiter),
  );

  const rows = data.map((row) =>
    keys.map((k) => escapeCell(row[k], delimiter)).join(delimiter),
  );

  return [headers.join(delimiter), ...rows].join('\n');
}

export function downloadCsv(
  data: Record<string, unknown>[],
  options: ExportOptions = {},
) {
  const csv = arrayToCsv(data, options);
  if (!csv) return;

  // BOM for Excel UTF-8 compatibility
  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${options.filename || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
