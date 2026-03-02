import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Ibrahim T.', role: 'Ambassadeur', text: 'Je n\'ai aucun contenu à moi. Je partage les ressources des autres et je gagne des commissions chaque semaine.', flag: '🇸🇳' },
  { name: 'Marie-Claire B.', role: 'Créatrice', text: 'J\'ai centralisé tous mes documents sur une seule plateforme. Mes clients achètent et téléchargent en un clic.', flag: '🇨🇲' },
  { name: 'David K.', role: 'Directeur ONG', text: 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic.', flag: '🇬🇭' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingSocialProof() {
  return (
    <section className="py-16 px-4">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Ils gagnent déjà avec <span className="text-primary">Siteviral</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-5 space-y-3"
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
