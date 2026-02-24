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
  platformFee?: number;
  reference: string;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Facture ${data.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .brand { font-size: 20px; font-weight: 800; color: #d4920a; }
        .brand-sub { font-size: 11px; color: #666; margin-top: 2px; }
        .invoice-title { font-size: 28px; font-weight: 800; color: #1a1a2e; text-align: right; }
        .invoice-num { font-size: 12px; color: #666; text-align: right; margin-top: 4px; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .party { max-width: 45%; }
        .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 6px; }
        .party-name { font-size: 15px; font-weight: 700; }
        .party-detail { font-size: 12px; color: #666; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f5f5f5; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #666; border-bottom: 2px solid #e0e0e0; }
        td { padding: 12px; border-bottom: 1px solid #eee; }
        .total-row td { border-top: 2px solid #1a1a2e; font-weight: 700; font-size: 15px; }
        .amount { text-align: right; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; }
        .footer p { font-size: 10px; color: #999; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">Siteviral</div>
          <div class="brand-sub">Hacktualiz Inc. — Delaware, USA</div>
        </div>
        <div>
          <div class="invoice-title">FACTURE</div>
          <div class="invoice-num">${data.invoiceNumber}<br>${new Date(data.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <div class="party-label">Vendeur</div>
          <div class="party-name">${data.orgName}</div>
          <div class="party-detail">Via Siteviral Platform</div>
        </div>
        <div class="party">
          <div class="party-label">Acheteur</div>
          <div class="party-name">${data.buyerName}</div>
          <div class="party-detail">${data.buyerEmail}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr><th>Description</th><th>Réf.</th><th class="amount">Montant</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>${data.productTitle}</td>
            <td style="font-size:11px;color:#666">${data.reference}</td>
            <td class="amount">${data.amount.toLocaleString()} ${data.currency}</td>
          </tr>
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td class="amount">${data.amount.toLocaleString()} ${data.currency}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Facture générée automatiquement par Siteviral — Hacktualiz Inc.</p>
        <p>131 Continental Dr, Suite 305, Newark, DE 19713, USA</p>
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
