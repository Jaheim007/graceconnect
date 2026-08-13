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
  const markSize = Math.round(w * 0.07);
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
  ctx.font = `600 ${Math.round(w * 0.024)}px ${body}`;
  ctx.fillText(opts.brandLabel || 'SiteViral', M + markSize + Math.round(w * 0.022), M + markSize * 0.64);

  // ── Vertical budget, computed from the bottom up so nothing ever collides ──
  const qrSize = Math.round(w * 0.15);
  const footerTop = h - M - qrSize;
  const ctaH = Math.round(w * 0.095);
  const ctaY = footerTop - Math.round(w * 0.07) - ctaH;
  const priceSize = Math.round(w * 0.066);
  const priceBaseline = ctaY - Math.round(w * 0.038);
  const contentTop = M + markSize + Math.round(h * 0.045);
  const contentBottom = priceBaseline - priceSize - Math.round(w * 0.03);

  // ── Cover panel (right side, opaque so the band never bleeds through) ──
  const coverW = Math.round(w * 0.36);
  const coverX = w - bandW - Math.round(w * 0.04) + Math.round(bandW * 0.35) - coverW;
  const coverH = Math.min(Math.round(coverW * 1.45), contentBottom - contentTop);
  const coverY = contentTop + Math.max(0, Math.round((contentBottom - contentTop - coverH) / 2));
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = Math.round(w * 0.045);
  ctx.shadowOffsetY = Math.round(w * 0.018);
  ctx.fillStyle = th.bg;
  roundRect(ctx, coverX, coverY, coverW, coverH, Math.round(w * 0.018));
  ctx.fill();
  ctx.restore();

  const img = opts.coverUrl ? await loadImage(opts.coverUrl) : null;
  ctx.save();
  roundRect(ctx, coverX, coverY, coverW, coverH, Math.round(w * 0.018));
  ctx.clip();
  ctx.fillStyle = th.panel;
  ctx.fillRect(coverX, coverY, coverW, coverH);
  if (img) {
    drawCover(ctx, img, coverX, coverY, coverW, coverH);
  } else {
    ctx.fillStyle = th.inkSoft;
    const phSize = Math.round(w * 0.038);
    ctx.font = `700 ${phSize}px ${heading}`;
    ctx.textAlign = 'center';
    const tl = wrap(ctx, opts.title, coverW - Math.round(w * 0.05), 4);
    tl.forEach((line, i) =>
      ctx.fillText(line, coverX + coverW / 2, coverY + coverH / 2 - ((tl.length - 1) / 2 - i) * phSize * 1.25),
    );
    ctx.textAlign = 'left';
  }
  ctx.restore();
  ctx.strokeStyle = th.accent;
  ctx.lineWidth = Math.max(2, Math.round(w * 0.0035));
  roundRect(ctx, coverX, coverY, coverW, coverH, Math.round(w * 0.018));
  ctx.stroke();

  // ── Text column (left of the cover), auto-fitted into the budget ──
  const colW = coverX - M - Math.round(w * 0.045);
  const bylineH = opts.byline ? Math.round(w * 0.05) : 0;
  const authorH = opts.author ? Math.round(w * 0.055) : 0;
  const benefitSize = Math.round(w * 0.03);
  const benefitLinesMax = 3;

  ctx.font = `400 ${benefitSize}px ${body}`;
  const benefitLines = opts.benefit ? wrap(ctx, opts.benefit, colW, benefitLinesMax) : [];
  const benefitH = benefitLines.length ? benefitLines.length * Math.round(benefitSize * 1.4) + Math.round(w * 0.012) : 0;

  const availableForTitle = contentBottom - contentTop - bylineH - authorH - benefitH;
  let titleSize = Math.round(w * 0.088);
  let titleLines: string[] = [];
  const minTitle = Math.round(w * 0.042);
  for (;;) {
    ctx.font = `800 ${titleSize}px ${heading}`;
    titleLines = wrap(ctx, opts.title, colW, 5);
    const needed = titleLines.length * titleSize * 1.08;
    if (needed <= availableForTitle || titleSize <= minTitle) break;
    titleSize -= Math.round(w * 0.004);
  }

  let y = contentTop;

  if (opts.byline) {
    ctx.fillStyle = th.accent;
    ctx.font = `700 ${Math.round(w * 0.023)}px ${body}`;
    ctx.fillText(opts.byline.toUpperCase(), M, y + Math.round(w * 0.023));
    y += bylineH;
  }

  ctx.fillStyle = th.ink;
  ctx.font = `800 ${titleSize}px ${heading}`;
  for (const line of titleLines) {
    ctx.fillText(line, M, y + titleSize * 0.85);
    y += Math.round(titleSize * 1.08);
  }

  if (opts.author) {
    ctx.fillStyle = th.inkSoft;
    ctx.font = `600 ${Math.round(w * 0.027)}px ${body}`;
    ctx.fillText(opts.author, M, y + Math.round(w * 0.032));
    y += authorH;
  }

  if (benefitLines.length) {
    ctx.fillStyle = th.inkSoft;
    ctx.font = `400 ${benefitSize}px ${body}`;
    y += Math.round(w * 0.012);
    for (const line of benefitLines) {
      ctx.fillText(line, M, y + benefitSize);
      y += Math.round(benefitSize * 1.4);
    }
  }

  // ── Price ──
  ctx.fillStyle = th.ink;
  ctx.font = `800 ${priceSize}px ${heading}`;
  ctx.fillText(opts.priceLabel, M, priceBaseline);

  // ── CTA button ──
  ctx.font = `800 ${Math.round(w * 0.032)}px ${heading}`;
  const ctaW = Math.min(colW, ctx.measureText(opts.ctaLabel).width + Math.round(w * 0.11));
  ctx.fillStyle = th.accent;
  roundRect(ctx, M, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.fillStyle = th.accentInk;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.ctaLabel, M + ctaW / 2, ctaY + ctaH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // ── Footer: QR + link ──
  try {
    const qrUrl = await QRCode.toDataURL(opts.link, {
      margin: 1,
      width: qrSize * 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const qrImg = await loadImage(qrUrl);
    if (qrImg) {
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, M, footerTop, qrSize, qrSize, Math.round(w * 0.012));
      ctx.fill();
      const pad = Math.round(qrSize * 0.06);
      ctx.drawImage(qrImg, M + pad, footerTop + pad, qrSize - pad * 2, qrSize - pad * 2);
    }
  } catch {
    /* QR is optional */
  }

  const linkText = opts.link.replace(/^https?:\/\//, '');
  const linkX = M + qrSize + Math.round(w * 0.03);
  const linkMaxW = coverX + Math.round(w * 0.1) - linkX;
  const linkSize = Math.round(w * 0.027);
  ctx.fillStyle = th.ink;
  ctx.font = `700 ${linkSize}px ${body}`;
  const linkLines = wrap(ctx, linkText, linkMaxW, 2);
  linkLines.forEach((line, i) =>
    ctx.fillText(line, linkX, footerTop + Math.round(qrSize * 0.42) + i * Math.round(linkSize * 1.35)),
  );
  ctx.fillStyle = th.inkSoft;
  ctx.font = `500 ${Math.round(w * 0.021)}px ${body}`;
  ctx.fillText(
    'Scanne le QR ou clique le lien',
    linkX,
    footerTop + Math.round(qrSize * 0.42) + linkLines.length * Math.round(linkSize * 1.35) + Math.round(w * 0.01),
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

