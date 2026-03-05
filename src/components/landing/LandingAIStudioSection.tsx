import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Palette, Mic, Image, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const capabilities = [
  { icon: BookOpen, title: 'Livres pour enfants', desc: 'Histoires illustrées générées par IA avec personnages cohérents.' },
  { icon: Palette, title: 'Cahiers de coloriage', desc: 'Pages de coloriage thématiques en line-art, prêtes à vendre.' },
  { icon: Image, title: 'Couvertures & visuels', desc: 'Couvertures de produits professionnelles en un clic.' },
  { icon: Mic, title: 'Audio & TTS', desc: 'Transformez vos textes en audiobooks avec des voix naturelles.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingAIStudioSection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full gap-1">
            <Sparkles className="h-3 w-3" /> Nouveau
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Créez avec l'<span className="text-primary">IA</span>, vendez en automatique
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm">
            L'AI Studio transforme vos idées en produits numériques prêts à vendre — livres, coloriage, audio — sans compétence technique.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-5 flex gap-4 items-start hover:border-primary/20 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">{c.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/auth?mode=signup')}>
            Essayer l'AI Studio <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
