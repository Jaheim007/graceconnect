/**
 * PDF Export utility — generates rich visual PDF reports from tabular data
 * Uses a print-window approach (no external deps) with advanced styling
 */

export interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  logo?: string;
  orgName?: string;
  currency?: string;
  /** Summary cards displayed at top (key-value pairs) */
  summaryCards?: { label: string; value: string | number; color?: string }[];
  /** Chart data rendered as a simple bar chart */
  chartData?: { label: string; value: number }[];
  /** Footer text */
  footer?: string;
  /** Columns to highlight (currency formatting) */
  currencyColumns?: string[];
  /** Orientation: portrait or landscape */
  orientation?: 'portrait' | 'landscape';
  /** Locale for formatting */
  locale?: string;
}

export function downloadPDF(
  data: Record<string, unknown>[],
  filename: string,
  options?: string | PDFExportOptions
) {
  if (!data.length) return;

  const opts: PDFExportOptions = typeof options === 'string' ? { title: options } : (options || {});
  const title = opts.title || filename;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => String(row[h] ?? '')));
  const currencySet = new Set(opts.currencyColumns || []);
  const loc = opts.locale || 'fr-FR';
  const isFr = loc.startsWith('fr');

  const formatCell = (header: string, value: string) => {
    if (currencySet.has(header) && !isNaN(Number(value))) {
      return Number(value).toLocaleString(loc, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return value;
  };

  const summaryHtml = opts.summaryCards?.length
    ? `<div class="summary-grid">${opts.summaryCards.map(c =>
        `<div class="summary-card" style="border-left: 3px solid ${c.color || '#3b82f6'};">
          <span class="summary-label">${c.label}</span>
          <span class="summary-value">${c.value}</span>
        </div>`
      ).join('')}</div>`
    : '';

  const chartHtml = opts.chartData?.length
    ? (() => {
        const max = Math.max(...opts.chartData.map(d => d.value), 1);
        return `<div class="chart-section">
          <h3>${isFr ? 'Évolution' : 'Trend'}</h3>
          <div class="chart-bars">
            ${opts.chartData.map(d =>
              `<div class="bar-col">
                <div class="bar" style="height: ${Math.max((d.value / max) * 120, 2)}px;"></div>
                <span class="bar-label">${d.label}</span>
              </div>`
            ).join('')}
          </div>
        </div>`;
      })()
    : '';

  const exportedLabel = isFr ? 'Exporté le' : 'Exported on';
  const rowsLabel = isFr ? 'lignes' : 'rows';
  const dateStr = new Date().toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: ${opts.orientation === 'landscape' ? 'landscape' : 'portrait'}; margin: 15mm; }
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif; padding: 0; margin: 0; color: #1a1a2e; font-size: 11px; line-height: 1.5; }
        .header { display: flex; align-items: center; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #3b82f6; margin-bottom: 16px; }
        .header-logo { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; }
        .header-text h1 { font-size: 20px; margin: 0; font-weight: 700; color: #0f172a; }
        .header-text p { margin: 2px 0 0; font-size: 11px; color: #64748b; }
        .meta-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 8px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .meta-bar span { font-size: 10px; color: #64748b; }
        .summary-grid { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .summary-card { flex: 1; min-width: 120px; padding: 10px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .summary-label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
        .summary-value { display: block; font-size: 18px; font-weight: 700; color: #0f172a; }
        .chart-section { margin-bottom: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
        .chart-section h3 { font-size: 12px; margin: 0 0 12px; color: #334155; }
        .chart-bars { display: flex; align-items: flex-end; gap: 3px; height: 140px; }
        .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; justify-content: flex-end; }
        .bar { width: 100%; max-width: 28px; background: linear-gradient(180deg, #3b82f6, #60a5fa); border-radius: 3px 3px 0 0; min-height: 2px; }
        .bar-label { font-size: 7px; color: #94a3b8; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 32px; }
        table { border-collapse: collapse; width: 100%; font-size: 10px; margin-bottom: 16px; }
        th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 600; color: #334155; text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; }
        td { padding: 6px 10px; border: 1px solid #f1f5f9; color: #475569; }
        tr:nth-child(even) td { background: #fafbfc; }
        tr:hover td { background: #f0f4ff; }
        .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; text-align: center; }
        .footer strong { color: #64748b; }
        @media print { body { padding: 0; } .header { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        ${opts.logo ? `<img class="header-logo" src="${opts.logo}" alt="" />` : ''}
        <div class="header-text">
          <h1>${title}</h1>
          ${opts.subtitle ? `<p>${opts.subtitle}</p>` : ''}
          ${opts.orgName ? `<p>${opts.orgName}</p>` : ''}
        </div>
      </div>

      <div class="meta-bar">
        <span>${exportedLabel} ${dateStr}</span>
        <span>${data.length} ${rowsLabel}</span>
      </div>

      ${summaryHtml}
      ${chartHtml}

      <table>
        <thead><tr>${headers.map((h) => `<th>${h.replace(/_/g, ' ')}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td>${formatCell(headers[i], c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>

      <div class="footer">
        ${opts.footer || `<strong>Siteviral</strong> — ${isFr ? 'Rapport généré automatiquement. Confidentiel.' : 'Auto-generated report. Confidential.'}`}
      </div>
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

/**
 * Generate a visual dashboard PDF for org admins
 */
export function downloadDashboardPDF(opts: {
  orgName: string;
  logoUrl?: string;
  currency?: string;
  locale?: string;
  stats: { label: string; value: string | number; color?: string }[];
  revenueData?: { label: string; value: number }[];
  topProducts?: { title: string; sales: number; revenue: number }[];
  transactions?: Record<string, unknown>[];
}) {
  const loc = opts.locale || 'fr';
  const isFr = loc.startsWith('fr');
  const txData = opts.transactions || [];
  const topRows = (opts.topProducts || []).map(p => ({
    [isFr ? 'Produit' : 'Product']: p.title,
    [isFr ? 'Ventes' : 'Sales']: p.sales,
    [isFr ? 'Revenus' : 'Revenue']: p.revenue,
  }));

  const exportData = txData.length > 0 ? txData as Record<string, unknown>[] : topRows;
  const noDataLabel = isFr ? 'Aucune donnée disponible' : 'No data available';
  const reportLabel = isFr ? 'Rapport' : 'Report';
  const perfLabel = isFr ? 'Rapport de performance généré le' : 'Performance report generated on';
  const dateStr = new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US');
  const footerText = isFr
    ? `<strong>${opts.orgName}</strong> via Siteviral — Rapport confidentiel. Ne pas diffuser sans autorisation.`
    : `<strong>${opts.orgName}</strong> via Siteviral — Confidential report. Do not share without authorization.`;

  downloadPDF(exportData.length > 0 ? exportData : [{ Info: noDataLabel }], `${isFr ? 'rapport' : 'report'}-${opts.orgName}`, {
    title: `${reportLabel} — ${opts.orgName}`,
    subtitle: `${perfLabel} ${dateStr}`,
    orgName: opts.orgName,
    logo: opts.logoUrl,
    summaryCards: opts.stats,
    chartData: opts.revenueData,
    currencyColumns: isFr
      ? ['montant', 'reçu_org', 'commission_affilié', 'frais_plateforme', 'Revenus']
      : ['amount', 'org_received', 'affiliate_commission', 'platform_fee', 'Revenue'],
    orientation: 'landscape',
    locale: isFr ? 'fr-FR' : 'en-US',
    footer: footerText,
  });
}
