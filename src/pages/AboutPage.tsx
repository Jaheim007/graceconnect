import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Users, Globe, Shield, Target, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalFooter } from '@/components/layout/LegalPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import communityImg from '@/assets/landing-community.png';
import heroImg from '@/assets/landing-hero.jpg';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

export default function AboutPage() {
  const { t } = useI18n();

  const values = [
    { icon: Heart, title: t('about.val_impact'), desc: t('about.val_impact_desc') },
    { icon: Users, title: t('about.val_community'), desc: t('about.val_community_desc') },
    { icon: Shield, title: t('about.val_trust'), desc: t('about.val_trust_desc') },
    { icon: Globe, title: t('about.val_access'), desc: t('about.val_access_desc') },
  ];

  const team = [
    { role: t('about.team_vision'), desc: t('about.team_vision_desc') },
    { role: t('about.team_engineering'), desc: t('about.team_engineering_desc') },
    { role: t('about.team_community'), desc: t('about.team_community_desc') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t('about.hero_title') + ' — Siteviral'} description="Siteviral — Infrastructure platform for digital organizations in Africa and beyond." />
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/">
            <span className="text-xl font-extrabold tracking-tight italic text-primary">Siteviral</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/auth">{t('about.sign_in')}</Link></Button>
            <Button size="sm" className="bg-primary text-primary-foreground" asChild>
              <Link to="/auth?tab=signup">{t('about.get_started')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
        </div>
        <div className="relative z-10 container max-w-4xl px-4 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }} className="space-y-5">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
              {t('about.hero_title')}{' '}
              <span className="text-primary italic">{t('about.hero_title_accent')}</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('about.hero_desc')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.5 }}>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                {t('about.story_title')} <span className="text-primary italic">Siteviral</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{t('about.story_p1')}</p>
                <p>{t('about.story_p2')}</p>
                <p>{t('about.story_p3')}</p>
              </div>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl overflow-hidden shadow-elevated border border-border/40"
            >
              <img src={communityImg} alt="Community" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('about.values_title')}</h2>
            <p className="text-muted-foreground">{t('about.values_desc')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <motion.div key={v.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-3 text-center">
                <div className="h-10 w-10 mx-auto rounded-xl bg-primary flex items-center justify-center">
                  <v.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('about.who_title')}</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Target, title: t('about.who_orgs'), desc: t('about.who_orgs_desc') },
              { icon: Zap, title: t('about.who_leaders'), desc: t('about.who_leaders_desc') },
              { icon: Users, title: t('about.who_ngos'), desc: t('about.who_ngos_desc') },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">{t('about.team_title')}</h2>
            <p className="text-muted-foreground">{t('about.team_desc')}</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {team.map((tm, i) => (
              <motion.div key={tm.role} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card text-center space-y-2">
                <div className="h-12 w-12 mx-auto rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">{tm.role.charAt(0)}</span>
                </div>
                <h3 className="font-semibold text-sm">{tm.role}</h3>
                <p className="text-xs text-muted-foreground">{tm.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl text-center">
          <div className="bg-card rounded-3xl border border-primary/20 p-8 sm:p-10 shadow-elevated space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('about.cta_title')}</h2>
            <p className="text-muted-foreground">{t('about.cta_desc')}</p>
            <Button size="lg" className="bg-primary text-primary-foreground px-10 h-12 gap-2 w-full sm:w-auto" asChild>
              <Link to="/auth?tab=signup">
                {t('about.cta_button')} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
