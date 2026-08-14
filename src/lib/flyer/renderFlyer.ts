import QRCode from 'qrcode';
import flyerLogo from '@/assets/flyer-logo.png.asset.json';

/**
 * Flyer engine — renders a share-ready promotional flyer for a product
 * entirely in the browser (canvas). No AI credits, instant, works offline
 * once the cover image is loaded.
 *
 * Same engine for sellers (product link) and ambassadors (referral link).
 */

export type FlyerFormat = 'poster' | 'square' | 'story';
export type FlyerTheme = 'navy' | 'dark' | 'light' | 'church';

export const FLYER_FORMATS: Record<FlyerFormat, { w: number; h: number }> = {
  poster: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
};

interface ThemeTokens {
  bg: string;
  bg2: string;
  band: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentInk: string;
  panel: string;
  glow: string;
}

export const FLYER_THEMES: Record<FlyerTheme, ThemeTokens> = {
  navy: {
    bg: '#061a52',
    bg2: '#0b2f8f',
    band: '#eab308',
    ink: '#ffffff',
    inkSoft: 'rgba(255,255,255,0.74)',
    accent: '#f5c518',
    accentInk: '#0a1a3f',
    panel: 'rgba(255,255,255,0.08)',
    glow: 'rgba(245,197,24,0.30)',
  },
  dark: {
    bg: '#06080f',
    bg2: '#12203a',
    band: '#2563eb',
    ink: '#ffffff',
    inkSoft: 'rgba(255,255,255,0.7)',
    accent: '#3b82f6',
    accentInk: '#ffffff',
    panel: 'rgba(255,255,255,0.07)',
    glow: 'rgba(59,130,246,0.32)',
  },
  light: {
    bg: '#fbf9f4',
    bg2: '#efeae0',
    band: '#082472',
    ink: '#111827',
    inkSoft: 'rgba(17,24,39,0.62)',
    accent: '#082472',
    accentInk: '#ffffff',
    panel: 'rgba(8,36,114,0.06)',
    glow: 'rgba(8,36,114,0.14)',
  },
  church: {
    bg: '#0b1424',
    bg2: '#1d2b48',
    band: '#c9a227',
    ink: '#fdf9ee',
    inkSoft: 'rgba(253,249,238,0.72)',
    accent: '#dfb63a',
    accentInk: '#101a2e',
    panel: 'rgba(253,249,238,0.07)',
    glow: 'rgba(223,182,58,0.28)',
  },
};

export interface FlyerData {
  title: string;
  author?: string | null;
  benefit?: string | null;
  priceLabel: string;
  coverUrl?: string | null;
  link: string;
  /** e.g. "Partagé par Jean" for ambassadors */
  byline?: string | null;
  ctaLabel: string;
  brandLabel?: string;
  /** Organization / workspace name shown in a badge */
  orgName?: string | null;
  /** Organization logo / avatar shown in the badge */
  orgAvatarUrl?: string | null;
  /** Localized footer hint, e.g. "Scanne le QR code" */
  scanLabel?: string;
}

export interface RenderFlyerOptions extends FlyerData {
  format: FlyerFormat;
  theme: FlyerTheme;
}

const HEADING = '"Bricolage Grotesque", "Inter", system-ui, sans-serif';
const BODY = '"Inter", system-ui, sans-serif';

/** Strip HTML tags / entities so rich-text descriptions never leak markup. */
export function plainText(input?: string | null): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
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
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 4) {
      last = last.slice(0, -1);
    }
    if (words.join(' ') !== lines.join(' ')) lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw an image cropped to fill a rect (object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ratio = Math.max(w / img.width, h / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// ─── Decorative background ───

function paintBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  th: ThemeTokens,
) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.6, h);
  grad.addColorStop(0, th.bg2);
  grad.addColorStop(0.55, th.bg);
  grad.addColorStop(1, th.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Accent glow, top-right
  const glow = ctx.createRadialGradient(w * 0.92, h * 0.06, 0, w * 0.92, h * 0.06, w * 0.75);
  glow.addColorStop(0, th.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Soft bottom vignette for text contrast
  const vig = ctx.createLinearGradient(0, h * 0.55, 0, h);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, th.bg === '#fbf9f4' ? 'rgba(8,36,114,0.08)' : 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Fine diagonal texture
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = th.ink;
  ctx.lineWidth = 2;
  for (let i = -h; i < w; i += Math.round(w * 0.05)) {
    ctx.beginPath();
    ctx.moveTo(i, h);
    ctx.lineTo(i + h, 0);
    ctx.stroke();
  }
  ctx.restore();

  // Accent arc, top-right corner
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = th.accent;
  ctx.lineWidth = Math.round(w * 0.012);
  ctx.beginPath();
  ctx.arc(w + w * 0.06, -w * 0.06, w * 0.28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = Math.round(w * 0.005);
  ctx.beginPath();
  ctx.arc(w + w * 0.06, -w * 0.06, w * 0.38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Accent corner ribbon, bottom-left
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = th.accent;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - Math.round(w * 0.16));
  ctx.lineTo(Math.round(w * 0.16), h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

async function paintBrandRow(
  ctx: CanvasRenderingContext2D,
  w: number,
  M: number,
  th: ThemeTokens,
  opts: RenderFlyerOptions,
  logo: HTMLImageElement | null,
  orgAvatar: HTMLImageElement | null,
): Promise<number> {
  const markSize = Math.round(w * 0.075);

  // Logo tile (brand mark already has its own navy background)
  ctx.save();
  roundRect(ctx, M, M, markSize, markSize, markSize * 0.28);
  ctx.clip();
  if (logo) {
    drawCover(ctx, logo, M, M, markSize, markSize);
  } else {
    ctx.fillStyle = th.accent;
    ctx.fillRect(M, M, markSize, markSize);
    ctx.fillStyle = th.accentInk;
    ctx.font = `800 ${Math.round(markSize * 0.6)}px ${HEADING}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', M + markSize / 2, M + markSize / 2 + 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();

  ctx.fillStyle = th.ink;
  ctx.font = `700 ${Math.round(w * 0.028)}px ${BODY}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.brandLabel || 'SiteViral', M + markSize + Math.round(w * 0.02), M + markSize / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // Organization badge (right aligned)
  const orgName = (opts.orgName || '').trim();
  if (orgName) {
    const avSize = Math.round(w * 0.055);
    const pad = Math.round(w * 0.018);
    ctx.font = `700 ${Math.round(w * 0.023)}px ${BODY}`;
    let label = orgName;
    const maxLabelW = w * 0.34;
    while (ctx.measureText(label).width > maxLabelW && label.length > 6) {
      label = label.slice(0, -2);
    }
    if (label !== orgName) label = `${label.trimEnd()}…`;
    const labelW = ctx.measureText(label).width;
    const pillH = avSize + pad;
    const pillW = avSize + labelW + pad * 2.6;
    const pillX = w - M - pillW;
    const pillY = M + Math.round((markSize - pillH) / 2);

    ctx.fillStyle = th.panel;
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.strokeStyle = th.accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const avX = pillX + pad * 0.5;
    const avY = pillY + (pillH - avSize) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
    ctx.clip();
    if (orgAvatar) {
      drawCover(ctx, orgAvatar, avX, avY, avSize, avSize);
    } else {
      ctx.fillStyle = th.accent;
      ctx.fillRect(avX, avY, avSize, avSize);
      ctx.fillStyle = th.accentInk;
      ctx.font = `800 ${Math.round(avSize * 0.5)}px ${HEADING}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orgName.charAt(0).toUpperCase(), avX + avSize / 2, avY + avSize / 2 + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    ctx.fillStyle = th.ink;
    ctx.font = `700 ${Math.round(w * 0.023)}px ${BODY}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(label, avX + avSize + pad, pillY + pillH / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }

  return M + markSize;
}

function paintCoverPanel(
  ctx: CanvasRenderingContext2D,
  w: number,
  th: ThemeTokens,
  img: HTMLImageElement | null,
  title: string,
  x: number,
  y: number,
  cw: number,
  ch: number,
) {
  const r = Math.round(w * 0.02);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = Math.round(w * 0.06);
  ctx.shadowOffsetY = Math.round(w * 0.02);
  ctx.fillStyle = th.bg;
  roundRect(ctx, x, y, cw, ch, r);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, cw, ch, r);
  ctx.clip();
  ctx.fillStyle = th.panel;
  ctx.fillRect(x, y, cw, ch);
  if (img) {
    drawCover(ctx, img, x, y, cw, ch);
  } else {
    ctx.fillStyle = th.inkSoft;
    const phSize = Math.round(w * 0.038);
    ctx.font = `700 ${phSize}px ${HEADING}`;
    ctx.textAlign = 'center';
    const tl = wrap(ctx, title, cw - Math.round(w * 0.05), 4);
    tl.forEach((line, i) =>
      ctx.fillText(line, x + cw / 2, y + ch / 2 - ((tl.length - 1) / 2 - i) * phSize * 1.25),
    );
    ctx.textAlign = 'left';
  }
  // Glass sheen
  const sheen = ctx.createLinearGradient(x, y, x + cw, y + ch);
  sheen.addColorStop(0, 'rgba(255,255,255,0.18)');
  sheen.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x, y, cw, ch);
  ctx.restore();

  ctx.strokeStyle = th.accent;
  ctx.lineWidth = Math.max(2, Math.round(w * 0.004));
  roundRect(ctx, x, y, cw, ch, r);
  ctx.stroke();
}

function paintCta(
  ctx: CanvasRenderingContext2D,
  w: number,
  th: ThemeTokens,
  label: string,
  x: number,
  y: number,
  maxW: number,
): { h: number; w: number } {
  const h = Math.round(w * 0.098);
  ctx.font = `800 ${Math.round(w * 0.032)}px ${HEADING}`;
  const cw = Math.min(maxW, ctx.measureText(label).width + Math.round(w * 0.12));
  ctx.save();
  ctx.shadowColor = th.glow;
  ctx.shadowBlur = Math.round(w * 0.05);
  const g = ctx.createLinearGradient(x, y, x + cw, y + h);
  g.addColorStop(0, th.accent);
  g.addColorStop(1, th.band);
  ctx.fillStyle = g;
  roundRect(ctx, x, y, cw, h, h / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = th.accentInk;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + cw / 2, y + h / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return { h, w: cw };
}

async function paintFooter(
  ctx: CanvasRenderingContext2D,
  w: number,
  th: ThemeTokens,
  link: string,
  scanLabel: string,
  x: number,
  y: number,
  qrSize: number,
) {
  try {
    const qrUrl = await QRCode.toDataURL(link, {
      margin: 1,
      width: qrSize * 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const qrImg = await loadImage(qrUrl);
    if (qrImg) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = Math.round(w * 0.03);
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, x, y, qrSize, qrSize, Math.round(w * 0.014));
      ctx.fill();
      ctx.restore();
      const pad = Math.round(qrSize * 0.07);
      ctx.drawImage(qrImg, x + pad, y + pad, qrSize - pad * 2, qrSize - pad * 2);
    }
  } catch {
    /* QR is optional */
  }

  const tx = x + qrSize + Math.round(w * 0.03);
  ctx.fillStyle = th.ink;
  ctx.font = `800 ${Math.round(w * 0.032)}px ${HEADING}`;
  ctx.fillText(scanLabel, tx, y + Math.round(qrSize * 0.45));
  ctx.fillStyle = th.inkSoft;
  ctx.font = `500 ${Math.round(w * 0.022)}px ${BODY}`;
  ctx.fillText('siteviral.com', tx, y + Math.round(qrSize * 0.78));
}

/**
 * Renders the flyer and returns a PNG data URL.
 */
export async function renderFlyer(opts: RenderFlyerOptions): Promise<string> {
  const { w, h } = FLYER_FORMATS[opts.format];
  const th = FLYER_THEMES[opts.theme];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unavailable');

  const M = Math.round(w * 0.075);
  const title = plainText(opts.title) || opts.title;
  const benefit = plainText(opts.benefit);
  const author = plainText(opts.author);
  const scanLabel = opts.scanLabel || 'Scanne le QR code';

  const [logo, cover, orgAvatar] = await Promise.all([
    loadImage(flyerLogo.url),
    opts.coverUrl ? loadImage(opts.coverUrl) : Promise.resolve(null),
    opts.orgAvatarUrl ? loadImage(opts.orgAvatarUrl) : Promise.resolve(null),
  ]);

  paintBackground(ctx, w, h, th);
  const headerBottom = await paintBrandRow(ctx, w, M, th, opts, logo, orgAvatar);

  const qrSize = Math.round(w * 0.155);
  const footerTop = h - M - qrSize;
  const isStory = opts.format === 'story';

  if (isStory) {
    // ── Stacked, editorial layout for 9:16 (budgeted from the bottom up) ──
    const ctaH = Math.round(w * 0.098);
    const ctaY = footerTop - Math.round(w * 0.1) - ctaH;
    const priceSize = Math.round(w * 0.068);
    const priceBaseline = ctaY - Math.round(w * 0.045);
    const textBottom = priceBaseline - priceSize - Math.round(w * 0.03);
    const colW = w - M * 2;

    const contentTop = headerBottom + Math.round(h * 0.035);
    const bylineH = opts.byline ? Math.round(w * 0.05) : 0;
    const authorH = author ? Math.round(w * 0.058) : 0;
    const benefitSize = Math.round(w * 0.03);

    ctx.font = `400 ${benefitSize}px ${BODY}`;
    let benefitLines = benefit ? wrap(ctx, benefit, colW, 2) : [];

    // Title block sizing
    let titleSize = Math.round(w * 0.082);
    let titleLines: string[] = [];
    const minTitle = Math.round(w * 0.05);
    const blockH = () =>
      bylineH +
      titleLines.length * Math.round(titleSize * 1.1) +
      authorH +
      (benefitLines.length ? benefitLines.length * Math.round(benefitSize * 1.45) + Math.round(w * 0.014) : 0);

    for (;;) {
      ctx.font = `800 ${titleSize}px ${HEADING}`;
      titleLines = wrap(ctx, title, colW, 3);
      // Cover takes whatever is left above the text block
      const textH = blockH();
      const coverSpace = textBottom - contentTop - textH - Math.round(h * 0.03);
      if (coverSpace >= Math.round(h * 0.3) || titleSize <= minTitle) break;
      titleSize -= Math.round(w * 0.004);
    }

    // Drop the benefit if space is still tight
    if (benefitLines.length) {
      const coverSpace = textBottom - contentTop - blockH() - Math.round(h * 0.03);
      if (coverSpace < Math.round(h * 0.3)) benefitLines = [];
    }

    const textH = blockH();
    const coverMaxH = textBottom - contentTop - textH - Math.round(h * 0.035);
    const coverW = Math.min(Math.round(w * 0.58), Math.round(coverMaxH / 1.42));
    const coverH = Math.min(coverMaxH, Math.round(coverW * 1.42));
    paintCoverPanel(ctx, w, th, cover, title, Math.round((w - coverW) / 2), contentTop, coverW, coverH);

    let y = textBottom - textH;

    if (opts.byline) {
      ctx.fillStyle = th.accent;
      ctx.font = `700 ${Math.round(w * 0.024)}px ${BODY}`;
      ctx.fillText(plainText(opts.byline).toUpperCase(), M, y + Math.round(w * 0.024));
      y += bylineH;
    }

    ctx.fillStyle = th.ink;
    ctx.font = `800 ${titleSize}px ${HEADING}`;
    for (const line of titleLines) {
      ctx.fillText(line, M, y + titleSize * 0.85);
      y += Math.round(titleSize * 1.1);
    }

    if (author) {
      ctx.fillStyle = th.inkSoft;
      ctx.font = `600 ${Math.round(w * 0.028)}px ${BODY}`;
      ctx.fillText(author, M, y + Math.round(w * 0.032));
      y += authorH;
    }

    if (benefitLines.length) {
      ctx.fillStyle = th.inkSoft;
      ctx.font = `400 ${benefitSize}px ${BODY}`;
      y += Math.round(w * 0.014);
      for (const line of benefitLines) {
        ctx.fillText(line, M, y + benefitSize);
        y += Math.round(benefitSize * 1.45);
      }
    }

    ctx.fillStyle = th.ink;
    ctx.font = `800 ${priceSize}px ${HEADING}`;
    ctx.fillText(opts.priceLabel, M, priceBaseline);
    paintCta(ctx, w, th, opts.ctaLabel, M, ctaY, colW);
  } else {

    // ── Split layout for poster / square ──
    const ctaH = Math.round(w * 0.098);
    const ctaY = footerTop - Math.round(w * 0.075) - ctaH;
    const priceSize = Math.round(w * 0.068);
    const priceBaseline = ctaY - Math.round(w * 0.04);
    const contentTop = headerBottom + Math.round(h * 0.05);
    const contentBottom = priceBaseline - priceSize - Math.round(w * 0.03);

    const coverW = Math.round(w * 0.35);
    const coverX = w - M - coverW;
    const coverH = Math.min(Math.round(coverW * 1.45), contentBottom - contentTop);
    const coverY = contentTop + Math.max(0, Math.round((contentBottom - contentTop - coverH) / 2));
    paintCoverPanel(ctx, w, th, cover, title, coverX, coverY, coverW, coverH);

    const colW = coverX - M - Math.round(w * 0.05);
    const bylineH = opts.byline ? Math.round(w * 0.05) : 0;
    const authorH = author ? Math.round(w * 0.056) : 0;
    const benefitSize = Math.round(w * 0.03);

    ctx.font = `400 ${benefitSize}px ${BODY}`;
    const benefitLines = benefit ? wrap(ctx, benefit, colW, 3) : [];
    const benefitH = benefitLines.length
      ? benefitLines.length * Math.round(benefitSize * 1.45) + Math.round(w * 0.014)
      : 0;

    const availableForTitle = contentBottom - contentTop - bylineH - authorH - benefitH;
    let titleSize = Math.round(w * 0.086);
    let titleLines: string[] = [];
    const minTitle = Math.round(w * 0.042);
    for (;;) {
      ctx.font = `800 ${titleSize}px ${HEADING}`;
      titleLines = wrap(ctx, title, colW, 5);
      if (titleLines.length * titleSize * 1.08 <= availableForTitle || titleSize <= minTitle) break;
      titleSize -= Math.round(w * 0.004);
    }

    let y = contentTop;
    if (opts.byline) {
      ctx.fillStyle = th.accent;
      ctx.font = `700 ${Math.round(w * 0.023)}px ${BODY}`;
      ctx.fillText(plainText(opts.byline).toUpperCase(), M, y + Math.round(w * 0.023));
      y += bylineH;
    }

    ctx.fillStyle = th.ink;
    ctx.font = `800 ${titleSize}px ${HEADING}`;
    for (const line of titleLines) {
      ctx.fillText(line, M, y + titleSize * 0.85);
      y += Math.round(titleSize * 1.08);
    }

    if (author) {
      ctx.fillStyle = th.inkSoft;
      ctx.font = `600 ${Math.round(w * 0.028)}px ${BODY}`;
      ctx.fillText(author, M, y + Math.round(w * 0.032));
      y += authorH;
    }

    if (benefitLines.length) {
      ctx.fillStyle = th.inkSoft;
      ctx.font = `400 ${benefitSize}px ${BODY}`;
      y += Math.round(w * 0.014);
      for (const line of benefitLines) {
        ctx.fillText(line, M, y + benefitSize);
        y += Math.round(benefitSize * 1.45);
      }
    }

    ctx.fillStyle = th.ink;
    ctx.font = `800 ${priceSize}px ${HEADING}`;
    ctx.fillText(opts.priceLabel, M, priceBaseline);
    paintCta(ctx, w, th, opts.ctaLabel, M, ctaY, colW);
  }

  await paintFooter(ctx, w, th, opts.link, scanLabel, M, footerTop, qrSize);

  return canvas.toDataURL('image/png');
}

/** Ready-to-paste captions for the flyer. */
export function buildFlyerCaptions(opts: {
  title: string;
  priceLabel: string;
  link: string;
  isFr: boolean;
  benefit?: string | null;
}) {
  const { priceLabel, link, isFr } = opts;
  const title = plainText(opts.title) || opts.title;
  const benefit = plainText(opts.benefit);
  if (isFr) {
    return {
      whatsapp: `📖 *${title}*\n${benefit ? `${benefit}\n` : ''}Prix : ${priceLabel}\n\n👉 ${link}\n\nPaiement Mobile Money / Wave. Accès immédiat après paiement.`,
      facebook: `${title}\n\n${benefit ? `${benefit}\n\n` : ''}Disponible dès maintenant — ${priceLabel}.\nPaiement mobile, accès immédiat.\n\n${link}`,
      email: `Objet : ${title}\n\nBonjour,\n\nJe viens de publier « ${title} ».${benefit ? `\n${benefit}` : ''}\n\nPrix : ${priceLabel}\nLien direct : ${link}\n\nLe paiement se fait par Mobile Money, Wave ou carte, et l'accès est immédiat après le paiement.\n\nMerci et bonne lecture.`,
      short: `${title} — ${priceLabel} 👉 ${link}`,
    };
  }
  return {
    whatsapp: `📖 *${title}*\n${benefit ? `${benefit}\n` : ''}Price: ${priceLabel}\n\n👉 ${link}\n\nMobile Money / card accepted. Instant access after payment.`,
    facebook: `${title}\n\n${benefit ? `${benefit}\n\n` : ''}Available now — ${priceLabel}.\nMobile payment, instant access.\n\n${link}`,
    email: `Subject: ${title}\n\nHi,\n\nI just published "${title}".${benefit ? `\n${benefit}` : ''}\n\nPrice: ${priceLabel}\nDirect link: ${link}\n\nPayment by Mobile Money, Wave or card, with instant access after payment.\n\nThanks and enjoy.`,
    short: `${title} — ${priceLabel} 👉 ${link}`,
  };
}
