import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, UserPlus, Flame, Eye, Download, Heart, Star, Globe } from 'lucide-react';

interface Activity {
  id: string;
  icon: React.ReactNode;
  text: string;
  time: string;
}

function timeAgo(dateStr: string, isFr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isFr ? 'à l\'instant' : 'just now';
  if (mins < 60) return isFr ? `il y a ${mins}min` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return isFr ? `il y a ${hrs}h` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return isFr ? `il y a ${days}j` : `${days}d ago`;
}

function randomTimeAgo(isFr: boolean): string {
  const options = isFr
    ? ['à l\'instant', 'il y a 1min', 'il y a 2min', 'il y a 3min', 'il y a 5min', 'il y a 8min', 'il y a 12min', 'il y a 15min', 'il y a 22min', 'il y a 30min', 'il y a 45min', 'il y a 1h', 'il y a 2h']
    : ['just now', '1m ago', '2m ago', '3m ago', '5m ago', '8m ago', '12m ago', '15m ago', '22m ago', '30m ago', '45m ago', '1h ago', '2h ago'];
  return options[Math.floor(Math.random() * options.length)];
}

const SYNTHETIC_NAMES_FR = [
  'Marie K.', 'Aimé T.', 'Grâce M.', 'Samuel O.', 'Joséphine N.', 'Patrick D.', 'Esther B.', 'David L.',
  'Ruth A.', 'Emmanuel S.', 'Carine W.', 'Yannick P.', 'Béatrice F.', 'Olivier H.', 'Sarah J.', 'Jean-Paul R.',
  'Abigaïl C.', 'Thierry M.', 'Naomi K.', 'François T.', 'Prisca D.', 'Charles E.', 'Lydia N.', 'Marc A.',
  'Rachel B.', 'Christophe G.', 'Deborah L.', 'André V.', 'Miriam S.', 'Benjamin O.',
];

const SYNTHETIC_PRODUCTS = [
  'Guide de prière quotidienne', 'E-book leadership', 'Formation gestion financière', 'Pack méditations',
  'Cours de musique worship', 'Guide entrepreneuriat', 'Templates réseaux sociaux', 'E-book développement personnel',
  'Formation marketing digital', 'Guide de croissance spirituelle', 'Pack design graphique', 'Cours de langues',
  'Guide nutrition et santé', 'Templates business plan', 'Formation prise de parole', 'E-book cuisine africaine',
  'Guide photographie mobile', 'Pack beats instrumentaux', 'Formation Excel avancé', 'Guide rédaction web',
];

const SYNTHETIC_ORGS = [
  'Église La Grâce', 'Ministère Lumière', 'Association Espoir', 'Centre Bethel', 'Fondation Victoire',
  'Communauté Shalom', 'Mission Agapé', 'Institut Excellence', 'Académie du Savoir', 'Centre de Formation Alpha',
  'Église du Réveil', 'Ministère des Nations', 'Association Impact', 'Fondation Nouvelle Vision', 'Communauté Élohim',
];

function generateSyntheticActivities(isFr: boolean): Activity[] {
  const activities: Activity[] = [];
  const icons = [
    <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />,
    <Download className="h-3.5 w-3.5 text-blue-500" />,
    <Heart className="h-3.5 w-3.5 text-rose-500" />,
    <Star className="h-3.5 w-3.5 text-amber-500" />,
    <Eye className="h-3.5 w-3.5 text-violet-500" />,
    <Globe className="h-3.5 w-3.5 text-teal-500" />,
    <UserPlus className="h-3.5 w-3.5 text-blue-500" />,
    <Flame className="h-3.5 w-3.5 text-orange-500" />,
  ];

  const templates = isFr ? [
    (name: string, prod: string) => ({ icon: icons[0], text: `${name} a acheté « ${prod} »` }),
    (name: string, prod: string) => ({ icon: icons[1], text: `${name} a téléchargé « ${prod} »` }),
    (_: string, prod: string) => ({ icon: icons[2], text: `Quelqu'un a fait un don pour « ${prod} »` }),
    (name: string, prod: string) => ({ icon: icons[3], text: `${name} a noté 5⭐ « ${prod} »` }),
    (_: string, prod: string) => ({ icon: icons[4], text: `${prod} consulté par 12 personnes` }),
    (_: string, __: string, org: string) => ({ icon: icons[5], text: `${org} a publié une nouvelle ressource` }),
    (name: string, __: string, org: string) => ({ icon: icons[6], text: `${name} a rejoint ${org}` }),
    (_: string, prod: string, org: string) => ({ icon: icons[7], text: `${org} a ajouté « ${prod} »` }),
  ] : [
    (name: string, prod: string) => ({ icon: icons[0], text: `${name} purchased "${prod}"` }),
    (name: string, prod: string) => ({ icon: icons[1], text: `${name} downloaded "${prod}"` }),
    (_: string, prod: string) => ({ icon: icons[2], text: `Someone donated for "${prod}"` }),
    (name: string, prod: string) => ({ icon: icons[3], text: `${name} rated 5⭐ "${prod}"` }),
    (_: string, prod: string) => ({ icon: icons[4], text: `${prod} viewed by 12 people` }),
    (_: string, __: string, org: string) => ({ icon: icons[5], text: `${org} published a new resource` }),
    (name: string, __: string, org: string) => ({ icon: icons[6], text: `${name} joined ${org}` }),
    (_: string, prod: string, org: string) => ({ icon: icons[7], text: `${org} added "${prod}"` }),
  ];

  for (let i = 0; i < 100; i++) {
    const name = SYNTHETIC_NAMES_FR[Math.floor(Math.random() * SYNTHETIC_NAMES_FR.length)];
    const prod = SYNTHETIC_PRODUCTS[Math.floor(Math.random() * SYNTHETIC_PRODUCTS.length)];
    const org = SYNTHETIC_ORGS[Math.floor(Math.random() * SYNTHETIC_ORGS.length)];
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    const result = tpl(name, prod, org);
    activities.push({
      id: `synth-${i}-${Math.random().toString(36).slice(2, 6)}`,
      icon: result.icon,
      text: result.text,
      time: randomTimeAgo(isFr),
    });
  }

  return activities;
}

export function LiveActivityTicker() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: activities = [] } = useQuery({
    queryKey: ['live-activity-ticker', locale],
    queryFn: async () => {
      const results: Activity[] = [];

      // Real purchases
      const { data: purchases } = await db
        .from('product_purchases')
        .select('id, created_at, digital_products(title, organizations(name))')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (purchases) {
        for (const p of purchases) {
          const prod = (p as any).digital_products?.title;
          const org = (p as any).digital_products?.organizations?.name;
          if (prod && org) {
            results.push({
              id: `purchase-${p.id}`,
              icon: <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />,
              text: isFr ? `Quelqu'un a acheté « ${prod} »` : `Someone purchased "${prod}"`,
              time: timeAgo(p.created_at!, isFr),
            });
          }
        }
      }

      // Real new products
      const { data: newProducts } = await db
        .from('digital_products')
        .select('id, created_at, title, organizations(name)')
        .eq('is_published', true)
        .eq('is_express_demo', false)
        .order('created_at', { ascending: false })
        .limit(6);

      if (newProducts) {
        for (const p of newProducts) {
          const org = (p as any).organizations?.name;
          if (org) {
            results.push({
              id: `new-${p.id}`,
              icon: <Flame className="h-3.5 w-3.5 text-orange-500" />,
              text: isFr ? `${org} a ajouté « ${p.title} »` : `${org} added "${p.title}"`,
              time: timeAgo(p.created_at!, isFr),
            });
          }
        }
      }

      // Real new orgs
      const { data: newOrgs } = await db
        .from('organizations')
        .select('id, created_at, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (newOrgs) {
        for (const o of newOrgs) {
          results.push({
            id: `org-${o.id}`,
            icon: <UserPlus className="h-3.5 w-3.5 text-blue-500" />,
            text: isFr ? `${o.name} a rejoint la plateforme` : `${o.name} joined the platform`,
            time: timeAgo(o.created_at!, isFr),
          });
        }
      }

      // Add synthetic activities to bulk up the feed
      const synthetic = generateSyntheticActivities(isFr);

      // Merge real first, then synthetic, then shuffle everything
      const all = [...results, ...synthetic];
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }

      return all;
    },
    staleTime: 60 * 1000,
  });

  // Auto-rotate every 2.8s for more dynamism
  useEffect(() => {
    if (activities.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex];

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-5 py-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Live
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2.5 min-w-0 flex-1"
          >
            {current?.icon}
            <span className="text-sm font-medium truncate">{current?.text}</span>
            <span className="text-xs text-muted-foreground shrink-0">{current?.time}</span>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-1 shrink-0">
          {activities.slice(0, 6).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${i === currentIndex % 6 ? 'bg-primary' : 'bg-muted-foreground/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
