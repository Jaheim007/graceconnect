import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function LandingSocialProof() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const testimonials = isFr ? [
    { name: 'Kofi A.', role: 'Pasteur & Auteur', text: "J'ai transformé mes prédications en un livre vendu à travers tout le Ghana. Mobile Money, c'est instantané.", flag: '🇬🇭' },
    { name: 'Fatou N.', role: 'Coach & Formatrice', text: "Grâce au LMS intégré, j'ai créé une formation complète avec certificats. Mes élèves adorent.", flag: '🇨🇮' },
    { name: 'James M.', role: 'Ambassadeur', text: "Je partage les livres sur WhatsApp et je gagne des commissions chaque semaine via M-Pesa.", flag: '🇰🇪' },
    { name: 'Grace O.', role: 'Auteure', text: "Mon ebook touche la diaspora aux USA et au UK. Les paiements par carte sont instantanés.", flag: '🇳🇬' },
    { name: 'David T.', role: 'Directeur ONG', text: "Nos campagnes de collecte ont levé 3x plus qu'avant. Donateurs en Afrique du Sud et au-delà.", flag: '🇿🇦' },
    { name: 'Sarah L.', role: 'Missionnaire', text: "Depuis la France, je vends mes livres dans toute l'Afrique francophone. SiteViral gère tout.", flag: '🇫🇷' },
  ] : [
    { name: 'Kofi A.', role: 'Pastor & Author', text: "I turned my sermons into a book sold across Ghana. Mobile Money payments are instant.", flag: '🇬🇭' },
    { name: 'Fatou N.', role: 'Coach & Trainer', text: "With the built-in LMS, I created a full course with certificates. My students love it.", flag: '🇨🇮' },
    { name: 'James M.', role: 'Ambassador', text: "I share books on WhatsApp and earn commissions every week via M-Pesa.", flag: '🇰🇪' },
    { name: 'Grace O.', role: 'Author', text: "My ebook reaches the diaspora in the US and UK. Card payments are instant.", flag: '🇳🇬' },
    { name: 'David T.', role: 'NGO Director', text: "Our fundraising campaigns raised 3x more than before. Donors from South Africa and beyond.", flag: '🇿🇦' },
    { name: 'Sarah L.', role: 'Content Creator', text: "From London, I sell my books across Francophone Africa. SiteViral handles everything.", flag: '🇬🇧' },
  ];

  return (
    <section className="py-16 px-4">
      <div className="container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: 'easeOut' as const }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            {isFr ? (
              <>Ils gagnent déjà avec <span className="text-primary">SiteViral</span></>
            ) : (
              <>They're already earning with <span className="text-primary">SiteViral</span></>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            🇬🇭 🇰🇪 🇨🇮 🇳🇬 🇿🇦 🇺🇸 🇬🇧 🇫🇷
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-xl p-5 space-y-3 transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-lg">{t.flag}</span>
                <div>
                  <p className="text-xs font-bold">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
