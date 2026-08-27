import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { Rocket, Users, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

const cards = [
  {
    icon: <Rocket className="h-6 w-6" />,
    titleFr: 'Créez votre plateforme',
    titleEn: 'Create your platform',
    descFr: 'Vendez vos ressources numériques, collectez des dons — zéro abonnement.',
    descEn: 'Sell your digital resources, collect donations — zero subscription.',
    ctaFr: 'Commencer',
    ctaEn: 'Get started',
    path: '/auth?mode=signup',
  },
  {
    icon: <Users className="h-6 w-6" />,
    titleFr: 'Devenez ambassadeur',
    titleEn: 'Become an ambassador',
    descFr: 'Partagez des ressources et gagnez une commission sur chaque vente.',
    descEn: 'Share resources and earn a commission on every sale.',
    ctaFr: 'En savoir plus',
    ctaEn: 'Learn more',
    path: '/ambassador',
  },
  {
    icon: <ShoppingBag className="h-6 w-6" />,
    titleFr: 'Explorez les ressources',
    titleEn: 'Browse resources',
    descFr: 'E-books, audio, vidéos, documents — achetez et soutenez des créateurs.',
    descEn: 'E-books, audio, videos, documents — buy and support creators.',
    ctaFr: 'Découvrir',
    ctaEn: 'Discover',
    path: '#products',
  },
];

export function DiscoverCTABanner() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="mb-8">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 26 }}
            className="rounded-xl border border-border bg-card/80 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2 text-primary">
              {card.icon}
              <h3 className="font-bold text-sm">{isFr ? card.titleFr : card.titleEn}</h3>
            </div>
            <p className="text-xs text-muted-foreground flex-1">{isFr ? card.descFr : card.descEn}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-1 w-fit text-xs"
              onClick={() => {
                if (card.path.startsWith('#')) {
                  document.getElementById(card.path.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate(card.path);
                }
              }}
            >
              {isFr ? card.ctaFr : card.ctaEn}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
