import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, UserPlus, Download, Heart, Star, Flame, Users, TrendingUp, Award, Zap, BookOpen, Gift, GraduationCap, X } from 'lucide-react';
import { useLocation, Link } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';
import { GLOBAL_NAMES, GLOBAL_CITIES, PRODUCT_TITLES, ORG_NAMES } from '@/lib/global-names';
import { createSeededRandom, hashString, seededPick, seededInt } from '@/lib/seeded-random';

interface Notification {
  id: string;
  icon: React.ReactNode;
  text: string;
  subtext: string;
  link?: string;
}

let notifCounter = 0;

function generateNotification(isFr: boolean): Notification {
  // Use a counter + timestamp seed for variety across the session
  notifCounter++;
  const seed = hashString(`${Date.now()}-${notifCounter}-${Math.random()}`);
  const rng = createSeededRandom(seed);

  const name = seededPick(GLOBAL_NAMES, rng);
  const prod = seededPick(PRODUCT_TITLES, rng);
  const org = seededPick(ORG_NAMES, rng);
  const loc = seededPick(GLOBAL_CITIES, rng);
  const cityLabel = `${loc.flag} ${loc.city}`;

  const timesFr = ['à l\'instant','il y a 1min','il y a 2min','il y a 3min','il y a 5min','il y a 8min'];
  const timesEn = ['just now','1m ago','2m ago','3m ago','5m ago','8m ago'];
  const time = seededPick(isFr ? timesFr : timesEn, rng);
  const id = `fp-${Date.now()}-${notifCounter}`;
  const viewers = seededInt(5, 42, rng);
  const newMembers = seededInt(12, 58, rng);
  const pctGrowth = seededInt(30, 250, rng);

  const templates: (() => Notification)[] = isFr ? [
    () => ({ id, icon: <ShoppingBag className="h-4 w-4 text-emerald-500" />, text: `${name} a acheté « ${prod} »`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Download className="h-4 w-4 text-blue-500" />, text: `${name} a téléchargé « ${prod} »`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <UserPlus className="h-4 w-4 text-violet-500" />, text: `${name} a rejoint ${org}`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Heart className="h-4 w-4 text-rose-500" />, text: `Don anonyme pour ${org}`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Star className="h-4 w-4 text-amber-500" />, text: `${name} a noté 5« ${prod} »`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Flame className="h-4 w-4 text-orange-500" />, text: `${org} a publié une nouvelle ressource`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Users className="h-4 w-4 text-indigo-500" />, text: `${viewers} personnes consultent la plateforme`, subtext: 'en ce moment' }),
    () => ({ id, icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, text: `« ${prod} » est en tendance 🔥`, subtext: `+${pctGrowth}% cette semaine`, link: '/explorer' }),
    () => ({ id, icon: <Award className="h-4 w-4 text-amber-500" />, text: `${name} est devenu ambassadeur`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: null , text: `${name} recommande « ${prod} »`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Gift className="h-4 w-4 text-pink-500" />, text: `${org} offre une ressource gratuite 🎁`, subtext: time, link: '/explorer' }),
    () => ({ id, icon: <Zap className="h-4 w-4 text-yellow-500" />, text: `${name} a généré sa 1ère commission 💰`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <BookOpen className="h-4 w-4 text-sky-500" />, text: `${name} a commencé « ${prod} »`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <GraduationCap className="h-4 w-4 text-green-600" />, text: `${name} a terminé « ${prod} » ✅`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <BookOpen className="h-4 w-4 text-primary" />, text: `${name} crée un livre avec l'IA ✍️`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Users className="h-4 w-4 text-indigo-500" />, text: `${newMembers} nouveaux membres aujourd'hui`, subtext: '🌍 dans le monde' }),
  ] : [
    () => ({ id, icon: <ShoppingBag className="h-4 w-4 text-emerald-500" />, text: `${name} purchased "${prod}"`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Download className="h-4 w-4 text-blue-500" />, text: `${name} downloaded "${prod}"`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <UserPlus className="h-4 w-4 text-violet-500" />, text: `${name} joined ${org}`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Heart className="h-4 w-4 text-rose-500" />, text: `Anonymous donation to ${org}`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Star className="h-4 w-4 text-amber-500" />, text: `${name} rated 5"${prod}"`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Flame className="h-4 w-4 text-orange-500" />, text: `${org} published a new resource`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Users className="h-4 w-4 text-indigo-500" />, text: `${viewers} people browsing the platform`, subtext: 'right now' }),
    () => ({ id, icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, text: `"${prod}" is trending 🔥`, subtext: `+${pctGrowth}% this week`, link: '/explorer' }),
    () => ({ id, icon: <Award className="h-4 w-4 text-amber-500" />, text: `${name} became an ambassador`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: null , text: `${name} recommends "${prod}"`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Gift className="h-4 w-4 text-pink-500" />, text: `${org} offers a free resource 🎁`, subtext: time, link: '/explorer' }),
    () => ({ id, icon: <Zap className="h-4 w-4 text-yellow-500" />, text: `${name} earned their 1st commission 💰`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <BookOpen className="h-4 w-4 text-sky-500" />, text: `${name} started "${prod}"`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <GraduationCap className="h-4 w-4 text-green-600" />, text: `${name} completed "${prod}" ✅`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <BookOpen className="h-4 w-4 text-primary" />, text: `${name} is creating a book with AI ✍️`, subtext: `${cityLabel} · ${time}` }),
    () => ({ id, icon: <Users className="h-4 w-4 text-indigo-500" />, text: `${newMembers} new members today`, subtext: '🌍 worldwide' }),
  ];

  return seededPick(templates, rng)();
}

export function FloatingProofToast() {
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('floating-proof-dismissed') === 'true'; } catch { return false; }
  });

  const isSuperadmin = location.pathname.startsWith('/superadmin');
  const isLandingPage = location.pathname === '/';
  // Hide inside any workspace / dashboard / messaging / checkout flow — too distracting.
  const path = location.pathname;
  const isWorkspace =
    /\/pro(\/|$)/.test(path) ||
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/beauty/messages') ||
    path.startsWith('/beauty/bookings') ||
    path.startsWith('/beauty/pro') ||
    path.startsWith('/church/pro') ||
    path.startsWith('/checkout') ||
    path.startsWith('/auth') ||
    path.includes('/onboarding') ||
    path.includes('/settings');
  const suppressed = isSuperadmin || isLandingPage || isWorkspace || dismissed;
  const MAX_PER_SESSION = 3;

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setDismissed(true);
    try { localStorage.setItem('floating-proof-dismissed', 'true'); } catch {}
  }, []);

  const showNext = useCallback(() => {
    if (suppressed || sessionCount >= MAX_PER_SESSION) return;
    const notif = generateNotification(isFr);
    setNotification(notif);
    setVisible(true);
    setSessionCount(c => c + 1);
    setTimeout(() => setVisible(false), 4000);
  }, [suppressed, isFr, sessionCount]);

  useEffect(() => {
    if (suppressed) return;
    // Calmer cadence — initial 20-30s, then every 90-150s.
    const initialDelay = setTimeout(() => showNext(), 20000 + Math.random() * 10000);
    const interval = setInterval(() => showNext(), 90000 + Math.random() * 60000);
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [showNext, suppressed]);

  if (suppressed) return null;

  return (
    <div className="hidden lg:block fixed bottom-4 left-4 z-30 max-w-sm pointer-events-none">
      <AnimatePresence>
        {visible && notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto bg-card/95 border border-border/60 rounded-xl shadow-2xl shadow-black/15 p-3.5 flex items-start gap-3 backdrop-blur-xl"
          >
            <div className="h-9 w-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 relative">
              {notification.icon}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500">Live</span>
              </div>
              {notification.link ? (
                <Link to={notification.link} className="text-sm font-medium leading-snug truncate block hover:underline">{notification.text}</Link>
              ) : (
                <p className="text-sm font-medium leading-snug truncate">{notification.text}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">{notification.subtext}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
              className="shrink-0 p-1 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
              aria-label={isFr ? 'Ne plus afficher' : 'Dismiss'}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
