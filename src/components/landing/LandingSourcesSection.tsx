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
    <section className="py-16 px-4">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            {isFr ? (
              <>Tu as <span className="text-primary">déjà ton contenu</span> ?</>
            ) : (
              <>Already have <span className="text-primary">your content</span>?</>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            {isFr
              ? 'Vidéo, audio, document, notes — on le transforme en livre vendable.'
              : 'Video, audio, document, notes — we turn it into a sellable book.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {sources.map((source, i) => (
            <motion.div
              key={source.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/20 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <source.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-bold text-xs mb-0.5">{source.title}</p>
              <p className="text-[10px] text-muted-foreground leading-snug">{source.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
