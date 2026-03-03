import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, UserPlus, Download, Heart, Star, Globe, Flame, Users, TrendingUp, Award, Sparkles, BookOpen, Gift, Zap, Music, Camera, Laptop, GraduationCap } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';

const NAMES_FR = [
  'Marie K.','Aimé T.','Grâce M.','Samuel O.','Joséphine N.','Patrick D.','Esther B.','David L.',
  'Ruth A.','Emmanuel S.','Carine W.','Yannick P.','Béatrice F.','Olivier H.','Sarah J.','Jean-Paul R.',
  'Abigaïl C.','Thierry M.','Naomi K.','François T.','Prisca D.','Charles E.','Lydia N.','Marc A.',
  'Rachel B.','Christophe G.','Deborah L.','André V.','Miriam S.','Benjamin O.','Gloria F.','Josué P.',
  'Irène D.','Paul K.','Julienne M.','Moïse T.','Rebecca N.','Salomon B.','Élisabeth A.','Jacques L.',
  'Micheline S.','Pierre G.','Claudine H.','Daniel W.','Véronique R.','Étienne C.','Bernadette J.','Simon F.',
  'Monique D.','Raphaël E.','Jeannette K.','Luc M.','Félicité N.','Gédéon T.','Anne-Marie B.','Caleb S.',
  'Viviane O.','Nathanaël P.','Rosalie A.','Aristide L.','Angèle V.','Prospère M.','Hortense B.','Sylvain K.',
  'Clarisse N.','Dieudonné T.','Marguerite S.','Pacifique R.','Espérance D.','Faustin G.','Honorine L.','Médard P.',
  'Scholastique A.','Théophile M.','Consolate B.','Innocent K.','Séraphine N.','Fidèle T.','Immaculée S.','Célestin R.',
];

const NAMES_EN = [
  'John D.','Sarah M.','James K.','Emily T.','Michael B.','Grace A.','David L.','Faith N.',
  'Daniel S.','Hope R.','Joshua W.','Joy P.','Peter G.','Blessing O.','Mark C.','Mercy F.',
  'Andrew H.','Patience D.','Stephen E.','Charity K.','Paul M.','Peace T.','Thomas B.','Glory S.',
  'Philip R.','Favour L.','Samuel P.','Victoria G.','Joseph D.','Deborah C.','Matthew K.','Esther M.',
];

const PRODUCTS_FR = [
  'Guide de prière quotidienne','E-book leadership','Formation gestion financière','Pack méditations',
  'Cours de musique worship','Guide entrepreneuriat','Templates réseaux sociaux','E-book développement personnel',
  'Formation marketing digital','Guide de croissance spirituelle','Pack design graphique','Cours de langues',
  'Guide nutrition et santé','Templates business plan','Formation prise de parole','E-book cuisine africaine',
  'Guide photographie mobile','Pack beats instrumentaux','Formation Excel avancé','Guide rédaction web',
  'Programme de mentoring','Kit de démarrage entrepreneur','E-book finances personnelles','Guide SEO pratique',
  'Formation community management','Pack vidéo créatif','Guide relation d\'aide','E-book méditation biblique',
  'Masterclass leadership','Pack prédications audio','Guide création de contenu','Formation intelligence artificielle',
];

const PRODUCTS_EN = [
  'Daily Prayer Guide','Leadership E-book','Financial Management Course','Meditation Pack',
  'Worship Music Course','Entrepreneurship Guide','Social Media Templates','Personal Development E-book',
  'Digital Marketing Course','Spiritual Growth Guide','Graphic Design Pack','Language Course',
  'Health & Nutrition Guide','Business Plan Templates','Public Speaking Course','African Cooking E-book',
  'Leadership Masterclass','Audio Sermon Pack','Content Creation Guide','AI Training Course',
];

const ORGS_FR = [
  'Église La Grâce','Ministère Lumière','Association Espoir','Centre Bethel','Fondation Victoire',
  'Communauté Shalom','Mission Agapé','Institut Excellence','Académie du Savoir','Centre Alpha',
  'Église du Réveil','Ministère des Nations','Association Impact','Fondation Vision','Communauté Élohim',
  'Centre de Formation Omega','Mouvement Jérusalem','Ministère Horeb','Fondation Colombe','Académie Grâce',
];

const ORGS_EN = [
  'Grace Church','Light Ministry','Hope Association','Bethel Centre','Victory Foundation',
  'Shalom Community','Agape Mission','Excellence Institute','Knowledge Academy','Alpha Centre',
];

const COUNTRIES = ['🇨🇲','🇳🇬','🇸🇳','🇨🇮','🇧🇯','🇬🇭','🇹🇬','🇨🇩','🇬🇦','🇧🇫','🇲🇱','🇬🇳','🇫🇷','🇧🇪','🇨🇦','🇨🇭','🇬🇧','🇺🇸','🇩🇪','🇷🇼'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

interface Notification {
  id: string;
  icon: React.ReactNode;
  text: string;
  subtext: string;
  link?: string;
}

function generateNotification(isFr: boolean): Notification {
  const names = isFr ? NAMES_FR : NAMES_EN;
  const products = isFr ? PRODUCTS_FR : PRODUCTS_EN;
  const orgs = isFr ? ORGS_FR : ORGS_EN;
  const name = pick(names);
  const prod = pick(products);
  const org = pick(orgs);
  const flag = pick(COUNTRIES);
  const timesFr = ['à l\'instant','il y a 1min','il y a 2min','il y a 3min','il y a 5min','il y a 8min','il y a 12min'];
  const timesEn = ['just now','1m ago','2m ago','3m ago','5m ago','8m ago','12m ago'];
  const time = pick(isFr ? timesFr : timesEn);
  const id = `fp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const templates: (() => Notification)[] = isFr ? [
    () => ({ id, icon: <ShoppingBag className="h-4 w-4 text-emerald-500" />, text: `${name} a acheté « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Download className="h-4 w-4 text-blue-500" />, text: `${name} a téléchargé « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <UserPlus className="h-4 w-4 text-violet-500" />, text: `${name} a rejoint ${org}`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Heart className="h-4 w-4 text-rose-500" />, text: `Don anonyme pour ${org}`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Star className="h-4 w-4 text-amber-500" />, text: `${name} a noté 5⭐ « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Flame className="h-4 w-4 text-orange-500" />, text: `${org} a publié une nouvelle ressource`, subtext: time }),
    () => ({ id, icon: <Globe className="h-4 w-4 text-teal-500" />, text: `${randInt(5, 42)} personnes consultent la plateforme`, subtext: 'en ce moment' }),
    () => ({ id, icon: <Users className="h-4 w-4 text-indigo-500" />, text: `${randInt(12, 58)} nouveaux membres aujourd'hui`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, text: `« ${prod} » est en tendance 🔥`, subtext: `+${randInt(30, 250)}% cette semaine`, link: '/explorer' }),
    () => ({ id, icon: <Award className="h-4 w-4 text-amber-500" />, text: `${name} est devenu ambassadeur`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Sparkles className="h-4 w-4 text-purple-500" />, text: `${name} recommande « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Gift className="h-4 w-4 text-pink-500" />, text: `${org} offre une ressource gratuite 🎁`, subtext: time, link: '/explorer' }),
    () => ({ id, icon: <Zap className="h-4 w-4 text-yellow-500" />, text: `${name} a atteint le niveau Gold ⚡`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <BookOpen className="h-4 w-4 text-sky-500" />, text: `${name} a commencé « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <GraduationCap className="h-4 w-4 text-green-600" />, text: `${name} a terminé « ${prod} » ✅`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Music className="h-4 w-4 text-fuchsia-500" />, text: `${name} écoute « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Camera className="h-4 w-4 text-cyan-500" />, text: `${name} a partagé sa création`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Laptop className="h-4 w-4 text-slate-500" />, text: `${name} s'est inscrit pour « ${prod} »`, subtext: `${flag} · ${time}` }),
  ] : [
    () => ({ id, icon: <ShoppingBag className="h-4 w-4 text-emerald-500" />, text: `${name} purchased "${prod}"`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Download className="h-4 w-4 text-blue-500" />, text: `${name} downloaded "${prod}"`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <UserPlus className="h-4 w-4 text-violet-500" />, text: `${name} joined ${org}`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Heart className="h-4 w-4 text-rose-500" />, text: `Anonymous donation to ${org}`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Star className="h-4 w-4 text-amber-500" />, text: `${name} rated 5⭐ "${prod}"`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Flame className="h-4 w-4 text-orange-500" />, text: `${org} published a new resource`, subtext: time }),
    () => ({ id, icon: <Globe className="h-4 w-4 text-teal-500" />, text: `${randInt(5, 42)} people browsing the platform`, subtext: 'right now' }),
    () => ({ id, icon: <Users className="h-4 w-4 text-indigo-500" />, text: `${randInt(12, 58)} new members today`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, text: `"${prod}" is trending 🔥`, subtext: `+${randInt(30, 250)}% this week`, link: '/explorer' }),
    () => ({ id, icon: <Award className="h-4 w-4 text-amber-500" />, text: `${name} became an ambassador`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Sparkles className="h-4 w-4 text-purple-500" />, text: `${name} recommends "${prod}"`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Gift className="h-4 w-4 text-pink-500" />, text: `${org} offers a free resource 🎁`, subtext: time, link: '/explorer' }),
    () => ({ id, icon: <Zap className="h-4 w-4 text-yellow-500" />, text: `${name} reached Gold level ⚡`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <BookOpen className="h-4 w-4 text-sky-500" />, text: `${name} started "${prod}"`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <GraduationCap className="h-4 w-4 text-green-600" />, text: `${name} completed "${prod}" ✅`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Music className="h-4 w-4 text-fuchsia-500" />, text: `${name} is listening to "${prod}"`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Camera className="h-4 w-4 text-cyan-500" />, text: `${name} shared their creation`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Laptop className="h-4 w-4 text-slate-500" />, text: `${name} signed up for "${prod}"`, subtext: `${flag} · ${time}` }),
  ];

  return pick(templates)();
}

export function FloatingProofToast() {
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);

  const isSuperadmin = location.pathname.startsWith('/superadmin');

  const showNext = useCallback(() => {
    if (isSuperadmin) return;
    const notif = generateNotification(isFr);
    setNotification(notif);
    setVisible(true);
    setTimeout(() => setVisible(false), 4500);
  }, [isSuperadmin, isFr]);

  useEffect(() => {
    if (isSuperadmin) return;
    const initialDelay = setTimeout(() => showNext(), randInt(5000, 10000));
    const interval = setInterval(() => showNext(), randInt(7000, 13000));
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [showNext, isSuperadmin]);

  if (isSuperadmin) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 z-50 max-w-xs sm:max-w-sm pointer-events-none">
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
            {/* Live indicator */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
