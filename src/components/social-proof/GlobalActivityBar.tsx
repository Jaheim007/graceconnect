import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, UserPlus, Download, Heart, Star, Globe, Flame, Users, TrendingUp, Award, X, Zap, BookOpen, Gift, Music, Camera, Laptop, GraduationCap, Church, Building2, Megaphone } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

/* ─── Data pools ─── */
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
  'Donatien F.','Goretti L.','Vénuste D.','Clémence G.','Athanase P.','Spéciose M.','Damascène B.','Vestine K.',
  'Léonidas N.','Assumpta T.','Gamaliel S.','Euphrasie R.','Sylvestre D.','Pascaline G.','Nicodème L.','Triphine P.',
];

const NAMES_EN = [
  'John D.','Sarah M.','James K.','Emily T.','Michael B.','Grace A.','David L.','Faith N.',
  'Daniel S.','Hope R.','Joshua W.','Joy P.','Peter G.','Blessing O.','Mark C.','Mercy F.',
  'Andrew H.','Patience D.','Stephen E.','Charity K.','Paul M.','Peace T.','Thomas B.','Glory S.',
  'Philip R.','Favour L.','Samuel P.','Victoria G.','Joseph D.','Deborah C.','Matthew K.','Esther M.',
  'Timothy T.','Naomi B.','Benjamin S.','Ruth R.','Caleb L.','Rachel P.','Isaac G.','Miriam D.',
  'Aaron C.','Hannah K.','Elijah M.','Abigail T.','Levi B.','Rebecca S.','Nathaniel R.','Lydia L.',
];

const PRODUCTS_FR = [
  'Guide de prière quotidienne','E-book leadership','Formation gestion financière','Pack méditations',
  'Cours de musique worship','Guide entrepreneuriat','Templates réseaux sociaux','E-book développement personnel',
  'Formation marketing digital','Guide de croissance spirituelle','Pack design graphique','Cours de langues',
  'Guide nutrition et santé','Templates business plan','Formation prise de parole','E-book cuisine africaine',
  'Guide photographie mobile','Pack beats instrumentaux','Formation Excel avancé','Guide rédaction web',
  'Programme de mentoring','Kit de démarrage entrepreneur','E-book finances personnelles','Guide SEO pratique',
  'Formation community management','Pack vidéo créatif','Guide relation d\'aide','E-book méditation biblique',
  'Formation gestion de projet','Guide investissement débutant','Masterclass leadership','Pack prédications audio',
  'Guide création de contenu','E-book mariage chrétien','Formation intelligence artificielle','Guide dropshipping Afrique',
  'Pack templates Canva Pro','Formation montage vidéo','Guide e-commerce africain','E-book éducation des enfants',
  'Cours Python pour débutants','Guide freelancing en Afrique','Pack musique libre de droits','Formation coaching de vie',
  'Guide création podcast','E-book mission et vision','Formation design UI/UX','Guide vente en ligne',
  'Pack stories Instagram','Formation copywriting','Guide stratégie digitale','E-book prière prophétique',
  'Cours WordPress complet','Guide influence marketing','Pack preset Lightroom','Formation data analytics',
  'Guide création d\'association','E-book témoignages inspirants','Formation négociation','Guide personal branding',
];

const PRODUCTS_EN = [
  'Daily Prayer Guide','Leadership E-book','Financial Management Course','Meditation Pack',
  'Worship Music Course','Entrepreneurship Guide','Social Media Templates','Personal Development E-book',
  'Digital Marketing Course','Spiritual Growth Guide','Graphic Design Pack','Language Course',
  'Health & Nutrition Guide','Business Plan Templates','Public Speaking Course','African Cooking E-book',
  'Mobile Photography Guide','Instrumental Beats Pack','Advanced Excel Course','Web Writing Guide',
  'Mentoring Programme','Startup Kit','Personal Finance E-book','Practical SEO Guide',
  'Community Management Course','Creative Video Pack','Counselling Guide','Biblical Meditation E-book',
  'Project Management Course','Beginner Investment Guide','Leadership Masterclass','Audio Sermon Pack',
  'Content Creation Guide','Christian Marriage E-book','AI Training Course','Africa Dropshipping Guide',
];

const ORGS_FR = [
  'Église La Grâce','Ministère Lumière','Association Espoir','Centre Bethel','Fondation Victoire',
  'Communauté Shalom','Mission Agapé','Institut Excellence','Académie du Savoir','Centre Alpha',
  'Église du Réveil','Ministère des Nations','Association Impact','Fondation Vision','Communauté Élohim',
  'Centre de Formation Omega','Mouvement Jérusalem','Ministère Horeb','Fondation Colombe','Académie Grâce',
  'Réseau Chrétien Digital','Centre de Prière Mondial','Fondation Beraca','Communauté des Leaders',
  'Église Mont Sinaï','Ministère Étoile du Matin','Centre Rehoboth','Académie Transformation',
  'Fondation Nouvelle Terre','Communauté Maranatha','Mission Évangile','Centre de Vie Abondante',
  'Ministère Gloire de Dieu','Église Parole de Vie','Fondation Compassion','Association Dignité',
  'Institut Leadership Africain','Communauté Source de Vie','Centre Emmaüs','Ministère Pain Quotidien',
];

const ORGS_EN = [
  'Grace Church','Light Ministry','Hope Association','Bethel Centre','Victory Foundation',
  'Shalom Community','Agape Mission','Excellence Institute','Knowledge Academy','Alpha Centre',
  'Revival Church','Nations Ministry','Impact Association','Vision Foundation','Elohim Community',
  'Omega Training Centre','Jerusalem Movement','Horeb Ministry','Dove Foundation','Grace Academy',
  'Digital Faith Network','Global Prayer Centre','Beraca Foundation','Leaders Community',
];

const COUNTRIES = [
  '🇨🇲','🇳🇬','🇸🇳','🇨🇮','🇧🇯','🇬🇭','🇹🇬','🇨🇩','🇬🇦','🇧🇫','🇲🇱','🇬🇳','🇫🇷','🇧🇪','🇨🇦','🇨🇭',
  '🇬🇧','🇺🇸','🇩🇪','🇳🇪','🇹🇩','🇷🇼','🇧🇮','🇲🇬','🇨🇬','🇬🇶','🇲🇷','🇩🇯','🇰🇲','🇸🇨',
];

const ICONS = [
  <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />,
  <Download className="h-3.5 w-3.5 text-blue-500" />,
  <UserPlus className="h-3.5 w-3.5 text-violet-500" />,
  <Heart className="h-3.5 w-3.5 text-rose-500" />,
  <Star className="h-3.5 w-3.5 text-amber-500" />,
  <Flame className="h-3.5 w-3.5 text-orange-500" />,
  <Globe className="h-3.5 w-3.5 text-teal-500" />,
  <Users className="h-3.5 w-3.5 text-indigo-500" />,
  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
  <Award className="h-3.5 w-3.5 text-amber-600" />,
  <Zap className="h-3.5 w-3.5 text-purple-500" />,
  <BookOpen className="h-3.5 w-3.5 text-sky-500" />,
  <Gift className="h-3.5 w-3.5 text-pink-500" />,
  <Zap className="h-3.5 w-3.5 text-yellow-500" />,
  <Music className="h-3.5 w-3.5 text-fuchsia-500" />,
  <Camera className="h-3.5 w-3.5 text-cyan-500" />,
  <Laptop className="h-3.5 w-3.5 text-slate-500" />,
  <GraduationCap className="h-3.5 w-3.5 text-green-600" />,
  <Church className="h-3.5 w-3.5 text-stone-500" />,
  <Building2 className="h-3.5 w-3.5 text-blue-600" />,
  <Megaphone className="h-3.5 w-3.5 text-red-500" />,
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

interface Activity {
  id: string;
  icon: React.ReactNode;
  text: string;
  time: string;
  flag: string;
  link?: string;
}

function generateActivities(isFr: boolean, count: number): Activity[] {
  const names = isFr ? NAMES_FR : NAMES_EN;
  const products = isFr ? PRODUCTS_FR : PRODUCTS_EN;
  const orgs = isFr ? ORGS_FR : ORGS_EN;
  const activities: Activity[] = [];

  const timesFr = ['à l\'instant','il y a 1min','il y a 2min','il y a 3min','il y a 4min','il y a 5min','il y a 6min','il y a 7min','il y a 8min','il y a 10min','il y a 12min','il y a 15min','il y a 18min','il y a 20min','il y a 25min','il y a 30min','il y a 35min','il y a 40min','il y a 45min','il y a 1h','il y a 2h'];
  const timesEn = ['just now','1m ago','2m ago','3m ago','4m ago','5m ago','6m ago','7m ago','8m ago','10m ago','12m ago','15m ago','18m ago','20m ago','25m ago','30m ago','35m ago','40m ago','45m ago','1h ago','2h ago'];
  const times = isFr ? timesFr : timesEn;

  const templates: ((n: string, p: string, o: string) => Omit<Activity, 'id' | 'time' | 'flag'>)[] = isFr ? [
    (n, p) => ({ icon: ICONS[0], text: `${n} a acheté « ${p} »` }),
    (n, p) => ({ icon: ICONS[1], text: `${n} a téléchargé « ${p} »` }),
    (n, _, o) => ({ icon: ICONS[2], text: `${n} a rejoint ${o}` }),
    (_, _2, o) => ({ icon: ICONS[3], text: `Don anonyme pour ${o}` }),
    (n, p) => ({ icon: ICONS[4], text: `${n} a noté 5« ${p} »` }),
    (_, _2, o) => ({ icon: ICONS[5], text: `${o} a publié une nouvelle ressource` }),
    (_, p) => ({ icon: ICONS[6], text: `${randInt(5, 38)} personnes consultent « ${p} »`, link: '/explorer' }),
    (_, _2) => ({ icon: ICONS[7], text: `${randInt(8, 45)} nouveaux membres aujourd'hui` }),
    (_, p) => ({ icon: ICONS[8], text: `« ${p} » est en tendance 🔥`, link: '/explorer' }),
    (n) => ({ icon: ICONS[9], text: `${n} est devenu ambassadeur` }),
    (n, p) => ({ icon: ICONS[10], text: `${n} recommande « ${p} »` }),
    (n, p) => ({ icon: ICONS[11], text: `${n} a commencé « ${p} »` }),
    (_, _2, o) => ({ icon: ICONS[12], text: `${o} offre une ressource gratuite 🎁`, link: '/explorer' }),
    (n) => ({ icon: ICONS[13], text: `${n} a atteint le niveau Gold ⚡` }),
    (n, p) => ({ icon: ICONS[14], text: `${n} écoute « ${p} » en ce moment` }),
    (n) => ({ icon: ICONS[15], text: `${n} a partagé son portfolio` }),
    (n, p) => ({ icon: ICONS[16], text: `${n} s'est inscrit pour « ${p} »` }),
    (_, _2, o) => ({ icon: ICONS[17], text: `${o} lance une nouvelle formation` }),
    (_, _2, o) => ({ icon: ICONS[18], text: `${o} a atteint 100 membres` }),
    (_, _2, o) => ({ icon: ICONS[19], text: `${o} vient de rejoindre la plateforme`, link: '/explorer' }),
    (_, p) => ({ icon: ICONS[20], text: `Dernière chance pour « ${p} » — promo -30%`, link: '/explorer' }),
    (n) => ({ icon: ICONS[2], text: `${n} a créé son organisation` }),
    (n, p) => ({ icon: ICONS[0], text: `${n} vient d'acquérir « ${p} »` }),
    (_, p) => ({ icon: ICONS[8], text: `+${randInt(50, 300)}% de vues pour « ${p} » cette semaine` }),
    (n) => ({ icon: ICONS[9], text: `${n} a gagné sa première commission 💰` }),
    (n, p) => ({ icon: ICONS[4], text: `${n} : "Excellent !" —sur « ${p} »` }),
    (_, _2, o) => ({ icon: ICONS[3], text: `Objectif de don atteint pour ${o} 🎉` }),
    (n, p) => ({ icon: ICONS[1], text: `${n} a terminé « ${p} » avec succès ✅` }),
    (_, _2, o) => ({ icon: ICONS[5], text: `Nouvelle annonce de ${o}` }),
    (n) => ({ icon: ICONS[13], text: `${n} a débloqué le badge "Super Fan"` }),
  ] : [
    (n, p) => ({ icon: ICONS[0], text: `${n} purchased "${p}"` }),
    (n, p) => ({ icon: ICONS[1], text: `${n} downloaded "${p}"` }),
    (n, _, o) => ({ icon: ICONS[2], text: `${n} joined ${o}` }),
    (_, _2, o) => ({ icon: ICONS[3], text: `Anonymous donation to ${o}` }),
    (n, p) => ({ icon: ICONS[4], text: `${n} rated 5"${p}"` }),
    (_, _2, o) => ({ icon: ICONS[5], text: `${o} published a new resource` }),
    (_, p) => ({ icon: ICONS[6], text: `${randInt(5, 38)} people viewing "${p}"`, link: '/explorer' }),
    (_, _2) => ({ icon: ICONS[7], text: `${randInt(8, 45)} new members today` }),
    (_, p) => ({ icon: ICONS[8], text: `"${p}" is trending 🔥`, link: '/explorer' }),
    (n) => ({ icon: ICONS[9], text: `${n} became an ambassador` }),
    (n, p) => ({ icon: ICONS[10], text: `${n} recommends "${p}"` }),
    (n, p) => ({ icon: ICONS[11], text: `${n} started "${p}"` }),
    (_, _2, o) => ({ icon: ICONS[12], text: `${o} offers a free resource 🎁`, link: '/explorer' }),
    (n) => ({ icon: ICONS[13], text: `${n} reached Gold level ⚡` }),
    (n, p) => ({ icon: ICONS[14], text: `${n} is listening to "${p}" right now` }),
    (n) => ({ icon: ICONS[15], text: `${n} shared their portfolio` }),
    (n, p) => ({ icon: ICONS[16], text: `${n} signed up for "${p}"` }),
    (_, _2, o) => ({ icon: ICONS[17], text: `${o} launched a new course` }),
    (_, _2, o) => ({ icon: ICONS[18], text: `${o} reached 100 members` }),
    (_, _2, o) => ({ icon: ICONS[19], text: `${o} just joined the platform`, link: '/explorer' }),
    (_, p) => ({ icon: ICONS[20], text: `Last chance for "${p}" — 30% off`, link: '/explorer' }),
    (n) => ({ icon: ICONS[2], text: `${n} created their organization` }),
    (n, p) => ({ icon: ICONS[0], text: `${n} just acquired "${p}"` }),
    (_, p) => ({ icon: ICONS[8], text: `+${randInt(50, 300)}% views for "${p}" this week` }),
    (n) => ({ icon: ICONS[9], text: `${n} earned their first commission 💰` }),
    (n, p) => ({ icon: ICONS[4], text: `${n}: "Excellent!" —on "${p}"` }),
    (_, _2, o) => ({ icon: ICONS[3], text: `Donation goal reached for ${o} 🎉` }),
    (n, p) => ({ icon: ICONS[1], text: `${n} completed "${p}" successfully ✅` }),
    (_, _2, o) => ({ icon: ICONS[5], text: `New announcement from ${o}` }),
    (n) => ({ icon: ICONS[13], text: `${n} unlocked the "Super Fan" badge` }),
  ];

  for (let i = 0; i < count; i++) {
    const n = pick(names);
    const p = pick(products);
    const o = pick(orgs);
    const tpl = pick(templates);
    const result = tpl(n, p, o);
    activities.push({
      id: `act-${i}-${Math.random().toString(36).slice(2, 6)}`,
      ...result,
      time: pick(times),
      flag: pick(COUNTRIES),
    });
  }

  return activities;
}

export function GlobalActivityBar() {
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const isSuperadmin = location.pathname.startsWith('/superadmin');
  const [dismissed, setDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch real data to inject
  const { data: realActivities = [] } = useQuery({
    queryKey: ['global-activity-real', locale],
    queryFn: async () => {
      const results: Activity[] = [];

      const { data: purchases } = await db
        .from('product_purchases')
        .select('id, created_at, digital_products(title, organizations(name))')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(15);

      if (purchases) {
        for (const p of purchases) {
          const prod = (p as any).digital_products?.title;
          if (prod) {
            results.push({
              id: `real-p-${p.id}`,
              icon: <ShoppingBag className="h-3.5 w-3.5 text-emerald-500" />,
              text: isFr ? `Quelqu'un a acheté « ${prod} »` : `Someone purchased "${prod}"`,
              time: isFr ? 'récemment' : 'recently',
              flag: pick(COUNTRIES),
            });
          }
        }
      }

      const { data: newOrgs } = await db
        .from('organizations')
        .select('id, created_at, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (newOrgs) {
        for (const o of newOrgs) {
          results.push({
            id: `real-o-${o.id}`,
            icon: <Building2 className="h-3.5 w-3.5 text-blue-600" />,
            text: isFr ? `${o.name} a rejoint la plateforme` : `${o.name} joined the platform`,
            time: isFr ? 'récemment' : 'recently',
            flag: pick(COUNTRIES),
          });
        }
      }

      return results;
    },
    staleTime: 120_000,
  });

  // Generate 1200 synthetic + merge real
  const allActivities = useMemo(() => {
    const synthetic = generateActivities(isFr, 1200);
    const merged = [...realActivities, ...synthetic];
    // Shuffle
    for (let i = merged.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [merged[i], merged[j]] = [merged[j], merged[i]];
    }
    return merged;
  }, [isFr, realActivities]);

  // Rotate every 2.5s
  useEffect(() => {
    if (isSuperadmin || dismissed || allActivities.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % allActivities.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isSuperadmin, dismissed, allActivities.length]);

  if (isSuperadmin || dismissed) return null;

  const current = allActivities[currentIndex];
  if (!current) return null;

  const content = (
    <div className="flex items-center gap-2.5 min-w-0 flex-1">
      {current.icon}
      <span className="text-sm font-medium truncate">{current.text}</span>
      <span className="text-xs text-muted-foreground shrink-0">{current.flag} · {current.time}</span>
    </div>
  );

  return (
    <div className="sticky top-0 z-[60] w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 backdrop-blur-md">
      <div className="container max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Live
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-w-0"
          >
            {current.link ? (
              <Link to={current.link} className="flex items-center gap-2.5 min-w-0 hover:underline">
                {current.icon}
                <span className="text-sm font-medium truncate">{current.text}</span>
                <span className="text-xs text-muted-foreground shrink-0">{current.flag} · {current.time}</span>
              </Link>
            ) : content}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isFr ? 'Fermer' : 'Close'}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
