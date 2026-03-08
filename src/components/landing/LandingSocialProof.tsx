import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  { name: 'Ibrahim T.', role: 'Ambassadeur', text: 'Je n\'ai aucun contenu à moi. Je partage les ressources des autres et je gagne des commissions chaque semaine.', flag: '🇸🇳' },
  { name: 'Marie-Claire B.', role: 'Créatrice', text: 'J\'ai centralisé tous mes documents sur une seule plateforme. Mes clients achètent et téléchargent en un clic.', flag: '🇨🇲' },
  { name: 'David K.', role: 'Directeur ONG', text: 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic.', flag: '🇬🇭' },
  { name: 'Fatou N.', role: 'Coach & Formatrice', text: 'Grâce au LMS intégré, j\'ai créé une formation complète avec certificats. Mes élèves adorent suivre leur progression.', flag: '🇨🇮' },
  { name: 'Jean-Paul M.', role: 'Auteur', text: 'L\'AI Studio m\'a permis de créer un livre de coloriage en une journée. La prévisualisation PDF rassure mes acheteurs.', flag: '🇨🇩' },
  { name: 'Grace A.', role: 'Acheteuse', text: 'J\'adore la wishlist ! Je sauvegarde les ressources et je reçois une alerte dès qu\'il y a une promo.', flag: '🇳🇬' },
];

export function LandingSocialProof() {
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
            Ils gagnent déjà avec <span className="text-primary">Siteviral</span>
          </h2>
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
