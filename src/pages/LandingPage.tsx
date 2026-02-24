import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Play, Heart, Users, ShoppingBag, Globe,
  CheckCircle, Zap, Shield, Quote,
  Smartphone, BarChart3, Megaphone, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import heroImg from '@/assets/landing-hero.jpg';
import communityImg from '@/assets/landing-community.png';
import devicesImg from '@/assets/landing-devices.jpg';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { TestimonialCarousel } from '@/components/landing/TestimonialCarousel';
import { Marquee } from '@/components/landing/Marquee';
import { SEOHead } from '@/components/seo/SEOHead';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const features = [
    { icon: Play, title: t('landing.feat_media'), desc: t('landing.feat_media_desc') },
    { icon: Heart, title: t('landing.feat_fundraising'), desc: t('landing.feat_fundraising_desc') },
    { icon: ShoppingBag, title: t('landing.feat_store'), desc: t('landing.feat_store_desc') },
    { icon: Users, title: t('landing.feat_community'), desc: t('landing.feat_community_desc') },
    { icon: BarChart3, title: t('landing.feat_analytics'), desc: t('landing.feat_analytics_desc') },
    { icon: Zap, title: t('landing.feat_affiliate'), desc: t('landing.feat_affiliate_desc') },
  ];

  const testimonials = [
    { name: 'K. M.', role: t('landing.test1_role'), text: t('landing.test1_text'), flag: '🇳🇬' },
    { name: 'Marie-Claire B.', role: t('landing.test2_role'), text: t('landing.test2_text'), flag: '🇨🇲' },
    { name: 'Ibrahim T.', role: t('landing.test3_role'), text: t('landing.test3_text'), flag: '🇸🇳' },
    { name: 'Amara D.', role: 'Digital Creator', text: 'En 2 mois, j\'ai vendu plus de 500 ressources numériques. Les paiements sont automatiques et les retraits rapides.', flag: '🇨🇮' },
    { name: 'Sophie N.', role: 'Community Leader', text: 'La gestion de notre communauté de 2000 membres est devenue simple. Contenu, dons, événements : tout est centralisé.', flag: '🇧🇯' },
    { name: 'David K.', role: 'NGO Director', text: 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic.', flag: '🇬🇭' },
  ];

  const steps = [
    { num: '01', title: t('landing.step1_title'), desc: t('landing.step1_desc'), icon: Smartphone },
    { num: '02', title: t('landing.step2_title'), desc: t('landing.step2_desc'), icon: Globe },
    { num: '03', title: t('landing.step3_title'), desc: t('landing.step3_desc'), icon: BarChart3 },
  ];

  const plans = [
    { name: t('plan.free'), price: '$0', period: '', features: [t('plan.free_f1'), t('plan.free_f2'), t('plan.free_f3'), t('plan.free_f4')], cta: t('plan.get_started') },
    { name: t('plan.pro'), price: '$29', period: '/mo', features: [t('plan.pro_f1'), t('plan.pro_f2'), t('plan.pro_f3'), t('plan.pro_f4'), t('plan.pro_f5')], highlight: true, cta: t('plan.start_trial') },
    { name: t('plan.enterprise'), price: 'Custom', period: '', features: [t('plan.ent_f1'), t('plan.ent_f2'), t('plan.ent_f3'), t('plan.ent_f4'), t('plan.ent_f5')], cta: t('plan.contact') },
  ];

  const marqueeRow1 = ['E-books', 'Formations', 'Templates', 'Podcasts', 'Vidéos', 'Guides', 'Coaching', 'Webinaires', 'Photos', 'Musique'];
  const marqueeRow2 = ['Cours en ligne', 'Mentorat', 'Newsletters', 'Fichiers PDF', 'Illustrations', 'Plugins', 'Scripts', 'Presets', 'Tutoriels', 'Plans'];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="Siteviral — Infrastructure Platform for Digital Platforms"
        description="Manage your community, sell digital products, collect donations and grow your impact worldwide."
        canonicalUrl="https://siteviral.com"
      />
      <LandingNav />

      {/* ─── Hero ─── */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background" />
        </div>
        <div className="relative z-10 container max-w-5xl px-4 pt-24 pb-32 sm:pt-32 sm:pb-40">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center space-y-8">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border bg-card/50 text-muted-foreground gap-1.5">
                {t('landing.badge')}
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
              {t('landing.hero_title_1')}<br /><span className="text-primary">{t('landing.hero_title_2')}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('landing.hero_desc')}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" className="px-8 gap-2 h-13 text-base w-full sm:w-auto" onClick={() => navigate('/auth?mode=signup')}>
                {t('landing.cta_free')} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-13 px-8 gap-2 text-base w-full sm:w-auto" onClick={() => navigate('/about')}>
                {t('landing.cta_learn')}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Giant Animated Counters ─── */}
      <section className="py-16 px-4 border-b border-border/40">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatedCounter value={500} suffix="+" label="Plateformes actives" />
            <AnimatedCounter value={50000} suffix="+" label="Membres connectés" />
            <AnimatedCounter value={150} suffix="+" label="Pays couverts" />
            <AnimatedCounter value={1000000} prefix="$" suffix="+" label="Reversés aux créateurs" />
          </div>
        </div>
      </section>

      {/* ─── Auto-Scrolling Testimonials ─── */}
      <section className="py-20 px-4 overflow-hidden">
        <div className="container max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">{t('landing.testimonials_badge')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              {t('landing.testimonials_title_1')} <span className="text-primary">{t('landing.testimonials_title_2')}</span>
            </h2>
          </motion.div>
        </div>
        <TestimonialCarousel
          testimonials={testimonials}
          statCard={{ value: '+$1M', label: 'Reversés aux créateurs' }}
        />
      </section>

      {/* ─── How it works ─── */}
      <section className="py-28 px-4">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">{t('landing.how_badge')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              {t('landing.how_title_1')} <span className="text-primary">{t('landing.how_title_2')}</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.08 }} className="relative group">
                {i < steps.length - 1 && <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />}
                <div className="bg-card rounded-2xl border border-border p-8 space-y-4 hover:border-primary/20 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center"><s.icon className="h-6 w-6 text-primary-foreground" /></div>
                    <span className="text-4xl font-black text-muted-foreground/15">{s.num}</span>
                  </div>
                  <h3 className="text-lg font-bold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Community image section ─── */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-6">
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">{t('landing.connect_badge')}</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                {t('landing.connect_title_1')}{' '}<span className="text-primary">{t('landing.connect_title_2')}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">{t('landing.connect_desc')}</p>
              <ul className="space-y-3">
                {[t('landing.connect_1'), t('landing.connect_2'), t('landing.connect_3')].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><CheckCircle className="h-3 w-3 text-primary" /></div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="gap-2 h-11 px-6" onClick={() => navigate('/auth?mode=signup')}>
                {t('landing.get_started')} <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="rounded-2xl overflow-hidden border border-border">
              <img src={communityImg} alt="Global community" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-28 px-4">
        <div className="container max-w-5xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">{t('landing.features_badge')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              {t('landing.features_title_1')} <span className="text-primary">{t('landing.features_title_2')}</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">{t('landing.features_sub')}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="group bg-card rounded-2xl border border-border p-8 hover:border-primary/20 transition-colors duration-200 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><f.icon className="h-5 w-5 text-primary" /></div>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate('/features')}>
              Voir toutes les fonctionnalités <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Marquee: What you can sell ─── */}
      <section className="py-20 px-4 bg-muted/30 overflow-hidden">
        <div className="container max-w-5xl mb-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Vendez tout ce que vous pouvez <span className="text-primary">imaginer</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Siteviral vous offre la flexibilité pour vendre tous types de produits numériques.</p>
          </motion.div>
        </div>
        <div className="space-y-4">
          <Marquee items={marqueeRow1} direction="left" speed={35} />
          <Marquee items={marqueeRow2} direction="right" speed={40} />
        </div>
      </section>

      {/* ─── Devices / PWA ─── */}
      <section className="py-24 px-4">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="order-2 md:order-1 rounded-2xl overflow-hidden border border-border">
              <img src={devicesImg} alt="Accessible on all devices" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.1 }} className="order-1 md:order-2 space-y-6">
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">{t('landing.pwa_badge')}</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                {t('landing.pwa_title_1')}{' '}<span className="text-primary">{t('landing.pwa_title_2')}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">{t('landing.pwa_desc')}</p>
              <ul className="space-y-3">
                {[
                  { text: t('landing.pwa_1'), icon: Smartphone },
                  { text: t('landing.pwa_2'), icon: Globe },
                  { text: t('landing.pwa_3'), icon: Megaphone },
                  { text: t('landing.pwa_4'), icon: Zap },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><item.icon className="h-3 w-3 text-primary" /></div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-28 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">{t('landing.pricing_badge')}</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              {t('landing.pricing_title_1')} <span className="text-primary">{t('landing.pricing_title_2')}</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{t('landing.pricing_desc')}</p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={fadeUp} className={`rounded-2xl p-8 border text-left transition-all duration-200 ${plan.highlight ? 'border-primary bg-primary/5 ring-1 ring-primary/20 relative' : 'border-border bg-card'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground border-0 text-[10px] px-3">{t('landing.popular')}</Badge>
                  </div>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${plan.highlight ? 'text-primary' : ''}`}>{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6 h-11" variant={plan.highlight ? 'default' : 'outline'} onClick={() => navigate('/auth?mode=signup')}>
                  {plan.cta} <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Trust / Security ─── */}
      <section className="py-24 px-4">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><Shield className="h-7 w-7 text-primary" /></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">{t('landing.security_title')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">{t('landing.security_desc')}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              {['SSL Encryption', 'Paystack Certified', 'GDPR Compliant'].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 border border-border">
                  <CheckCircle className="h-3 w-3 text-primary" /> {badge}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-28 px-4">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-primary" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="relative z-10 p-8 sm:p-14 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground leading-tight">{t('landing.cta_title')}</h2>
              <p className="text-primary-foreground/70 max-w-md mx-auto">{t('landing.cta_desc')}</p>
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 border-0 px-8 h-13 text-base gap-2 shadow-elevated" onClick={() => navigate('/auth?mode=signup')}>
                {t('landing.cta_free')} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
