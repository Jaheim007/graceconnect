import React, { useState } from 'react';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Quote, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

interface Testimonial { name: string; role: string; text: string; flag: string; category: string; highlight?: string; rating?: number; }

const STATIC_TESTIMONIALS: Testimonial[] = [
  { name: 'Pasteur K. M.', role: 'Leader communautaire', text: 'En une semaine, notre communauté a pu offrir plus de 200 prédications audio. Les dons arrivent aussi par Mobile Money.', flag: '🇳🇬', category: 'Église', highlight: '200 prédications en 1 semaine' },
  { name: 'Marie-Claire B.', role: 'Coach & Auteure', text: 'J\'ai centralisé tous mes documents et ressources sur une seule plateforme. Mes clients achètent et téléchargent en un clic.', flag: '🇨🇲', category: 'Formatrice', highlight: 'Ventes 100% automatisées' },
  { name: 'Ibrahim T.', role: 'Ambassadeur Siteviral', text: 'Je n\'ai aucun contenu à moi. Je partage les ressources des autres et je gagne des commissions chaque semaine.', flag: '🇸🇳', category: 'Ambassadeur', highlight: 'Commissions chaque semaine' },
  { name: 'Amara D.', role: 'Créatrice digitale', text: 'En 2 mois, j\'ai vendu plus de 500 ressources numériques. Les paiements sont automatiques.', flag: '🇨🇮', category: 'Créatrice', highlight: '500 ventes en 2 mois' },
  { name: 'David K.', role: 'Directeur ONG', text: 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic.', flag: '🇬🇭', category: 'ONG', highlight: '3x plus de fonds levés' },
  { name: 'Fatou S.', role: 'Étudiante ambassadrice', text: 'Je partage des cours et des e-books sur mes groupes WhatsApp et je touche entre 10% et 30% de commission.', flag: '🇸🇳', category: 'Étudiante', highlight: 'Paie ses frais de scolarité' },
];

export default function TemoignagesPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [activeCategory, setActiveCategory] = useState(isFr ? 'Tous' : 'All');

  const { data: dbTestimonials, isLoading } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: async () => {
      const { data } = await db.from('testimonials').select('*').eq('is_approved', true).order('created_at', { ascending: false });
      return (data || []).map((t: any) => ({
        name: t.name, role: t.role || '', text: t.text, flag: t.flag || '🌍',
        category: t.category || (isFr ? 'Général' : 'General'), highlight: t.highlight, rating: t.rating,
      }));
    },
    staleTime: 5 * 60_000,
  });

  const testimonials: Testimonial[] = (dbTestimonials && dbTestimonials.length > 0) ? dbTestimonials : STATIC_TESTIMONIALS;
  const allLabel = isFr ? 'Tous' : 'All';
  const categories = [allLabel, ...Array.from(new Set(testimonials.map(t => t.category)))];
  const filtered = activeCategory === allLabel ? testimonials : testimonials.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Témoignages — Ils utilisent Siteviral et ça change tout' : 'Testimonials — They use Siteviral and it changes everything'}
        description={isFr ? 'Découvrez comment des pasteurs, coachs, ONG, étudiants et créateurs transforment leur impact grâce à Siteviral.' : 'Discover how pastors, coaches, NGOs, students and creators transform their impact with Siteviral.'}
        canonicalUrl="https://siteviral.com/temoignages"
      />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-4xl px-4 pt-24 pb-16 sm:pt-32 text-center space-y-5">
          <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border">{isFr ? '⭐ Témoignages' : '⭐ Testimonials'}</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            {isFr ? <>Ils ont <span className="text-primary">transformé leur impact</span> avec Siteviral</> : <>They <span className="text-primary">transformed their impact</span> with Siteviral</>}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isFr ? 'Pasteurs, coachs, ONG, étudiants, créateurs — découvrez comment ils utilisent Siteviral.' : 'Pastors, coaches, NGOs, students, creators — discover how they use Siteviral.'}
          </p>
        </div>
      </section>

      <section className="sticky top-14 z-20 bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="container max-w-5xl px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>{cat}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          <motion.div initial="hidden" animate="visible" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t, i) => (
              <motion.div key={t.name + i} variants={fadeUp} className="relative p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors group">
                <Quote className="h-8 w-8 text-primary/10 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{t.flag}</span>
                  <div><p className="font-bold text-sm">{t.name}</p><p className="text-xs text-muted-foreground">{t.role}</p></div>
                </div>
                {t.highlight && <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full mb-3 bg-primary/10 text-primary border-0">{t.highlight}</Badge>}
                <p className="text-sm text-muted-foreground leading-relaxed italic">« {t.text} »</p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(t.rating || 5)].map((_, j) => (<Star key={j} className="h-3.5 w-3.5 text-accent fill-accent" />))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold">{isFr ? 'Rejoignez-les' : 'Join them'}</h2>
          <p className="text-primary-foreground/80">{isFr ? 'Créez votre plateforme gratuitement et commencez à transformer votre impact dès aujourd\'hui.' : 'Create your platform for free and start transforming your impact today.'}</p>
          <Button size="lg" variant="secondary" className="px-10 h-13 text-base gap-2 group" onClick={() => navigate('/auth?mode=signup')}>
            {isFr ? 'Commencer gratuitement' : 'Get started for free'} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
