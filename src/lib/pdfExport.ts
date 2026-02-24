/**
 * PDF Export utility — generates simple PDF reports from tabular data
 * Uses a canvas-based approach (no external deps)
 */

export function downloadPDF(
  data: Record<string, unknown>[],
  filename: string,
  title?: string
) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => String(row[h] ?? '')));

  // Build HTML table for printing
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || filename}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; color: #1a1a1a; }
        h1 { font-size: 18px; margin-bottom: 8px; }
        p.meta { font-size: 11px; color: #666; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        th { background: #f5f5f5; text-align: left; padding: 6px 8px; border: 1px solid #ddd; font-weight: 600; }
        td { padding: 5px 8px; border: 1px solid #eee; }
        tr:nth-child(even) td { background: #fafafa; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title || filename}</h1>
      <p class="meta">Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${data.length} lignes</p>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}
