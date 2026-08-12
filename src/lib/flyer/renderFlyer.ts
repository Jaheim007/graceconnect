import QRCode from 'qrcode';

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
  band: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentInk: string;
  panel: string;
}

export const FLYER_THEMES: Record<FlyerTheme, ThemeTokens> = {
  navy: {
    bg: '#082472',
    band: '#eab308',
    ink: '#ffffff',
    inkSoft: 'rgba(255,255,255,0.72)',
    accent: '#eab308',
    accentInk: '#0a1a3f',
    panel: 'rgba(255,255,255,0.08)',
  },
  dark: {
    bg: '#0b0f1a',
    band: '#2563eb',
    ink: '#ffffff',
    inkSoft: 'rgba(255,255,255,0.68)',
    accent: '#3b82f6',
    accentInk: '#ffffff',
    panel: 'rgba(255,255,255,0.06)',
  },
  light: {
    bg: '#f7f5ef',
    band: '#082472',
    ink: '#111827',
    inkSoft: 'rgba(17,24,39,0.6)',
    accent: '#082472',
    accentInk: '#ffffff',
    panel: 'rgba(8,36,114,0.06)',
  },
  church: {
    bg: '#101a2e',
    band: '#c9a227',
    ink: '#fdf9ee',
    inkSoft: 'rgba(253,249,238,0.7)',
    accent: '#c9a227',
    accentInk: '#101a2e',
    panel: 'rgba(253,249,238,0.07)',
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
}

export interface RenderFlyerOptions extends FlyerData {
  format: FlyerFormat;
  theme: FlyerTheme;
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

  const M = Math.round(w * 0.075); // margin
  const heading = '"Bricolage Grotesque", "Inter", system-ui, sans-serif';
  const body = '"Inter", system-ui, sans-serif';

  // ── Background ──
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, w, h);

  // Accent band on the right edge (brand signature)
  const bandW = Math.round(w * 0.14);
  ctx.fillStyle = th.band;
  ctx.globalAlpha = 0.95;
  ctx.fillRect(w - bandW - Math.round(w * 0.04), 0, bandW, h);
  ctx.globalAlpha = 1;

  // Diagonal stripes bottom-left
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = th.band;
  for (let i = 0; i < 4; i++) {
    const sx = -Math.round(w * 0.02) + i * Math.round(w * 0.075);
    ctx.beginPath();
    ctx.moveTo(sx, h);
    ctx.lineTo(sx + Math.round(w * 0.05), h);
    ctx.lineTo(sx + Math.round(w * 0.105), h - Math.round(w * 0.09));
    ctx.lineTo(sx + Math.round(w * 0.055), h - Math.round(w * 0.09));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ── Brand mark ──
  const markSize = Math.round(w * 0.075);
  ctx.fillStyle = th.accent;
  roundRect(ctx, M, M, markSize, markSize, markSize * 0.28);
  ctx.fill();
  ctx.fillStyle = th.accentInk;
  ctx.font = `800 ${Math.round(markSize * 0.6)}px ${heading}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', M + markSize / 2, M + markSize / 2 + 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = th.inkSoft;
  ctx.font = `600 ${Math.round(w * 0.026)}px ${body}`;
  ctx.fillText(opts.brandLabel || 'SiteViral', M + markSize + Math.round(w * 0.025), M + markSize * 0.62);

  // ── Cover panel ──
  const coverW = Math.round(w * 0.44);
  const coverH = Math.round(coverW * 1.4);
  const coverX = w - bandW - Math.round(w * 0.04) - coverW * 0.72;
  const coverY = Math.round(h * (opts.format === 'story' ? 0.30 : 0.34));
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.round(w * 0.05);
  ctx.shadowOffsetY = Math.round(w * 0.02);
  ctx.fillStyle = th.panel;
  roundRect(ctx, coverX, coverY, coverW, coverH, Math.round(w * 0.02));
  ctx.fill();
  ctx.restore();

  const img = opts.coverUrl ? await loadImage(opts.coverUrl) : null;
  ctx.save();
  roundRect(ctx, coverX, coverY, coverW, coverH, Math.round(w * 0.02));
  ctx.clip();
  if (img) {
    drawCover(ctx, img, coverX, coverY, coverW, coverH);
  } else {
    ctx.fillStyle = th.panel;
    ctx.fillRect(coverX, coverY, coverW, coverH);
    ctx.fillStyle = th.inkSoft;
    ctx.font = `700 ${Math.round(w * 0.05)}px ${heading}`;
    ctx.textAlign = 'center';
    const tl = wrap(ctx, opts.title, coverW - Math.round(w * 0.06), 4);
    tl.forEach((line, i) =>
      ctx.fillText(line, coverX + coverW / 2, coverY + coverH / 2 - ((tl.length - 1) * 0.5 - i) * w * 0.06),
    );
    ctx.textAlign = 'left';
  }
  ctx.restore();
  // thin frame
  ctx.strokeStyle = th.accent;
  ctx.lineWidth = Math.max(2, Math.round(w * 0.004));
  roundRect(ctx, coverX, coverY, coverW, coverH, Math.round(w * 0.02));
  ctx.stroke();

  // ── Text column (left of the cover) ──
  const colW = coverX - M - Math.round(w * 0.04);
  let y = Math.round(h * (opts.format === 'story' ? 0.24 : 0.22));

  if (opts.byline) {
    ctx.fillStyle = th.accent;
    ctx.font = `700 ${Math.round(w * 0.024)}px ${body}`;
    ctx.fillText(opts.byline.toUpperCase(), M, y);
    y += Math.round(w * 0.05);
  }

  // Title
  const titleSize = Math.round(w * (opts.title.length > 42 ? 0.075 : 0.095));
  ctx.fillStyle = th.ink;
  ctx.font = `800 ${titleSize}px ${heading}`;
  const titleLines = wrap(ctx, opts.title, colW, 4);
  for (const line of titleLines) {
    ctx.fillText(line, M, y + titleSize * 0.85);
    y += Math.round(titleSize * 1.08);
  }

  // Author
  if (opts.author) {
    y += Math.round(w * 0.018);
    ctx.fillStyle = th.inkSoft;
    ctx.font = `600 ${Math.round(w * 0.028)}px ${body}`;
    ctx.fillText(opts.author, M, y + Math.round(w * 0.028));
    y += Math.round(w * 0.055);
  }

  // Benefit line
  if (opts.benefit) {
    y += Math.round(w * 0.012);
    ctx.fillStyle = th.inkSoft;
    const bSize = Math.round(w * 0.032);
    ctx.font = `400 ${bSize}px ${body}`;
    const bLines = wrap(ctx, opts.benefit, colW, 3);
    for (const line of bLines) {
      ctx.fillText(line, M, y + bSize);
      y += Math.round(bSize * 1.4);
    }
  }

  // Price
  y += Math.round(w * 0.04);
  ctx.fillStyle = th.ink;
  ctx.font = `800 ${Math.round(w * 0.072)}px ${heading}`;
  ctx.fillText(opts.priceLabel, M, y + Math.round(w * 0.06));
  y += Math.round(w * 0.115);

  // CTA button
  const ctaH = Math.round(w * 0.095);
  ctx.font = `800 ${Math.round(w * 0.034)}px ${heading}`;
  const ctaW = Math.min(colW, ctx.measureText(opts.ctaLabel).width + Math.round(w * 0.12));
  ctx.fillStyle = th.accent;
  roundRect(ctx, M, y, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.fillStyle = th.accentInk;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.ctaLabel, M + ctaW / 2, y + ctaH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // ── Footer: link + QR ──
  const qrSize = Math.round(w * 0.17);
  const footerY = h - M - qrSize;
  try {
    const qrUrl = await QRCode.toDataURL(opts.link, {
      margin: 1,
      width: qrSize * 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const qrImg = await loadImage(qrUrl);
    if (qrImg) {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, M, footerY, qrSize, qrSize, Math.round(w * 0.014));
      ctx.fill();
      const pad = Math.round(qrSize * 0.06);
      ctx.drawImage(qrImg, M + pad, footerY + pad, qrSize - pad * 2, qrSize - pad * 2);
    }
  } catch {
    /* QR is optional */
  }

  const linkText = opts.link.replace(/^https?:\/\//, '');
  ctx.fillStyle = th.ink;
  ctx.font = `700 ${Math.round(w * 0.03)}px ${body}`;
  const linkX = M + qrSize + Math.round(w * 0.035);
  const linkLines = wrap(ctx, linkText, w - linkX - bandW - Math.round(w * 0.08), 2);
  linkLines.forEach((line, i) =>
    ctx.fillText(line, linkX, footerY + qrSize * 0.45 + i * Math.round(w * 0.042)),
  );
  ctx.fillStyle = th.inkSoft;
  ctx.font = `500 ${Math.round(w * 0.022)}px ${body}`;
  ctx.fillText(
    'Scanne ou clique le lien',
    linkX,
    footerY + qrSize * 0.45 + linkLines.length * Math.round(w * 0.042) + Math.round(w * 0.008),
  );

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
  const { title, priceLabel, link, isFr, benefit } = opts;
  if (isFr) {
    return {
      whatsapp: `📖 *${title}*\n${benefit ? `${benefit}\n` : ''}Prix : ${priceLabel}\n\n👉 ${link}\n\nPaiement Mobile Money / Wave. Accès immédiat après paiement.`,
      facebook: `${title}\n\n${benefit ? `${benefit}\n\n` : ''}Disponible dès maintenant — ${priceLabel}.\nPaiement mobile, accès immédiat.\n\n${link}`,
      short: `${title} — ${priceLabel} 👉 ${link}`,
    };
  }
  return {
    whatsapp: `📖 *${title}*\n${benefit ? `${benefit}\n` : ''}Price: ${priceLabel}\n\n👉 ${link}\n\nMobile Money / card accepted. Instant access after payment.`,
    facebook: `${title}\n\n${benefit ? `${benefit}\n\n` : ''}Available now — ${priceLabel}.\nMobile payment, instant access.\n\n${link}`,
    short: `${title} — ${priceLabel} 👉 ${link}`,
  };
}
