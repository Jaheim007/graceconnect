import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Heart, Users, ShoppingBag, Globe, CheckCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const features = [
  { icon: Play, title: 'Media Library', desc: 'Share sermons, music, podcasts and live replays with your community.' },
  { icon: Heart, title: 'Fundraising', desc: 'Run donation campaigns with real-time progress and Paystack integration.' },
  { icon: ShoppingBag, title: 'Digital Store', desc: 'Sell ebooks, courses, and resources to your congregation worldwide.' },
  { icon: Users, title: 'Community Hub', desc: 'Manage members, roles, and affiliates all in one place.' },
  { icon: Globe, title: 'Multi-Tenant', desc: 'Support hundreds of churches and ministries on one platform.' },
  { icon: Star, title: 'Affiliate Program', desc: 'Empower members to earn by promoting products and campaigns.' },
];

const stats = [
  { value: '10,000+', label: 'Members' },
  { value: '500+', label: 'Communities' },
  { value: '2M XOF', label: 'Donations raised' },
  { value: 'CI', label: 'Based in Côte d\'Ivoire' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center shadow-gold">
              <span className="text-sm font-bold text-primary-foreground">GC</span>
            </div>
            <span className="font-bold text-base">GraceConnect</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button
              size="sm"
              className="gold-gradient text-primary-foreground border-0 shadow-gold"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
              🌍 Built for African Faith Communities
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Grow your community.{' '}
              <span className="bg-clip-text text-transparent gold-gradient">
                Multiply your impact.
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              GraceConnect is the all-in-one platform for churches, ministries, and faith leaders
              to share content, raise funds, sell resources, and grow their community—starting in Côte d'Ivoire.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="gold-gradient text-primary-foreground border-0 shadow-gold px-8 gap-2 h-12"
                onClick={() => navigate('/auth?tab=signup')}
              >
                Start for Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 gap-2"
                onClick={() => navigate('/discover')}
              >
                <Play className="h-4 w-4" /> Browse Communities
              </Button>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14 rounded-2xl border border-border/60 overflow-hidden shadow-elevated hero-gradient p-6 sm:p-10"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-bold text-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything your community needs</h2>
            <p className="text-muted-foreground">One platform. Infinite possibilities.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-3"
              >
                <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center shadow-gold">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Start free. Scale as you grow.</h2>
          <p className="text-muted-foreground mb-8">
            Free plan includes a full community page, media library, and basic donations.
            Upgrade for advanced analytics, multi-admin, and custom branding.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'Free', price: '0 XOF', features: ['Community page', 'Media library', 'Basic donations'] },
              { name: 'Pro', price: '15,000 XOF/mo', features: ['Everything in Free', 'Digital store', 'Affiliate program'], highlight: true },
              { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Custom domain', 'Priority support'] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-5 border ${plan.highlight ? 'border-primary bg-primary/5 shadow-gold' : 'border-border bg-card shadow-card'}`}
              >
                <h3 className="font-bold text-base">{plan.name}</h3>
                <div className={`text-xl font-bold mt-1 ${plan.highlight ? 'text-primary' : ''}`}>{plan.price}</div>
                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 text-primary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl text-center">
          <div className="bg-card rounded-3xl border border-primary/20 p-10 shadow-elevated space-y-5">
            <h2 className="text-3xl font-bold">Ready to connect your community?</h2>
            <p className="text-muted-foreground">Join hundreds of faith communities already on GraceConnect.</p>
            <Button
              size="lg"
              className="gold-gradient text-primary-foreground border-0 shadow-gold px-10 h-12 gap-2"
              onClick={() => navigate('/auth?tab=signup')}
            >
              Create your community <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded gold-gradient" />
            <span>GraceConnect © 2025</span>
          </div>
          <span>Made with ❤️ for faith communities in Côte d'Ivoire</span>
        </div>
      </footer>
    </div>
  );
}
