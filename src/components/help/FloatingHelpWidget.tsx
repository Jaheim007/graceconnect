import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, MessageCircle, BookOpen, LifeBuoy, Keyboard, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsTyping } from '@/hooks/useIsTyping';


// Contextual FAQ answers based on current page
const CONTEXTUAL_HELP: Record<string, { q: string; a: string }[]> = {
  '/admin/kyc': [
    { q: 'Pourquoi le KYC est-il obligatoire ?', a: 'Le KYC est requis pour recevoir vos fonds. Il protège contre le blanchiment d\'argent. La vérification prend 48h.' },
    { q: 'Quels documents fournir ?', a: 'Niveau 1 : Pièce d\'identité + selfie. Niveau 2 : Document d\'organisation (statuts, récépissé).' },
  ],
  '/admin/payouts': [
    { q: 'Quand reçois-je mes fonds ?', a: 'Les vendeurs après 3 jours de rétention, les ambassadeurs après 15 jours. Retrait automatique vers votre compte.' },
    { q: 'Pourquoi mes fonds sont gelés ?', a: 'Vérifiez votre KYC. Les fonds sont retenus jusqu\'à validation de votre identité.' },
  ],
  '/admin/products': [
    { q: 'Comment créer un produit ?', a: 'Cliquez "Nouveau produit", ajoutez titre + description + fichier + couverture, puis publiez.' },
    { q: 'Pourquoi mon produit ne se vend pas ?', a: 'Ajoutez une couverture attractive, une description détaillée, et partagez sur WhatsApp.' },
  ],
  '/admin/affiliation': [
    { q: 'Comment activer le programme ambassadeur ?', a: 'Allez dans Paramètres > Programme ambassadeur et activez-le. Définissez votre taux de commission (5-50%).' },
    { q: 'Comment recruter des ambassadeurs ?', a: 'Partagez votre page boutique. Les visiteurs peuvent devenir ambassadeurs en 1 clic.' },
  ],
  '/gagner-legacy': [
    { q: 'Comment gagner des commissions ?', a: 'Choisissez un produit, cliquez "Devenir ambassadeur", partagez votre lien unique. Chaque vente = commission.' },
    { q: 'Quand reçois-je mes commissions ?', a: 'Après 15 jours de validation. Vous pouvez retirer via Mobile Money ou virement.' },
  ],
  '/gagner': [
    { q: 'Comment devenir ambassadeur ?', a: 'Parcourez les produits, cliquez "Promouvoir" pour obtenir votre lien unique de partage.' },
    { q: 'Combien puis-je gagner ?', a: 'Les commissions vont de 5% à 50% par vente. Plus vous partagez, plus vous gagnez.' },
  ],
};

function getContextualHelp(pathname: string): { q: string; a: string }[] {
  // Match exact or prefix
  for (const [path, faqs] of Object.entries(CONTEXTUAL_HELP)) {
    if (pathname.startsWith(path)) return faqs;
  }
  return [];
}

export function FloatingHelpWidget() {
  const [open, setOpen] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useI18n();
  const { user } = useAuth();
  const typing = useIsTyping();
  const isFr = locale === 'fr';


  const contextFaqs = useMemo(() => getContextualHelp(location.pathname), [location.pathname]);

  const items = [
    ...(contextFaqs.length > 0 ? [{
      icon: <HelpCircle className="h-4 w-4 text-primary" />,
      label: isFr ? 'Réponses rapides' : 'Quick answers',
      onClick: () => setShowFaq(!showFaq),
      highlight: true,
    }] : []),
    {
      icon: <LifeBuoy className="h-4 w-4" />,
      label: isFr ? 'Centre d\'aide' : 'Help Center',
      onClick: () => { navigate('/help'); setOpen(false); },
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: isFr ? 'Tutoriels & Guides' : 'Tutorials & Guides',
      onClick: () => { navigate('/tutoriels'); setOpen(false); },
    },
    {
      icon: <Keyboard className="h-4 w-4" />,
      label: isFr ? 'Raccourcis clavier' : 'Keyboard Shortcuts',
      onClick: () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        setOpen(false);
      },
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: isFr ? 'Nous contacter' : 'Contact Us',
      onClick: () => {
        window.open('mailto:support@siteviral.com', '_blank');
        setOpen(false);
      },
    },
  ];

  if (!user) return null;

  return (
    <div
      className={`fixed right-3 z-[55] transition-opacity duration-200 md:right-6 ${
        typing && !open ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ bottom: 'var(--sv-fab-offset)' }}
    >

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="mb-3 w-64 rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            <div className="p-3 border-b border-border bg-muted/30">
              <p className="text-xs font-bold">{isFr ? '💡 Besoin d\'aide ?' : '💡 Need help?'}</p>
            </div>

            {/* Contextual FAQ answers */}
            {showFaq && contextFaqs.length > 0 && (
              <div className="p-2 border-b border-border bg-primary/5">
                {contextFaqs.map((faq, i) => (
                  <div key={i} className="p-2.5 rounded-lg mb-1 last:mb-0">
                    <p className="text-[11px] font-semibold text-foreground mb-1">{faq.q}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="p-1.5 space-y-0.5">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                    (item as any).highlight
                      ? 'text-primary font-semibold hover:bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {(item as any).highlight && <ChevronRight className="h-3 w-3 ml-auto" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        {open ? <X className="h-4.5 w-4.5" /> : <HelpCircle className="h-4.5 w-4.5" />}
      </motion.button>
    </div>
  );
}
