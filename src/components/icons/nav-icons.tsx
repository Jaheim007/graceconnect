import type { ReactElement, SVGProps } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * SiteViral nav icon set — hand-drawn, iOS-flavoured glyphs.
 *
 * Every icon comes in a pair:
 *   - outline  (inactive state / sidebar rows)  → stroke = currentColor
 *   - solid    (active state / bottom nav)      → fill   = currentColor
 *
 * They never hardcode a colour, so light & dark mode both work through
 * the surrounding `text-*` semantic token.
 */

type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number | string };

function Outline({ children, strokeWidth = 1.9, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function Solid({ children, strokeWidth: _sw, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

/* ─────────────────────────── Home ─────────────────────────── */

const HOME_SHELL =
  'M3.2 10.7a3.4 3.4 0 0 1 1.19-2.58l5.4-4.6a3.4 3.4 0 0 1 4.42 0l5.4 4.6a3.4 3.4 0 0 1 1.19 2.58V17.7a3.1 3.1 0 0 1-3.1 3.1h-2.2a1.3 1.3 0 0 1-1.3-1.3v-3.1a2.2 2.2 0 0 0-4.4 0v3.1a1.3 1.3 0 0 1-1.3 1.3H6.3a3.1 3.1 0 0 1-3.1-3.1Z';

export const SvHome = (p: IconProps) => (
  <Outline {...p}>
    <path d={HOME_SHELL} />
  </Outline>
);

export const SvHomeSolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d={`${HOME_SHELL} M9.4 21.2v-4.9a2.6 2.6 0 0 1 5.2 0v4.9Z`}
    />
  </Solid>
);

/* ───────────────────── My Library (diary) ─────────────────── */

export const SvLibrary = (p: IconProps) => (
  <Outline {...p}>
    <path d="M7.4 3.2h9.4a2.6 2.6 0 0 1 2.6 2.6v12.4a2.6 2.6 0 0 1-2.6 2.6H7.4a2.6 2.6 0 0 1-2.6-2.6V5.8a2.6 2.6 0 0 1 2.6-2.6Z" />
    <path d="M8.1 3.4v17.2" />
    <path d="M12.6 3.4v6.9l2.3-1.7 2.3 1.7V3.4" />
  </Outline>
);

export const SvLibrarySolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.4 3.2h9.4a2.6 2.6 0 0 1 2.6 2.6v12.4a2.6 2.6 0 0 1-2.6 2.6H7.4a2.6 2.6 0 0 1-2.6-2.6V5.8a2.6 2.6 0 0 1 2.6-2.6Zm5.2 1.6v5.5a.8.8 0 0 0 1.28.64l1.02-.77 1.02.77a.8.8 0 0 0 1.28-.64V4.8Z"
    />
    <path d="M8.9 4v16h-1.5V4Z" opacity=".55" />
  </Solid>
);

/* ───────── Earn (centered dollar coin) ───── */

export const SvEarn = (p: IconProps) => (
  <Outline {...p}>
    <circle cx="12" cy="12" r="9.2" />
    <path d="M14.3 9.5a2.2 2.2 0 0 0-1.9-1.05h-1.1c-1.15 0-2 .7-2 1.7 0 .95.7 1.5 1.9 1.65l1.7.2c1.25.15 2 .75 2 1.75 0 1.05-.9 1.8-2.1 1.8h-1.2a2.3 2.3 0 0 1-1.95-1.05" />
    <path d="M12 6.1v2.35M12 15.55v2.35" />
  </Outline>
);

export const SvEarnSolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm.95 4.05a.95.95 0 0 0-1.9 0v.75h-.15c-1.63 0-2.95 1.24-2.95 2.85 0 1.6 1.2 2.5 2.72 2.68l1.7.2c.88.1 1.13.44 1.13.82 0 .5-.45.95-1.2.95h-1.2c-.62 0-1.1-.26-1.36-.65a.95.95 0 0 0-1.58 1.05 3.35 3.35 0 0 0 2.79 1.5h.15v.75a.95.95 0 0 0 1.9 0v-.75h.15c1.72 0 3.15-1.25 3.15-2.85 0-1.63-1.24-2.53-2.79-2.72l-1.7-.2c-.85-.1-1.06-.42-1.06-.78 0-.48.42-.95 1.05-.95h1.1c.6 0 1.09.28 1.34.68a.95.95 0 0 0 1.6-1.02 3.28 3.28 0 0 0-2.77-1.56v-.75Z"
    />
  </Solid>
);



/* ───────────────── Write a book (bold pencil) ─────────────── */

const PENCIL =
  'M4.1 19.9l.9-3.7a2 2 0 0 1 .53-.95L15.6 5.2a2.6 2.6 0 0 1 3.7 0l.5.5a2.6 2.6 0 0 1 0 3.7L9.75 19.47a2 2 0 0 1-.95.53l-3.7.9a.7.7 0 0 1-.85-.85Z';

export const SvPencil = (p: IconProps) => (
  <Outline {...p}>
    <path d={PENCIL} />
    <path d="M14.6 6.3l3.1 3.1" />
  </Outline>
);

export const SvPencilSolid = (p: IconProps) => (
  <Solid {...p}>
    <path d={PENCIL} />
  </Solid>
);

/* ───────────────── Revenue (wallet + arrow) ───────────────── */

export const SvWallet = (p: IconProps) => (
  <Outline {...p}>
    <path d="M3.2 8.4a3 3 0 0 1 3-3h11.6a3 3 0 0 1 3 3v7.2a3 3 0 0 1-3 3H6.2a3 3 0 0 1-3-3Z" />
    <path d="M3.2 10.6h5.1a1 1 0 0 1 1 1v.6a1 1 0 0 0 1 1h3.4a1 1 0 0 0 1-1v-.6a1 1 0 0 1 1-1h4.1" />
    <path d="M16.4 5.4l-2-2a2 2 0 0 0-2.2-.4L5.4 5.4" />
  </Outline>
);

export const SvWalletSolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.2 5.4h11.6a3 3 0 0 1 3 3v.7h-4.5a2 2 0 0 0-2 2v.1a1 1 0 0 1-1 1h-2.6a1 1 0 0 1-1-1v-.1a2 2 0 0 0-2-2H3.2v-.7a3 3 0 0 1 3-3Zm-3 5.3h4.5a.6.6 0 0 1 .6.6v.1a2.4 2.4 0 0 0 2.4 2.4h2.6a2.4 2.4 0 0 0 2.4-2.4v-.1a.6.6 0 0 1 .6-.6h4.5v4.9a3 3 0 0 1-3 3H6.2a3 3 0 0 1-3-3Z"
    />
  </Solid>
);

/* ───────────────── Create a formation (lesson) ────────────── */

export const SvLesson = (p: IconProps) => (
  <Outline {...p}>
    <path d="M4.2 4.1h15.6a1.4 1.4 0 0 1 1.4 1.4v9.1a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4V5.5a1.4 1.4 0 0 1 1.4-1.4Z" />
    <path d="M8.4 16l-1.7 4.9M15.6 16l1.7 4.9" />
    <path d="M7.2 8h9.6M7.2 11.4h5.4" />
  </Outline>
);

export const SvLessonSolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.2 4.1h15.6a1.4 1.4 0 0 1 1.4 1.4v9.1a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4V5.5a1.4 1.4 0 0 1 1.4-1.4ZM7.2 7.2a.85.85 0 0 0 0 1.7h9.6a.85.85 0 0 0 0-1.7Zm0 3.4a.85.85 0 0 0 0 1.7h5.4a.85.85 0 0 0 0-1.7Z"
    />
    <path d="M7.6 16.4l1.6.55-1.6 4.6a.85.85 0 0 1-1.6-.55Zm8.8 0l-1.6.55 1.6 4.6a.85.85 0 0 0 1.6-.55Z" />
  </Solid>
);

/* ───────────────── Super Admin (shield + bust) ────────────── */

const SHIELD =
  'M12 2.6l7.4 2.6v6.1c0 4.5-3 8.4-7.4 10.3-4.4-1.9-7.4-5.8-7.4-10.3V5.2Z';

export const SvAdmin = (p: IconProps) => (
  <Outline {...p}>
    <path d={SHIELD} />
    <circle cx="12" cy="10.2" r="2.1" />
    <path d="M8.6 16.6a3.7 3.7 0 0 1 6.8 0" />
  </Outline>
);

export const SvAdminSolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d={`${SHIELD} M12 7.6a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Zm0 6.3a4.6 4.6 0 0 0-4.1 2.5 8.9 8.9 0 0 0 8.2 0A4.6 4.6 0 0 0 12 13.9Z`}
    />
  </Solid>
);

/* ───────────────────────── Sell (tag) ─────────────────────── */

const TAG =
  'M4.05 11.35L11.4 4h6.85a1.75 1.75 0 0 1 1.75 1.75v6.85l-7.35 7.35a1.75 1.75 0 0 1-2.47 0l-6.13-6.13a1.75 1.75 0 0 1 0-2.47Z';

export const SvSell = (p: IconProps) => (
  <Outline {...p}>
    <path d={TAG} />
    <circle cx="15.9" cy="8.1" r="1.4" />
  </Outline>
);

export const SvSellSolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d={`${TAG} M15.9 6.35a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z`}
    />
  </Solid>
);

/* ──────────────── Explore (squircle compass) ──────────────── */

const SQUIRCLE =
  'M12 2.9c6.6 0 9.1 2.5 9.1 9.1s-2.5 9.1-9.1 9.1S2.9 18.6 2.9 12 5.4 2.9 12 2.9Z';
const NEEDLE = 'M15.9 8.1l-1.85 5.95-5.95 1.85 1.85-5.95Z';

export const SvExplore = (p: IconProps) => (
  <Outline {...p}>
    <path d={SQUIRCLE} />
    <path d={NEEDLE} />
  </Outline>
);

export const SvExploreSolid = (p: IconProps) => (
  <Solid {...p}>
    <path fillRule="evenodd" clipRule="evenodd" d={`${SQUIRCLE} ${NEEDLE}`} />
  </Solid>
);

/** Cast helper — these glyphs are drop-in replacements for lucide icons. */
export const asLucide = (C: (p: IconProps) => ReactElement) => C as unknown as LucideIcon;

/* ───────────── App-wide icon unification ─────────────
 * Any nav item still declared with a lucide glyph gets swapped for the
 * matching SiteViral glyph, so every menu (bottom nav, sidebar, drawer,
 * action hub) shares one visual family.
 */
import {
  BookOpen, Book, Store, ShoppingBag, ShoppingCart, Package, Compass, Search,
  LayoutDashboard, Wallet, GraduationCap, Shield, ShieldCheck, HandCoins,
  Coins, Banknote, PenLine, Pencil, Tag, Library,
} from 'lucide-react';

const SV_ICON_MAP = new Map<unknown, LucideIcon>([
  [LayoutDashboard, asLucide(SvHome)],
  [Compass, asLucide(SvExplore)],
  [Search, asLucide(SvExplore)],
  [BookOpen, asLucide(SvLibrary)],
  [Book, asLucide(SvLibrary)],
  [Library, asLucide(SvLibrary)],
  [ShoppingBag, asLucide(SvLibrary)],
  [Package, asLucide(SvLibrary)],
  [Store, asLucide(SvSell)],
  [ShoppingCart, asLucide(SvSell)],
  [Tag, asLucide(SvSell)],
  [Wallet, asLucide(SvWallet)],
  [Banknote, asLucide(SvWallet)],
  [HandCoins, asLucide(SvEarn)],
  [Coins, asLucide(SvEarn)],
  [GraduationCap, asLucide(SvLesson)],
  [PenLine, asLucide(SvPencil)],
  [Pencil, asLucide(SvPencil)],
  [Shield, asLucide(SvAdmin)],
  [ShieldCheck, asLucide(SvAdmin)],
]);

/** Returns the SiteViral glyph for a lucide icon when one exists. */
export function unifyNavIcon(icon: LucideIcon): LucideIcon {
  return SV_ICON_MAP.get(icon) ?? icon;
}
