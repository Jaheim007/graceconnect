import {
  ShoppingBag, Wrench, Scissors, Dumbbell, GraduationCap, Music, Megaphone, Briefcase,
  type LucideIcon,
} from 'lucide-react';

/**
 * Eight active marketplace categories used on the landing page and navbar.
 * `route` points to the real existing discovery destination for each vertical.
 * `slug` is the friendly `/explore/:slug` alias (registered in App.tsx).
 *
 * Church and Events are intentionally excluded from this list:
 * - Church has its own dedicated product page at /churches.
 * - Events is on launch standby.
 */
export interface ExploreCategory {
  slug: string;
  fr: string;
  en: string;
  descFr: string;
  descEn: string;
  route: string;
  icon: LucideIcon;
  tint: string; // Tailwind bg tint for icon chip
  supply: 'strong' | 'growing';
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    slug: 'digital-products',
    fr: 'Produits digitaux',
    en: 'Digital products',
    descFr: 'Ebooks, guides, templates, cours et ressources téléchargeables.',
    descEn: 'Ebooks, guides, templates, courses and downloadable resources.',
    route: '/discover?type=digital',
    icon: ShoppingBag,
    tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    supply: 'strong',
  },
  {
    slug: 'artisans',
    fr: 'Artisans & services à domicile',
    en: 'Artisans & home services',
    descFr: 'Plombiers, électriciens, ménage et professionnels de la réparation.',
    descEn: 'Plumbers, electricians, cleaners and repair professionals.',
    route: '/home/discover',
    icon: Wrench,
    tint: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    supply: 'growing',
  },
  {
    slug: 'beauty',
    fr: 'Beauté & soins',
    en: 'Beauty & personal care',
    descFr: 'Coiffure, barbier, maquillage, ongles et bien-être.',
    descEn: 'Hair, barbering, makeup, nails and wellness.',
    route: '/beauty/search',
    icon: Scissors,
    tint: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    supply: 'growing',
  },
  {
    slug: 'coaching',
    fr: 'Sport & coaching',
    en: 'Sport & coaching',
    descFr: 'Coachs sportifs, fitness, préparation physique et bien-être.',
    descEn: 'Personal trainers, fitness, conditioning and wellbeing.',
    route: '/discover?type=sport',
    icon: Dumbbell,
    tint: 'bg-lime-500/10 text-lime-600 dark:text-lime-400',
    supply: 'growing',
  },
  {
    slug: 'tutors',
    fr: 'Cours & tuteurs',
    en: 'Tutors & teachers',
    descFr: 'Matières scolaires, langues et compétences professionnelles.',
    descEn: 'Academic subjects, languages and professional skills.',
    route: '/learn/discover',
    icon: GraduationCap,
    tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    supply: 'growing',
  },
  {
    slug: 'music',
    fr: 'Musique & instrumentistes',
    en: 'Musicians & instrumentalists',
    descFr: 'Cours, prestations live et enregistrements.',
    descEn: 'Lessons, live performances and recordings.',
    route: '/discover?type=music',
    icon: Music,
    tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    supply: 'growing',
  },
  {
    slug: 'influencers',
    fr: 'Influenceurs & créateurs',
    en: 'Influencers & content creators',
    descFr: 'Collaborations, contenus sponsorisés et créations.',
    descEn: 'Collaborations, sponsored content and creative work.',
    route: '/discover?type=influencer',
    icon: Megaphone,
    tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    supply: 'growing',
  },
  {
    slug: 'other-services',
    fr: 'Autres services',
    en: 'Other services',
    descFr: 'Tout le reste : consulting, admin, créatif et plus.',
    descEn: 'Everything else: consulting, admin, creative and more.',
    route: '/discover',
    icon: Briefcase,
    tint: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    supply: 'growing',
  },
];

export const findCategoryBySlug = (slug: string | undefined) =>
  EXPLORE_CATEGORIES.find(c => c.slug === slug) || null;
