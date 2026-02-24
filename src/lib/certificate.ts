// Certificate PDF generator for completed programs
export interface CertificateData {
  studentName: string;
  programTitle: string;
  orgName: string;
  completionDate: string;
  certificateId: string;
}

export function generateCertificateHTML(data: CertificateData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificat — ${data.programTitle}</title>
      <style>
        @page { size: landscape; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Georgia', serif; 
          width: 100vw; height: 100vh; 
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #16213e 100%);
          color: #e6edf3;
        }
        .cert {
          width: 900px; padding: 60px;
          border: 3px solid #d4920a;
          border-radius: 16px;
          text-align: center;
          background: rgba(13, 17, 23, 0.95);
          position: relative;
        }
        .cert::before {
          content: ''; position: absolute; inset: 8px;
          border: 1px solid rgba(212, 146, 10, 0.3);
          border-radius: 12px; pointer-events: none;
        }
        .logo { font-size: 14px; font-weight: 700; color: #d4920a; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
        .title { font-size: 36px; font-weight: 300; color: #d4920a; margin-bottom: 12px; letter-spacing: 2px; }
        .sub { font-size: 13px; color: #8b949e; margin-bottom: 32px; }
        .name { font-size: 32px; font-weight: 700; color: #e6edf3; margin-bottom: 8px; border-bottom: 2px solid #d4920a; display: inline-block; padding-bottom: 4px; }
        .course { font-size: 18px; color: #c9d1d9; margin-top: 24px; }
        .course strong { color: #d4920a; }
        .details { margin-top: 32px; display: flex; justify-content: space-between; font-size: 11px; color: #8b949e; }
        .details div { text-align: center; }
        .details .label { text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-size: 9px; }
        .details .value { font-size: 13px; color: #c9d1d9; }
        @media print { 
          body { background: white; color: #1a1a2e; }
          .cert { background: white; border-color: #d4920a; }
          .name { color: #1a1a2e; }
          .course { color: #333; }
        }
      </style>
    </head>
    <body>
      <div class="cert">
        <div class="logo">Siteviral · ${data.orgName}</div>
        <div class="title">Certificat de Réussite</div>
        <div class="sub">Décerné avec honneur à</div>
        <div class="name">${data.studentName}</div>
        <div class="course">Pour avoir complété avec succès le programme<br><strong>« ${data.programTitle} »</strong></div>
        <div class="details">
          <div>
            <div class="label">Date</div>
            <div class="value">${new Date(data.completionDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
          <div>
            <div class="label">Certificat N°</div>
            <div class="value">${data.certificateId}</div>
          </div>
          <div>
            <div class="label">Organisation</div>
            <div class="value">${data.orgName}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function downloadCertificate(data: CertificateData) {
  const html = generateCertificateHTML(data);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}
