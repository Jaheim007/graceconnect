// Invoice PDF generator using browser print
import { formatPrice } from '@/lib/currency';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  amount: number;
  currency: string;
  orgName: string;
  orgLogo?: string;
  orgEmail?: string;
  orgPhone?: string;
  orgAddress?: string;
  orgWebsite?: string;
  platformFee?: number;
  reference: string;
  paymentMethod?: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const formattedDate = new Date(data.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedAmount = `${data.amount.toLocaleString()} ${data.currency}`;

  const logoBlock = data.orgLogo
    ? `<img src="${data.orgLogo}" alt="${data.orgName}" style="max-height:56px;max-width:180px;object-fit:contain;border-radius:8px;" />`
    : `<div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#d4920a,#f5c542);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;">${data.orgName.charAt(0).toUpperCase()}</div>`;

  const orgDetails = [
    data.orgEmail ? `<span>📧 ${data.orgEmail}</span>` : '',
    data.orgPhone ? `<span>📞 ${data.orgPhone}</span>` : '',
    data.orgAddress ? `<span>📍 ${data.orgAddress}</span>` : '',
    data.orgWebsite ? `<span>🌐 ${data.orgWebsite}</span>` : '',
  ].filter(Boolean).join('<br/>');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Facture ${data.invoiceNumber}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a2e; font-size: 13px; background: #f8f7f4; }
        .page { max-width: 800px; margin: 0 auto; background: #fff; min-height: 100vh; position: relative; }

        /* Top accent bar */
        .accent-bar { height: 6px; background: linear-gradient(90deg, #d4920a 0%, #f5c542 50%, #d4920a 100%); }

        /* Header */
        .header { padding: 36px 48px 0; display: flex; justify-content: space-between; align-items: flex-start; }
        .seller-brand { display: flex; align-items: center; gap: 16px; }
        .seller-brand .name { font-size: 22px; font-weight: 800; color: #1a1a2e; }
        .invoice-badge { text-align: right; }
        .invoice-badge h1 { font-size: 11px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; color: #d4920a; margin-bottom: 4px; }
        .invoice-badge .num { font-size: 13px; font-weight: 600; color: #1a1a2e; }
        .invoice-badge .date { font-size: 12px; color: #888; margin-top: 2px; }

        /* Parties section */
        .parties { display: flex; justify-content: space-between; padding: 32px 48px 0; gap: 32px; }
        .party-card { flex: 1; background: #faf9f6; border: 1px solid #eee; border-radius: 12px; padding: 20px 24px; }
        .party-card.seller { border-left: 3px solid #d4920a; }
        .party-card.buyer { border-left: 3px solid #1a1a2e; }
        .party-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 10px; }
        .party-name { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
        .party-details { font-size: 11px; color: #666; line-height: 1.8; }

        /* Table */
        .table-section { padding: 32px 48px; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
        thead tr { background: linear-gradient(135deg, #1a1a2e, #2d2d4e); }
        th { text-align: left; padding: 14px 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #fff; }
        th.amount { text-align: right; }
        td { padding: 18px 20px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
        td.ref { font-size: 10px; color: #999; font-family: monospace; }
        td.amount { text-align: right; font-weight: 600; }
        .total-row { background: #faf9f6; }
        .total-row td { border-top: 2px solid #d4920a; border-bottom: none; font-weight: 800; font-size: 16px; color: #1a1a2e; }
        .total-row td.amount { color: #d4920a; }

        /* Payment info */
        .payment-info { padding: 0 48px 24px; display: flex; justify-content: flex-end; }
        .payment-badge { display: inline-flex; align-items: center; gap: 6px; background: #e8f5e9; color: #2e7d32; font-size: 11px; font-weight: 600; padding: 6px 14px; border-radius: 20px; }

        /* Footer */
        .footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 48px; border-top: 1px solid #eee; text-align: center; background: #faf9f6; }
        .footer p { font-size: 10px; color: #aaa; line-height: 1.6; }
        .footer .brand { font-weight: 700; color: #d4920a; }

        @media print {
          body { background: #fff; }
          .page { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="accent-bar"></div>

        <div class="header">
          <div class="seller-brand">
            ${logoBlock}
            <div class="name">${data.orgName}</div>
          </div>
          <div class="invoice-badge">
            <h1>Facture</h1>
            <div class="num">${data.invoiceNumber}</div>
            <div class="date">${formattedDate}</div>
          </div>
        </div>

        <div class="parties">
          <div class="party-card seller">
            <div class="party-label">Vendu par</div>
            <div class="party-name">${data.orgName}</div>
            <div class="party-details">
              ${orgDetails || '<span style="color:#bbb">—</span>'}
            </div>
          </div>
          <div class="party-card buyer">
            <div class="party-label">Facturé à</div>
            <div class="party-name">${data.buyerName}</div>
            <div class="party-details">
              <span>📧 ${data.buyerEmail}</span>
            </div>
          </div>
        </div>

        <div class="table-section">
          <table>
            <thead>
              <tr>
                <th style="width:50%">Description</th>
                <th>Référence</th>
                <th class="amount">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${data.productTitle}</td>
                <td class="ref">${data.reference}</td>
                <td class="amount">${formattedAmount}</td>
              </tr>
              <tr class="total-row">
                <td colspan="2">Total</td>
                <td class="amount">${formattedAmount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="payment-info">
          <div class="payment-badge">✅ Paiement confirmé${data.paymentMethod ? ` — ${data.paymentMethod}` : ''}</div>
        </div>

        <div class="footer">
          <p>Facture générée automatiquement par <span class="brand">Siteviral</span> — Hacktualiz Inc.</p>
          <p>131 Continental Dr, Suite 305, Newark, DE 19713, USA</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function downloadInvoice(data: InvoiceData) {
  const html = generateInvoiceHTML(data);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
