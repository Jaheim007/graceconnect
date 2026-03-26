import { motion } from 'framer-motion';
import { DollarSign, Star, TrendingUp, Award, CheckCircle, Smartphone } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Social Proof Wall — impressive testimonials and earning screenshots.
 * Uses inflated/aspirational data for cold-start phase.
 * Shows "real-looking" earning testimonials to create FOMO.
 */

interface Testimonial {
  name: string;
  role: string;
  flag: string;
  amount: string;
  text: string;
  period: string;
  avatar?: string;
}

export function SocialProofWall({ limit = 6 }: { limit?: number }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const testimonials: Testimonial[] = isFr ? [
    { name: 'Awa D.', role: 'Ambassadrice', flag: '🇸🇳', amount: '125 000 FCFA', text: 'J\'ai commencé en partageant un seul lien sur WhatsApp. En 2 semaines, j\'avais déjà reçu mon premier retrait.', period: 'en 2 semaines' },
    { name: 'Kevin M.', role: 'Créateur', flag: '🇨🇲', amount: '350 000 FCFA', text: 'Mon ebook écrit avec l\'IA se vend tout seul. Je dors et je gagne. SiteViral a changé ma vie.', period: 'par mois' },
    { name: 'Pasteur Jean K.', role: 'Créateur', flag: '🇨🇩', amount: '280 000 FCFA', text: 'Nos dévotionnels touchent maintenant des fidèles dans 12 pays. Les dons en ligne ont triplé.', period: 'par mois' },
    { name: 'Fatou B.', role: 'Ambassadrice', flag: '🇨🇮', amount: '85 000 FCFA', text: 'Je n\'ai rien créé. Je partage juste des produits dans mes groupes WhatsApp et je touche ma commission.', period: 'en 1 semaine' },
    { name: 'Mariama S.', role: 'Formatrice', flag: '🇸🇳', amount: '520 000 FCFA', text: 'Ma formation créée en 5 minutes avec l\'IA a déjà 45 inscrits. C\'est incroyable.', period: 'en 1 mois' },
    { name: 'Emmanuel O.', role: 'Ambassadeur', flag: '🇳🇬', amount: '95 000 FCFA', text: 'I shared 3 products on my Instagram story. Next morning I had commissions waiting.', period: 'en 3 jours' },
    { name: 'Blessing A.', role: 'Créatrice', flag: '🇬🇭', amount: '180 000 FCFA', text: 'J\'ai écrit un livre sur l\'éducation des enfants. Les mamans de mon groupe l\'adorent.', period: 'en 2 semaines' },
    { name: 'Christophe R.', role: 'Formateur', flag: '🇧🇯', amount: '420 000 FCFA', text: 'Ma formation Excel se vend grâce aux ambassadeurs. Je n\'ai même pas besoin de faire de pub.', period: 'par mois' },
  ] : [
    { name: 'Awa D.', role: 'Ambassador', flag: '🇸🇳', amount: '125,000 FCFA', text: 'I started by sharing one link on WhatsApp. In 2 weeks, I had already received my first withdrawal.', period: 'in 2 weeks' },
    { name: 'Kevin M.', role: 'Creator', flag: '🇨🇲', amount: '350,000 FCFA', text: 'My AI-written ebook sells on its own. I sleep and earn. SiteViral changed my life.', period: 'per month' },
    { name: 'Pastor Jean K.', role: 'Creator', flag: '🇨🇩', amount: '280,000 FCFA', text: 'Our devotionals now reach people in 12 countries. Online donations tripled.', period: 'per month' },
    { name: 'Fatou B.', role: 'Ambassador', flag: '🇨🇮', amount: '85,000 FCFA', text: 'I didn\'t create anything. I just share products in my WhatsApp groups and collect commissions.', period: 'in 1 week' },
    { name: 'Mariama S.', role: 'Trainer', flag: '🇸🇳', amount: '520,000 FCFA', text: 'My course created in 5 minutes with AI already has 45 enrollees. Incredible.', period: 'in 1 month' },
    { name: 'Emmanuel O.', role: 'Ambassador', flag: '🇳🇬', amount: '95,000 FCFA', text: 'I shared 3 products on my Instagram story. Next morning I had commissions waiting.', period: 'in 3 days' },
    { name: 'Blessing A.', role: 'Creator', flag: '🇬🇭', amount: '180,000 FCFA', text: 'I wrote a book about child education. Moms in my group love it.', period: 'in 2 weeks' },
    { name: 'Christophe R.', role: 'Trainer', flag: '🇧🇯', amount: '420,000 FCFA', text: 'My Excel course sells thanks to ambassadors. I don\'t even need ads.', period: 'per month' },
  ];

  const displayed = testimonials.slice(0, limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-extrabold">{isFr ? 'Ils gagnent déjà avec SiteViral' : 'They\'re already earning with SiteViral'}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {displayed.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-bold">
                {t.flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold truncate">{t.name}</p>
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                </div>
                <p className="text-[10px] text-muted-foreground">{t.role}</p>
              </div>
            </div>

            {/* Earning highlight */}
            <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-sm font-extrabold text-emerald-600">{t.amount}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{t.period}</span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">"{t.text}"</p>
          </motion.div>
        ))}
      </div>

      {/* Bottom motivational CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
      >
        <p className="text-sm font-bold mb-1">
          {isFr ? '💡 Tu peux faire pareil. Commence maintenant.' : '💡 You can do the same. Start now.'}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {isFr ? 'Créer. Partager. Gagner.' : 'Create. Share. Earn.'}
        </p>
      </motion.div>
    </div>
  );
}
