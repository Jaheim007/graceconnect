/**
 * Visual themes that auto-rotate per slide for variety.
 * Each theme defines colors, decorative elements, and layout hints.
 */

export interface SlideTheme {
  id: string;
  gradient: string;
  accentColor: string;
  decorationType: 'swirl' | 'circles' | 'dots' | 'waves' | 'grid' | 'diagonal' | 'blob' | 'none';
  headerAccent: string; // thin accent line color
  captionGlow: string;
}

export const SLIDE_THEMES: SlideTheme[] = [
  {
    id: 'deep-ocean',
    gradient: 'from-[hsl(220,70%,10%)] via-[hsl(230,65%,18%)] to-[hsl(250,55%,25%)]',
    accentColor: 'hsl(210, 100%, 60%)',
    decorationType: 'swirl',
    headerAccent: 'bg-blue-400/40',
    captionGlow: 'shadow-blue-500/10',
  },
  {
    id: 'royal-purple',
    gradient: 'from-[hsl(270,60%,12%)] via-[hsl(280,50%,20%)] to-[hsl(300,40%,28%)]',
    accentColor: 'hsl(270, 80%, 65%)',
    decorationType: 'circles',
    headerAccent: 'bg-purple-400/40',
    captionGlow: 'shadow-purple-500/10',
  },
  {
    id: 'emerald-night',
    gradient: 'from-[hsl(160,50%,8%)] via-[hsl(170,45%,14%)] to-[hsl(190,40%,22%)]',
    accentColor: 'hsl(160, 70%, 50%)',
    decorationType: 'waves',
    headerAccent: 'bg-emerald-400/40',
    captionGlow: 'shadow-emerald-500/10',
  },
  {
    id: 'sunset-amber',
    gradient: 'from-[hsl(20,60%,10%)] via-[hsl(30,55%,16%)] to-[hsl(45,50%,22%)]',
    accentColor: 'hsl(35, 90%, 55%)',
    decorationType: 'diagonal',
    headerAccent: 'bg-amber-400/40',
    captionGlow: 'shadow-amber-500/10',
  },
  {
    id: 'crimson-dark',
    gradient: 'from-[hsl(340,50%,10%)] via-[hsl(350,45%,16%)] to-[hsl(0,40%,22%)]',
    accentColor: 'hsl(340, 80%, 55%)',
    decorationType: 'dots',
    headerAccent: 'bg-rose-400/40',
    captionGlow: 'shadow-rose-500/10',
  },
  {
    id: 'midnight-slate',
    gradient: 'from-[hsl(215,40%,8%)] via-[hsl(220,35%,14%)] to-[hsl(225,30%,20%)]',
    accentColor: 'hsl(215, 60%, 60%)',
    decorationType: 'grid',
    headerAccent: 'bg-slate-400/40',
    captionGlow: 'shadow-slate-500/10',
  },
  {
    id: 'teal-aurora',
    gradient: 'from-[hsl(180,50%,8%)] via-[hsl(200,55%,16%)] to-[hsl(220,50%,24%)]',
    accentColor: 'hsl(180, 70%, 50%)',
    decorationType: 'blob',
    headerAccent: 'bg-teal-400/40',
    captionGlow: 'shadow-teal-500/10',
  },
  {
    id: 'warm-cocoa',
    gradient: 'from-[hsl(25,35%,10%)] via-[hsl(15,30%,16%)] to-[hsl(10,25%,22%)]',
    accentColor: 'hsl(25, 60%, 55%)',
    decorationType: 'waves',
    headerAccent: 'bg-orange-400/40',
    captionGlow: 'shadow-orange-500/10',
  },
];

export function getSlideTheme(index: number): SlideTheme {
  return SLIDE_THEMES[index % SLIDE_THEMES.length];
}
