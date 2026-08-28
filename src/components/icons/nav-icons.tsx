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

/* ─────────────────────── Earn (hand + coin) ───────────────── */

const COIN_C = { cx: 12.2, cy: 6.6, r: 4.2 };

export const SvEarn = (p: IconProps) => (
  <Outline {...p}>
    <circle cx="12.4" cy="6.4" r="4.3" />
    <path d="M13.9 5.1a1.9 1.9 0 0 0-1.6-.9c-1 0-1.6.5-1.6 1.2s.7 1.1 1.6 1.1 1.7.4 1.7 1.2-.7 1.3-1.7 1.3a2 2 0 0 1-1.7-.9" />
    <path d="M2.6 15.2l1.7-1 3.6 6.3-1.7 1Z" />
    <path d="M7 17.9l-1.4-2.5 3.3-1.9a3.2 3.2 0 0 1 2.5-.35l3.1.9a1.6 1.6 0 0 1-.45 3.15" />
    <path d="M8.6 18.1l2.7-.8 4.3 1.2a2.9 2.9 0 0 0 2.2-.3c1.2-.7 2.8-1.8 4.6-3.3" />
  </Outline>
);

export const SvEarnSolid = (p: IconProps) => (
  <Solid {...p}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.2 2.4a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm.7 1.5v.4c.7.2 1.2.6 1.5 1.1a.75.75 0 0 1-1.3.75c-.2-.3-.5-.5-1-.5-.6 0-.9.3-.9.6s.4.5 1 .55c1 .1 2.1.6 2.1 1.85 0 .9-.6 1.6-1.4 1.85v.35a.75.75 0 0 1-1.5 0v-.36a2.7 2.7 0 0 1-1.6-1.1.75.75 0 0 1 1.26-.8c.2.3.6.5 1.1.5.7 0 1.05-.3 1.05-.6 0-.35-.4-.5-1-.56-1-.1-2.1-.6-2.1-1.82 0-.9.6-1.6 1.4-1.86V3.9a.75.75 0 0 1 1.5 0Z"
    />
    <path d="M4.1 13.9l3.7 6.5-1.8 1a.8.8 0 0 1-1.1-.3L2 16a.8.8 0 0 1 .3-1.1Z" />
    <path d="M5.3 14.6l3.4-2a3.4 3.4 0 0 1 2.7-.4l3.3 1c1 .3 1.3 1.3 1 2.15l-4.3-1.2a.75.75 0 0 0-.4 1.45l4.3 1.2a3 3 0 0 0 1.7-.15c1.3-.7 3-1.9 4.9-3.4a1.75 1.75 0 0 1 2.1 2.75c-2.1 1.7-4 3-5.4 3.75a4.5 4.5 0 0 1-3.4.45l-4.4-1.25-2.5.75Z" />
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
