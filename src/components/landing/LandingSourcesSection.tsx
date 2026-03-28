import { motion } from 'framer-motion';
import { Lightbulb, FileText, Video, Mic, PenLine } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingSourcesSection() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const sources = isFr ? [
    { icon: Lightbulb, title: 'Une idée', desc: "Décris ton sujet, l'IA écrit ton livre." },
    { icon: FileText, title: 'Un document', desc: "Upload ton PDF, Word ou texte. L'IA le structure." },
    { icon: Video, title: 'Une vidéo', desc: "Colle ton lien YouTube. L'IA transcrit et transforme." },
    { icon: Mic, title: 'Un audio', desc: 'Ta prédication, ton podcast → livre en 5 minutes.' },
    { icon: PenLine, title: 'Des notes', desc: "Même des notes manuscrites. L'IA fait le reste." },
  ] : [
    { icon: Lightbulb, title: 'An idea', desc: 'Describe your topic, AI writes your book.' },
    { icon: FileText, title: 'A document', desc: 'Upload your PDF, Word or text. AI structures it.' },
    { icon: Video, title: 'A video', desc: 'Paste your YouTube link. AI transcribes and transforms.' },
    { icon: Mic, title: 'An audio', desc: 'Your sermon, your podcast → book in 5 minutes.' },
    { icon: PenLine, title: 'Notes', desc: 'Even handwritten notes. AI does the rest.' },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
            {isFr ? 'Sources acceptées' : 'Accepted sources'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            {isFr ? (
              <>Tu as <span className="text-primary">déjà ton contenu</span> ?</>
            ) : (
              <>Already have <span className="text-primary">your content</span>?</>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
            {isFr
              ? 'Vidéo, audio, document, notes — on le transforme en livre vendable.'
              : 'Video, audio, document, notes — we turn it into a sellable book.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {sources.map((source, i) => (
            <motion.div
              key={source.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border/60 rounded-2xl p-5 text-center hover:border-primary/20 hover:shadow-[var(--shadow-card)] transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
                <source.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-bold text-sm mb-1">{source.title}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{source.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
