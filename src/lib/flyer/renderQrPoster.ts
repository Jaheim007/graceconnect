import QRCode from 'qrcode';
import flyerLogo from '@/assets/flyer-logo.png.asset.json';

/**
 * QR poster engine — renders a print-ready "scan me" poster / table card
 * for a product, event or workspace. Fully client-side (canvas + local QR
 * generator), so it works offline and costs no credits.
 *
 * Deliberately distinct from the promotional flyer: here the QR code IS the
 * hero, framed like a museum label, with brand + organization signatures.
 */

export type QrPosterFormat = 'poster' | 'card';
export type QrPosterTheme = 'navy' | 'church' | 'ivory';

export const QR_POSTER_FORMATS: Record<QrPosterFormat, { w: number; h: number }> = {
  poster: { w: 1080, h: 1512 },
  card: { w: 1080, h: 1080 },
};

interface Tokens {
  bg: string;
  bg2: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentInk: string;
  panel: string;
  glow: string;
  qrDark: string;
  qrPaper: string;
}

export const QR_POSTER_THEMES: Record<QrPosterTheme, Tokens> = {
  navy: {
    bg: '#061a52',
    bg2: '#0b2f8f',
    ink: '#ffffff',
    inkSoft: 'rgba(255,255,255,0.72)',
    accent: '#f5c518',
    accentInk: '#0a1a3f',
    panel: 'rgba(255,255,255,0.08)',
    glow: 'rgba(245,197,24,0.28)',
    qrDark: '#061a52',
    qrPaper: '#ffffff',
  },
  church: {
    bg: '#0b1424',
    bg2: '#1d2b48',
    ink: '#fdf9ee',
    inkSoft: 'rgba(253,249,238,0.70)',
    accent: '#dfb63a',
    accentInk: '#101a2e',
    panel: 'rgba(253,249,238,0.07)',
    glow: 'rgba(223,182,58,0.26)',
    qrDark: '#101a2e',
    qrPaper: '#fdfaf2',
  },
  ivory: {
    bg: '#fbf9f4',
    bg2: '#f1ece1',
    ink: '#0f172a',
    inkSoft: 'rgba(15,23,42,0.60)',
    accent: '#082472',
    accentInk: '#ffffff',
    panel: 'rgba(8,36,114,0.06)',
    glow: 'rgba(8,36,114,0.12)',
    qrDark: '#082472',
    qrPaper: '#ffffff',
  },
};

export interface QrPosterData {
  title: string;
  link: string;
  coverUrl?: string | null;
  orgName?: string | null;
  orgAvatarUrl?: string | null;
  priceLabel?: string | null;
  /** Small caps line above the title, e.g. "NOUVEAU LIVRE". */
  eyebrow?: string | null;
  /** Instruction under the QR, e.g. "Scannez avec votre téléphone". */
  scanLabel: string;
  /** Tiny reassurance line, e.g. "Paiement Mobile Money · Accès immédiat". */
  footnote?: string | null;
  brandLabel?: string;
}

export interface RenderQrPosterOptions extends QrPosterData {
  format: QrPosterFormat;
  theme: QrPosterTheme;
}

const HEADING = '"Bricolage Grotesque", "Inter", system-ui, sans-serif';
const BODY = '"Inter", system-ui, sans-serif';

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = Math.max(w / img.width, h / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 4) last = last.slice(0, -1);
    if (words.join(' ') !== lines.join(' ')) lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

function tracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
): void {
  const chars = [...text];
  const width = chars.reduce((acc, c) => acc + ctx.measureText(c).width + spacing, -spacing);
  let x = cx - width / 2;
  for (const c of chars) {
    ctx.fillText(c, x, y);
    x += ctx.measureText(c).width + spacing;
  }
}

function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, th: Tokens) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.5, h);
  grad.addColorStop(0, th.bg2);
  grad.addColorStop(0.6, th.bg);
  grad.addColorStop(1, th.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.1, 0, w * 0.5, h * 0.1, w * 0.85);
  glow.addColorStop(0, th.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Concentric rings behind the QR panel — quiet, engraved feel
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = th.ink;
  ctx.lineWidth = 2;
  for (let r = w * 0.18; r < w * 0.9; r += w * 0.055) {
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.62, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Hairline frame
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = th.accent;
  ctx.lineWidth = 3;
  const inset = Math.round(w * 0.035);
  roundRect(ctx, inset, inset, w - inset * 2, h - inset * 2, Math.round(w * 0.03));
  ctx.stroke();
  ctx.restore();
}

/** Registration ticks around the QR panel — a lab-notebook detail. */
function paintTicks(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, th: Tokens) {
  const len = Math.round(s * 0.09);
  ctx.save();
  ctx.strokeStyle = th.accent;
  ctx.lineWidth = Math.max(4, Math.round(s * 0.012));
  ctx.lineCap = 'round';
  const corners: [number, number, number, number][] = [
    [x, y, 1, 1],
    [x + s, y, -1, 1],
    [x, y + s, 1, -1],
    [x + s, y + s, -1, -1],
  ];
  const off = Math.round(s * 0.075);
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx - dx * off, cy - dy * off + dy * 0);
    ctx.lineTo(cx - dx * off + dx * len, cy - dy * off);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - dx * off, cy - dy * off);
    ctx.lineTo(cx - dx * off, cy - dy * off + dy * len);
    ctx.stroke();
  }
  ctx.restore();
}

async function qrImage(link: string, size: number, th: Tokens): Promise<HTMLImageElement | null> {
  const dataUrl = await QRCode.toDataURL(link, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: size,
    color: { dark: th.qrDark, light: th.qrPaper },
  });
  return loadImage(dataUrl);
}

function drawBrandRow(
  ctx: CanvasRenderingContext2D,
  w: number,
  M: number,
  y: number,
  th: Tokens,
  opts: RenderQrPosterOptions,
  logo: HTMLImageElement | null,
  orgAvatar: HTMLImageElement | null,
): number {
  const markSize = Math.round(w * 0.072);
  ctx.save();
  roundRect(ctx, M, y, markSize, markSize, markSize * 0.28);
  ctx.clip();
  if (logo) {
    drawCover(ctx, logo, M, y, markSize, markSize);
  } else {
    ctx.fillStyle = th.accent;
    ctx.fillRect(M, y, markSize, markSize);
    ctx.fillStyle = th.accentInk;
    ctx.font = `800 ${Math.round(markSize * 0.6)}px ${HEADING}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', M + markSize / 2, y + markSize / 2 + 2);
  }
  ctx.restore();

  ctx.fillStyle = th.ink;
  ctx.font = `700 ${Math.round(w * 0.027)}px ${BODY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.brandLabel || 'SiteViral', M + markSize + Math.round(w * 0.019), y + markSize / 2 + 1);

  const orgName = (opts.orgName || '').trim();
  if (orgName) {
    const avSize = Math.round(w * 0.052);
    const pad = Math.round(w * 0.017);
    ctx.font = `700 ${Math.round(w * 0.022)}px ${BODY}`;
    let label = orgName;
    const maxLabelW = w * 0.3;
    while (ctx.measureText(label).width > maxLabelW && label.length > 6) label = label.slice(0, -2);
    if (label !== orgName) label = `${label.trimEnd()}…`;
    const labelW = ctx.measureText(label).width;
    const pillH = avSize + pad;
    const pillW = avSize + labelW + pad * 2.6;
    const pillX = w - M - pillW;
    const pillY = y + Math.round((markSize - pillH) / 2);

    ctx.fillStyle = th.panel;
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 2;
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.stroke();
    ctx.restore();

    const avX = pillX + pad * 0.5;
    const avY = pillY + (pillH - avSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
    ctx.clip();
    if (orgAvatar) drawCover(ctx, orgAvatar, avX, avY, avSize, avSize);
    else {
      ctx.fillStyle = th.accent;
      ctx.fillRect(avX, avY, avSize, avSize);
      ctx.fillStyle = th.accentInk;
      ctx.font = `800 ${Math.round(avSize * 0.5)}px ${HEADING}`;
      ctx.textAlign = 'center';
      ctx.fillText(orgName.charAt(0).toUpperCase(), avX + avSize / 2, avY + avSize / 2 + 1);
      ctx.textAlign = 'left';
    }
    ctx.restore();

    ctx.fillStyle = th.ink;
    ctx.font = `700 ${Math.round(w * 0.022)}px ${BODY}`;
    ctx.fillText(label, avX + avSize + pad * 0.7, pillY + pillH / 2 + 1);
  }
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  return markSize;
}

function drawFooter(ctx: CanvasRenderingContext2D, w: number, h: number, M: number, th: Tokens) {
  const fy = h - M;
  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = th.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(M, fy - Math.round(h * 0.03));
  ctx.lineTo(w - M, fy - Math.round(h * 0.03));
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = th.inkSoft;
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round(w * 0.021)}px ${BODY}`;
  tracked(ctx, 'SITEVIRAL.COM', w / 2, fy, Math.round(w * 0.005));
  ctx.textAlign = 'left';
}

function drawQrPanel(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement | null,
  px: number,
  py: number,
  panel: number,
  th: Tokens,
  w: number,
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = Math.round(w * 0.05);
  ctx.shadowOffsetY = Math.round(w * 0.014);
  roundRect(ctx, px, py, panel, panel, Math.round(panel * 0.09));
  ctx.fillStyle = th.qrPaper;
  ctx.fill();
  ctx.restore();

  const qrSize = Math.round(panel * 0.82);
  if (qr) ctx.drawImage(qr, px + (panel - qrSize) / 2, py + (panel - qrSize) / 2, qrSize, qrSize);
  paintTicks(ctx, px, py, panel, th);
}

/** Table card — a two-column tent card: identity on the left, QR on the right. */
async function renderCard(opts: RenderQrPosterOptions): Promise<string> {
  const { w, h } = QR_POSTER_FORMATS.card;
  const th = QR_POSTER_THEMES[opts.theme];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const M = Math.round(w * 0.075);

  const [logo, orgAvatar, cover] = await Promise.all([
    loadImage(flyerLogo.url),
    opts.orgAvatarUrl ? loadImage(opts.orgAvatarUrl) : Promise.resolve(null),
    opts.coverUrl ? loadImage(opts.coverUrl) : Promise.resolve(null),
  ]);

  paintBackground(ctx, w, h, th);
  const markH = drawBrandRow(ctx, w, M, M, th, opts, logo, orgAvatar);

  const bandTop = M + markH + Math.round(h * 0.055);
  const footerTop = h - M - Math.round(h * 0.075);
  const bandH = footerTop - bandTop;

  // Right column: QR panel + scan label
  const panel = Math.round(w * 0.36);
  const scanGap = Math.round(h * 0.075);
  const scanH = Math.round(h * (opts.footnote ? 0.12 : 0.06));
  const rightBlockH = panel + scanGap + scanH;
  const px = w - M - panel;
  const py = bandTop + Math.round((bandH - rightBlockH) / 2);

  const qr = await qrImage(opts.link, panel * 2, th);
  drawQrPanel(ctx, qr, px, py, panel, th, w);

  const rcx = px + panel / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = th.ink;
  ctx.font = `700 ${Math.round(w * 0.023)}px ${BODY}`;
  let sy = py + panel + scanGap;
  const scanLines = wrap(ctx, opts.scanLabel, panel, 2);
  for (const line of scanLines) {
    ctx.fillText(line, rcx, sy);
    sy += Math.round(h * 0.032);
  }
  if (opts.footnote) {
    ctx.fillStyle = th.inkSoft;
    ctx.font = `500 ${Math.round(w * 0.018)}px ${BODY}`;
    for (const line of wrap(ctx, opts.footnote, panel, 2)) {
      sy += Math.round(h * 0.026);
      ctx.fillText(line, rcx, sy);
    }
  }

  // Left column: cover + eyebrow + title + price
  const colW = px - M - Math.round(w * 0.055);
  ctx.textAlign = 'left';

  const coverW = cover ? Math.round(colW * 0.4) : 0;
  const coverH = cover ? Math.round(coverW * 1.42) : 0;
  const eyebrowH = opts.eyebrow ? Math.round(h * 0.042) : 0;
  const titleSize = Math.round(w * 0.045);
  ctx.font = `800 ${titleSize}px ${HEADING}`;
  const titleLines = wrap(ctx, opts.title, colW, 3);
  const lineH = Math.round(titleSize * 1.18);
  const titleH = titleLines.length * lineH;
  const priceH = opts.priceLabel ? Math.round(w * 0.058) + Math.round(h * 0.03) : 0;
  const leftH = (cover ? coverH + Math.round(h * 0.035) : 0) + eyebrowH + titleH + priceH;

  let ly = bandTop + Math.max(0, Math.round((bandH - leftH) / 2));

  if (cover) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.round(w * 0.03);
    ctx.shadowOffsetY = Math.round(w * 0.01);
    roundRect(ctx, M, ly, coverW, coverH, Math.round(coverW * 0.07));
    ctx.fillStyle = th.panel;
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, M, ly, coverW, coverH, Math.round(coverW * 0.07));
    ctx.clip();
    drawCover(ctx, cover, M, ly, coverW, coverH);
    ctx.restore();
    ly += coverH + Math.round(h * 0.035);
  }

  if (opts.eyebrow) {
    ctx.fillStyle = th.accent;
    ctx.font = `700 ${Math.round(w * 0.019)}px ${BODY}`;
    ctx.fillText(opts.eyebrow.toUpperCase(), M, ly + Math.round(h * 0.018));
    ly += eyebrowH;
  }

  ctx.fillStyle = th.ink;
  ctx.font = `800 ${titleSize}px ${HEADING}`;
  for (const line of titleLines) {
    ly += lineH;
    ctx.fillText(line, M, ly - Math.round(lineH * 0.22));
  }

  if (opts.priceLabel) {
    ly += Math.round(h * 0.03);
    ctx.font = `800 ${Math.round(w * 0.028)}px ${BODY}`;
    const tw = ctx.measureText(opts.priceLabel).width;
    const padX = Math.round(w * 0.03);
    const pillH = Math.round(w * 0.058);
    const pillW = tw + padX * 2;
    roundRect(ctx, M, ly, pillW, pillH, pillH / 2);
    ctx.fillStyle = th.accent;
    ctx.fill();
    ctx.fillStyle = th.accentInk;
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.priceLabel, M + padX, ly + pillH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  drawFooter(ctx, w, h, M, th);
  return canvas.toDataURL('image/png');
}

export async function renderQrPoster(opts: RenderQrPosterOptions): Promise<string> {
  if (opts.format === 'card') return renderCard(opts);
  const { w, h } = QR_POSTER_FORMATS.poster;
  const th = QR_POSTER_THEMES[opts.theme];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const M = Math.round(w * 0.085);

  const [logo, orgAvatar, cover] = await Promise.all([
    loadImage(flyerLogo.url),
    opts.orgAvatarUrl ? loadImage(opts.orgAvatarUrl) : Promise.resolve(null),
    opts.coverUrl ? loadImage(opts.coverUrl) : Promise.resolve(null),
  ]);

  paintBackground(ctx, w, h, th);
  const markH = drawBrandRow(ctx, w, M, M, th, opts, logo, orgAvatar);

  const cx = w / 2;
  const contentW = w - M * 2;

  /* ---- Measure everything first, then place with a fixed vertical rhythm.
         This is what prevents the title from colliding with the price pill. ---- */
  const top = M + markH + Math.round(h * 0.05);
  const footerReserve = M + Math.round(h * 0.055);
  const bottom = h - footerReserve;

  const eyebrowH = opts.eyebrow ? Math.round(h * 0.03) : 0;
  const gapAfterEyebrow = opts.eyebrow ? Math.round(h * 0.014) : 0;

  let coverW = cover ? Math.round(w * 0.185) : 0;
  let coverH = cover ? Math.round(coverW * 1.4) : 0;
  const gapAfterCover = cover ? Math.round(h * 0.03) : 0;

  // Title: shrink until it fits in at most 2 lines.
  let titleSize = Math.round(w * 0.056);
  let titleLines: string[] = [];
  for (let i = 0; i < 6; i++) {
    ctx.font = `800 ${titleSize}px ${HEADING}`;
    const words = opts.title.trim().split(/\s+/);
    const single = ctx.measureText(opts.title).width <= contentW;
    titleLines = single ? [opts.title] : wrap(ctx, opts.title, contentW, 2);
    const fitted = single || titleLines.join(' ').length >= opts.title.trim().length - 1 || words.length <= 2;
    if (fitted || titleSize <= Math.round(w * 0.036)) break;
    titleSize = Math.round(titleSize * 0.92);
  }
  ctx.font = `800 ${titleSize}px ${HEADING}`;
  titleLines = ctx.measureText(opts.title).width <= contentW ? [opts.title] : wrap(ctx, opts.title, contentW, 2);
  const titleLineH = Math.round(titleSize * 1.14);
  const titleH = titleLines.length * titleLineH;

  const priceFont = Math.round(w * 0.031);
  const pricePillH = opts.priceLabel ? Math.round(w * 0.066) : 0;
  const gapBeforePrice = opts.priceLabel ? Math.round(h * 0.03) : 0;

  const scanFont = Math.round(w * 0.028);
  const footFont = Math.round(w * 0.021);
  const scanH = Math.round(h * 0.032) + (opts.footnote ? Math.round(h * 0.03) : 0);
  const gapBeforeQr = Math.round(h * 0.04);
  const gapAfterQr = Math.round(h * 0.045);

  const fixed =
    eyebrowH + gapAfterEyebrow +
    coverH + gapAfterCover +
    titleH + gapBeforePrice + pricePillH +
    gapBeforeQr + gapAfterQr + scanH;

  let panel = Math.min(Math.round(w * 0.56), bottom - top - fixed);
  if (panel < Math.round(w * 0.42) && cover) {
    // Reclaim room from the cover before shrinking the QR — the QR is the hero.
    const need = Math.round(w * 0.42) - panel;
    const shrink = Math.min(need, coverH - Math.round(w * 0.16));
    coverH -= shrink;
    coverW = Math.round(coverH / 1.4);
    panel += shrink;
  }
  panel = Math.max(Math.round(w * 0.38), panel);

  let y = top;

  if (opts.eyebrow) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = th.accent;
    ctx.font = `700 ${Math.round(w * 0.021)}px ${BODY}`;
    tracked(ctx, opts.eyebrow.toUpperCase(), cx, y + Math.round(eyebrowH * 0.72), Math.round(w * 0.006));
    y += eyebrowH + gapAfterEyebrow;
  }

  if (cover && coverH > 0) {
    const cxx = cx - coverW / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.round(w * 0.035);
    ctx.shadowOffsetY = Math.round(w * 0.012);
    roundRect(ctx, cxx, y, coverW, coverH, Math.round(coverW * 0.07));
    ctx.fillStyle = th.panel;
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, cxx, y, coverW, coverH, Math.round(coverW * 0.07));
    ctx.clip();
    drawCover(ctx, cover, cxx, y, coverW, coverH);
    ctx.restore();
    y += coverH + gapAfterCover;
  }

  // Title — baseline placed inside its own measured block, never past titleH.
  ctx.textAlign = 'center';
  ctx.fillStyle = th.ink;
  ctx.font = `800 ${titleSize}px ${HEADING}`;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, cx, y + i * titleLineH + Math.round(titleSize * 0.9));
  });
  y += titleH;

  if (opts.priceLabel) {
    y += gapBeforePrice;
    ctx.font = `800 ${priceFont}px ${BODY}`;
    const tw = ctx.measureText(opts.priceLabel).width;
    const padX = Math.round(w * 0.038);
    const pillW = tw + padX * 2;
    roundRect(ctx, cx - pillW / 2, y, pillW, pricePillH, pricePillH / 2);
    ctx.fillStyle = th.accent;
    ctx.fill();
    ctx.fillStyle = th.accentInk;
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.priceLabel, cx, y + pricePillH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    y += pricePillH;
  }

  y += gapBeforeQr;
  const px = cx - panel / 2;
  const qr = await qrImage(opts.link, panel * 2, th);
  drawQrPanel(ctx, qr, px, y, panel, th, w);
  y += panel + gapAfterQr;

  ctx.textAlign = 'center';
  ctx.fillStyle = th.ink;
  ctx.font = `700 ${scanFont}px ${BODY}`;
  ctx.fillText(opts.scanLabel, cx, y + Math.round(scanFont * 0.9));

  if (opts.footnote) {
    ctx.fillStyle = th.inkSoft;
    ctx.font = `500 ${footFont}px ${BODY}`;
    ctx.fillText(opts.footnote, cx, y + Math.round(h * 0.032) + Math.round(footFont * 0.9));
  }

  drawFooter(ctx, w, h, M, th);
  return canvas.toDataURL('image/png');
}

