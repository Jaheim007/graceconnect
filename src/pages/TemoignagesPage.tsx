import React, { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

interface Testimonial {
  name: string;
  role: string;
  text: string;
  flag: string;
  category: string;
  highlight?: string;
}

const testimonials: Testimonial[] = [
  { name: 'Pasteur K. M.', role: 'Leader communautaire', text: 'En une semaine, notre communauté a pu offrir plus de 200 prédications audio. Les dons arrivent aussi par Mobile Money. C\'est révolutionnaire.', flag: '🇳🇬', category: 'Église', highlight: '200 prédications en 1 semaine' },
  { name: 'Marie-Claire B.', role: 'Coach & Auteure', text: 'J\'ai centralisé tous mes documents et ressources sur une seule plateforme. Mes clients achètent et téléchargent en un clic. Plus besoin d\'envoyer par WhatsApp.', flag: '🇨🇲', category: 'Formatrice', highlight: 'Ventes 100% automatisées' },
  { name: 'Ibrahim T.', role: 'Ambassadeur Siteviral', text: 'Je n\'ai aucun contenu à moi. Je partage les ressources des autres et je gagne des commissions chaque semaine. C\'est incroyable, je n\'investis rien.', flag: '🇸🇳', category: 'Ambassadeur', highlight: 'Commissions chaque semaine' },
  { name: 'Amara D.', role: 'Créatrice digitale', text: 'En 2 mois, j\'ai vendu plus de 500 ressources numériques. Les paiements sont automatiques et les retraits rapides. Je me concentre sur la création.', flag: '🇨🇮', category: 'Créatrice', highlight: '500 ventes en 2 mois' },
  { name: 'Sophie N.', role: 'Responsable communautaire', text: 'La gestion de notre communauté de 2000 membres est devenue simple. Contenu, dons, événements : tout est centralisé sur notre page.', flag: '🇧🇯', category: 'Organisation', highlight: '2000 membres gérés' },
  { name: 'David K.', role: 'Directeur ONG', text: 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic. La transparence est totale.', flag: '🇬🇭', category: 'ONG', highlight: '3x plus de fonds levés' },
  { name: 'Fatou S.', role: 'Étudiante ambassadrice', text: 'Je partage des cours et des e-books sur mes groupes WhatsApp et je touche entre 10% et 30% de commission. Ça paie mes frais de scolarité.', flag: '🇸🇳', category: 'Étudiante', highlight: 'Paie ses frais de scolarité' },
  { name: 'Jean-Pierre M.', role: 'Auteur & Conférencier', text: 'J\'ai publié 12 e-books sur Siteviral. Avec le programme ambassadeur, mes lecteurs deviennent mes promoteurs. Les ventes se multiplient sans effort.', flag: '🇨🇩', category: 'Auteur', highlight: '12 e-books publiés' },
  { name: 'Aïcha B.', role: 'Présidente d\'association', text: 'Notre association de la diaspora collecte désormais les cotisations mensuelles en ligne. Fini les virements Western Union et le suivi sur papier.', flag: '🇫🇷', category: 'Diaspora', highlight: 'Cotisations 100% en ligne' },
];

const categories = ['Tous', 'Église', 'ONG', 'Formatrice', 'Créatrice', 'Ambassadeur', 'Étudiante', 'Auteur', 'Organisation', 'Diaspora'];

export default function TemoignagesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Tous');

  const filtered = activeCategory === 'Tous' ? testimonials : testimonials.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Témoignages — Ils utilisent Siteviral et ça change tout"
        description="Découvrez comment des pasteurs, coachs, ONG, étudiants et créateurs transforment leur impact grâce à Siteviral."
        canonicalUrl="https://siteviral.com/temoignages"
      />
      <LandingNav />

      {/* Hero */}
      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-16 sm:pt-32 text-center space-y-5">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border">⭐ Témoignages</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Ils ont <span className="text-primary">transformé leur impact</span> avec Siteviral
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pasteurs, coachs, ONG, étudiants, créateurs — découvrez comment ils utilisent Siteviral pour monétiser, collecter et partager.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <section className="sticky top-14 z-20 bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container max-w-5xl px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="relative p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <Quote className="h-8 w-8 text-primary/10 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{t.flag}</span>
                  <div>
                    <p className="font-bold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                {t.highlight && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full mb-3 bg-primary/10 text-primary border-0">
                    {t.highlight}
                  </Badge>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed italic">« {t.text} »</p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-accent fill-accent" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold">Rejoignez-les</h2>
          <p className="text-primary-foreground/80">
            Créez votre plateforme gratuitement et commencez à transformer votre impact dès aujourd'hui.
          </p>
          <Button size="lg" variant="secondary" className="px-10 h-13 text-base gap-2 group" onClick={() => navigate('/auth?mode=signup')}>
            Commencer gratuitement <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
