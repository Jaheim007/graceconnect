import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LandingNav } from './LandingNav';
import { LandingFooter } from './LandingFooter';
import { SEOHead } from '@/components/seo/SEOHead';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { InternalLinksSection } from './InternalLinksSection';
import { PlatformStatsBar } from './PlatformStatsBar';
import { useI18n } from '@/i18n/I18nContext';

export interface PersonaLandingProps {
  seo: { title: string; description: string; url: string };
  badge: string;
  headline: ReactNode;
  subheadline: ReactNode;
  painPoints: { icon: string; title: string; desc: string }[];
  solutions: { title: string; desc: string }[];
  steps: { step: string; title: string; desc: string }[];
  testimonial?: { name: string; role: string; text: string; flag: string };
  stats: { value: string; label: string }[];
  faq: { q: string; a: string }[];
  cta: { label: string; path: string };
  secondaryCta?: { label: string; path: string };
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function PersonaLandingPage(props: PersonaLandingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead title={props.seo.title} description={props.seo.description} canonicalUrl={props.seo.url} />
      <LandingNav />

      {/* Hero */}
      <section className="relative pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 container max-w-4xl px-4 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center space-y-6">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border">
                {props.badge}
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
              {props.headline}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {props.subheadline}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" className="px-8 gap-2 h-13 text-base w-full sm:w-auto group cta-glow" onClick={() => navigate(props.cta.path)}>
                {props.cta.label} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              {props.secondaryCta && (
                <Button size="lg" variant="outline" className="h-13 px-8 text-base w-full sm:w-auto" onClick={() => navigate(props.secondaryCta!.path)}>
                  {props.secondaryCta.label}
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container max-w-4xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {props.stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Live platform stats */}
          <PlatformStatsBar />
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-4">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <Badge variant="outline" className="mb-4 text-xs px-3 py-1 rounded-full">{isFr ? 'Le problème' : 'The problem'}</Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold">
                {isFr ? (
                  <>Vous vous <span className="text-destructive">reconnaissez</span> ?</>
                ) : (
                  <>Does this <span className="text-destructive">sound familiar</span>?</>
                )}
              </h2>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {props.painPoints.map((p) => (
              <motion.div key={p.title} variants={fadeUp} className="p-6 rounded-2xl border border-border bg-card hover:border-destructive/30 transition-colors">
                <span className="text-3xl mb-3 block">{p.icon}</span>
                <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">{isFr ? 'La solution' : 'The solution'}</Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold">
                {isFr ? (
                  <>Siteviral fait tout ça <span className="text-primary">pour vous</span></>
                ) : (
                  <>Siteviral does it all <span className="text-primary">for you</span></>
                )}
              </h2>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 gap-5">
            {props.solutions.map((s, i) => (
              <motion.div key={s.title} variants={fadeUp} className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">{isFr ? 'Comment ça marche' : 'How it works'}</Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold">
                {isFr ? (
                  <>Prêt en <span className="text-accent">3 étapes</span></>
                ) : (
                  <>Ready in <span className="text-accent">3 steps</span></>
                )}
              </h2>
            </motion.div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
            {props.steps.map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} className="flex items-start gap-5 p-6 rounded-2xl border border-border bg-card">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-extrabold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonial */}
      {props.testimonial && (
        <section className="py-20 px-4 bg-muted/30">
          <div className="container max-w-3xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative p-8 sm:p-12 rounded-3xl border border-border bg-card text-center">
              <span className="text-5xl mb-4 block">{props.testimonial.flag}</span>
              <blockquote className="text-base sm:text-lg font-medium leading-relaxed mb-6 italic">
                « {props.testimonial.text} »
              </blockquote>
              <p className="font-bold text-sm">{props.testimonial.name}</p>
              <p className="text-xs text-muted-foreground">{props.testimonial.role}</p>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">FAQ</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{isFr ? 'Questions fréquentes' : 'Frequently asked questions'}</h2>
          </motion.div>
          <Accordion type="single" collapsible className="space-y-3">
            {props.faq.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 bg-card">
                <AccordionTrigger className="text-sm font-medium text-left py-4">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container max-w-3xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold">{isFr ? 'Prêt à commencer ?' : 'Ready to get started?'}</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            {isFr
              ? "Créez votre plateforme gratuitement en moins de 2 minutes. Pas d'abonnement, pas de carte requise."
              : 'Create your platform for free in under 2 minutes. No subscription, no credit card required.'}
          </p>
          <Button size="lg" variant="secondary" className="px-10 h-13 text-base gap-2 group" onClick={() => navigate(props.cta.path)}>
            {props.cta.label} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <InternalLinksSection currentPath={location.pathname} maxLinks={6} />

      <LandingFooter />
    </div>
  );
}
