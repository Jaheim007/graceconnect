import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, UserPlus, Download, Heart, Star, Globe, Flame, Users, TrendingUp, Award } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const NAMES = [
  'Marie K.', 'Aimé T.', 'Grâce M.', 'Samuel O.', 'Joséphine N.', 'Patrick D.', 'Esther B.', 'David L.',
  'Ruth A.', 'Emmanuel S.', 'Carine W.', 'Yannick P.', 'Béatrice F.', 'Olivier H.', 'Sarah J.', 'Jean-Paul R.',
  'Abigaïl C.', 'Thierry M.', 'Naomi K.', 'François T.', 'Prisca D.', 'Charles E.', 'Lydia N.', 'Marc A.',
  'Rachel B.', 'Christophe G.', 'Deborah L.', 'André V.', 'Miriam S.', 'Benjamin O.', 'Gloria F.', 'Josué P.',
  'Irène D.', 'Paul K.', 'Julienne M.', 'Moïse T.', 'Rebecca N.', 'Salomon B.', 'Élisabeth A.', 'Jacques L.',
  'Micheline S.', 'Pierre G.', 'Claudine H.', 'Daniel W.', 'Véronique R.', 'Étienne C.', 'Bernadette J.', 'Simon F.',
  'Monique D.', 'Raphaël E.', 'Jeannette K.', 'Luc M.', 'Félicité N.', 'Gédéon T.', 'Anne-Marie B.', 'Caleb S.',
  'Viviane O.', 'Nathanaël P.', 'Rosalie A.', 'Aristide L.',
];

const PRODUCTS = [
  'Guide de prière quotidienne', 'E-book leadership', 'Formation gestion financière', 'Pack méditations',
  'Cours de musique worship', 'Guide entrepreneuriat', 'Templates réseaux sociaux', 'E-book développement personnel',
  'Formation marketing digital', 'Guide de croissance spirituelle', 'Pack design graphique', 'Cours de langues',
  'Guide nutrition et santé', 'Templates business plan', 'Formation prise de parole', 'E-book cuisine africaine',
  'Guide photographie mobile', 'Pack beats instrumentaux', 'Formation Excel avancé', 'Guide rédaction web',
  'Programme de mentoring', 'Kit de démarrage entrepreneur', 'E-book finances personnelles', 'Guide SEO pratique',
  'Formation community management', 'Pack vidéo créatif', 'Guide relation d\'aide', 'E-book méditation biblique',
  'Formation gestion de projet', 'Guide investissement débutant',
];

const ORGS = [
  'Église La Grâce', 'Ministère Lumière', 'Association Espoir', 'Centre Bethel', 'Fondation Victoire',
  'Communauté Shalom', 'Mission Agapé', 'Institut Excellence', 'Académie du Savoir', 'Centre Alpha',
  'Église du Réveil', 'Ministère des Nations', 'Association Impact', 'Fondation Vision', 'Communauté Élohim',
  'Centre de Formation Omega', 'Mouvement Jérusalem', 'Ministère Horeb', 'Fondation Colombe', 'Académie Grâce',
  'Réseau Chrétien Digital', 'Centre de Prière Mondial', 'Fondation Beraca', 'Communauté des Leaders',
];

const COUNTRIES = ['🇨🇲', '🇳🇬', '🇸🇳', '🇨🇮', '🇧🇯', '🇬🇭', '🇹🇬', '🇨🇩', '🇬🇦', '🇧🇫', '🇲🇱', '🇬🇳', '🇫🇷', '🇧🇪', '🇨🇦', '🇨🇭'];

const TIMES = ['à l\'instant', 'il y a 1min', 'il y a 2min', 'il y a 3min', 'il y a 5min', 'il y a 8min', 'il y a 12min', 'il y a 15min'];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

interface Notification {
  id: string;
  icon: React.ReactNode;
  text: string;
  subtext: string;
  flag?: string;
}

function generateNotification(): Notification {
  const name = pick(NAMES);
  const prod = pick(PRODUCTS);
  const org = pick(ORGS);
  const flag = pick(COUNTRIES);
  const time = pick(TIMES);
  const id = `fp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const templates: (() => Notification)[] = [
    () => ({ id, icon: <ShoppingBag className="h-4 w-4 text-emerald-500" />, text: `${name} a acheté « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Download className="h-4 w-4 text-blue-500" />, text: `${name} a téléchargé « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <UserPlus className="h-4 w-4 text-violet-500" />, text: `${name} a rejoint ${org}`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Heart className="h-4 w-4 text-rose-500" />, text: `Don anonyme pour ${org}`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Star className="h-4 w-4 text-amber-500" />, text: `${name} a noté 5⭐ « ${prod} »`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <Flame className="h-4 w-4 text-orange-500" />, text: `${org} a publié une nouvelle ressource`, subtext: time }),
    () => ({ id, icon: <Globe className="h-4 w-4 text-teal-500" />, text: `${randInt(3, 18)} personnes consultent « ${prod} »`, subtext: 'en ce moment' }),
    () => ({ id, icon: <Users className="h-4 w-4 text-indigo-500" />, text: `${randInt(5, 25)} nouveaux membres aujourd'hui`, subtext: `${flag} · ${time}` }),
    () => ({ id, icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, text: `« ${prod} » est en tendance 🔥`, subtext: `+${randInt(30, 200)}% cette semaine` }),
    () => ({ id, icon: <Award className="h-4 w-4 text-amber-500" />, text: `${name} est devenu ambassadeur`, subtext: `${flag} · ${time}` }),
  ];

  return pick(templates)();
}

export function FloatingProofToast() {
  const location = useLocation();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);

  // Hide on superadmin pages
  const isSuperadmin = location.pathname.startsWith('/superadmin');

  const showNext = useCallback(() => {
    if (isSuperadmin) return;
    const notif = generateNotification();
    setNotification(notif);
    setVisible(true);
    // Auto-hide after 4s
    setTimeout(() => setVisible(false), 4000);
  }, [isSuperadmin]);

  useEffect(() => {
    if (isSuperadmin) return;
    // First notification after 6-12s
    const initialDelay = setTimeout(() => {
      showNext();
    }, randInt(6000, 12000));

    // Then every 8-15s
    const interval = setInterval(() => {
      showNext();
    }, randInt(8000, 15000));

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [showNext, isSuperadmin]);

  if (isSuperadmin) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs sm:max-w-sm pointer-events-none">
      <AnimatePresence>
        {visible && notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto bg-card border border-border/60 rounded-xl shadow-xl shadow-black/10 p-3.5 flex items-start gap-3 backdrop-blur-md"
          >
            <div className="h-9 w-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
              {notification.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug truncate">{notification.text}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{notification.subtext}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
