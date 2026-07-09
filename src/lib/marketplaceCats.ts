import { Scissors, GraduationCap, Wrench, Church, ShoppingBag, CalendarDays, Music, Megaphone, Briefcase, type LucideIcon } from 'lucide-react';

export type MarketCat = {
  key: string;
  icon: LucideIcon;
  fr: string; en: string;
  findRoute: string;
  proposeRoute: string;
  gradient: string;
};

export const MARKET_CATS: MarketCat[] = [
  { key: 'beauty',      icon: Scissors,      fr: 'Beauté',            en: 'Beauty',           findRoute: '/beauty/search',            proposeRoute: '/start?activity=beauty',     gradient: 'from-pink-500 via-rose-500 to-orange-400' },
  { key: 'plumbing',    icon: Wrench,        fr: 'Plomberie',         en: 'Plumbing',         findRoute: '/home/discover?q=plomberie', proposeRoute: '/start?activity=home',       gradient: 'from-amber-500 via-orange-500 to-red-500' },
  { key: 'tutors',      icon: GraduationCap, fr: 'Cours & tuteurs',   en: 'Tutors',           findRoute: '/learn/discover',           proposeRoute: '/start?activity=learn',      gradient: 'from-sky-500 via-blue-500 to-indigo-500' },
  { key: 'events',      icon: CalendarDays,  fr: 'Événements',        en: 'Events',           findRoute: '/events/discover',          proposeRoute: '/start?activity=events',     gradient: 'from-fuchsia-500 via-purple-500 to-indigo-600' },
  { key: 'digital',     icon: ShoppingBag,   fr: 'Produits digitaux', en: 'Digital products', findRoute: '/discover?type=digital',    proposeRoute: '/start?activity=digital',    gradient: 'from-emerald-500 via-teal-500 to-cyan-500' },
  { key: 'music',       icon: Music,         fr: 'Musique & audio',   en: 'Music & audio',    findRoute: '/discover?type=music',      proposeRoute: '/start?activity=music',      gradient: 'from-indigo-500 via-blue-600 to-slate-700' },
  { key: 'church',      icon: Church,        fr: 'Églises',           en: 'Churches',         findRoute: '/church/discover',          proposeRoute: '/start?activity=church',     gradient: 'from-violet-500 via-purple-500 to-slate-600' },
  { key: 'influencers', icon: Megaphone,     fr: 'Influenceurs',      en: 'Influencers',      findRoute: '/discover?type=influencer', proposeRoute: '/start?activity=influencer', gradient: 'from-yellow-500 via-orange-500 to-pink-500' },
  { key: 'all',         icon: Briefcase,     fr: 'Tous les services', en: 'All services',     findRoute: '/discover',                 proposeRoute: '/start',                     gradient: 'from-slate-700 via-slate-800 to-slate-900' },
];
