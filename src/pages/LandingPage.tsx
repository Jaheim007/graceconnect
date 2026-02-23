import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  ArrowRight, Play, Heart, Users, ShoppingBag, Globe,
  CheckCircle, Zap, Shield, Sun, Moon, Quote,
  Smartphone, BarChart3, BookOpen, Megaphone, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import heroImg from '@/assets/landing-hero.jpg';
import communityImg from '@/assets/landing-community.png';
import devicesImg from '@/assets/landing-devices.jpg';

/* ─── Data ─── */
const features = [
  { icon: Play, title: 'Media Library', desc: 'Share videos, music, podcasts, and live replays with your community.' },
  { icon: Heart, title: 'Fundraising', desc: 'Launch donation campaigns with real-time tracking and Paystack integration.' },
  { icon: ShoppingBag, title: 'Digital Store', desc: 'Sell ebooks, courses, and digital resources to your audience worldwide.' },
  { icon: Users, title: 'Community Management', desc: 'Manage members, roles, and affiliates from a single dashboard.' },
  { icon: BarChart3, title: 'Advanced Analytics', desc: 'Track performance with detailed metrics: revenue, members, engagement.' },
  { icon: Zap, title: 'Affiliate Program', desc: 'Let your members earn by promoting your products and campaigns.' },
];

const testimonials = [
  { name: 'K. M.', role: 'Community Leader', text: 'Siteviral transformed the way we reach our audience. Online donations increased by 300% in 3 months.' },
  { name: 'Marie-Claire B.', role: 'NGO Director', text: 'The digital store lets us sell our training programs worldwide. It\'s a game-changer for our organization.' },
  { name: 'Ibrahim T.', role: 'Cultural Association', text: 'Within a week, we had our community page, media library, and first active members.' },
];

const steps = [
  { num: '01', title: 'Create your account', desc: 'Free sign-up in 30 seconds with Google or email.', icon: Smartphone },
  { num: '02', title: 'Launch your organization', desc: 'Set up your page, add content, and invite your members.', icon: Globe },
  { num: '03', title: 'Monetize and grow', desc: 'Sell resources, collect donations, and track your results.', icon: BarChart3 },
];

const plans = [
  { name: 'Free', price: '$0', period: '', features: ['Community page', 'Media library', 'Basic donations', 'Up to 100 members'], cta: 'Get Started' },
  { name: 'Pro', price: '$29', period: '/mo', features: ['Everything in Free', 'Digital store', 'Affiliate program', 'Advanced analytics', 'Unlimited members'], highlight: true, cta: 'Start Free Trial' },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Custom domain', 'Priority support', 'API & integrations', 'SLA guarantee'], cta: 'Contact Us' },
];

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
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Nav ─── */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <span className="text-xl font-extrabold tracking-tight text-foreground">Siteviral</span>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex"><Link to="/about">About</Link></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=signin')} className="text-xs sm:text-sm px-2 sm:px-3">Sign in</Button>
            <Button
              size="sm"
              className="text-xs sm:text-sm px-3 sm:px-4"
              onClick={() => navigate('/auth?mode=signup')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-14 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/75 to-background" />
        </div>

        <div className="relative z-10 container max-w-5xl px-4 pt-24 pb-32 sm:pt-32 sm:pb-40">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center space-y-8"
          >
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="text-xs px-4 py-1.5 rounded-full border border-border bg-card/50 text-muted-foreground gap-1.5">
                Infrastructure for digital organizations
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight">
              Launch your organization
              <br />
              <span className="text-primary">in minutes.</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The all-in-one infrastructure to share content, collect donations,
              sell digital resources, and grow your organization.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="px-8 gap-2 h-13 text-base w-full sm:w-auto"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-13 px-8 gap-2 text-base w-full sm:w-auto"
                onClick={() => navigate('/about')}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-28 px-4">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Get started in <span className="text-primary">3 simple steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.08 }}
                className="relative group"
              >
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px border-t-2 border-dashed border-border" />
                )}
                <div className="bg-card rounded-2xl border border-border p-8 space-y-4 hover:border-primary/20 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                      <s.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
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
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-6"
            >
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">Connectivity</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Connect your members,{' '}
                <span className="text-primary">anywhere in the world.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                Whether your community is in Lagos, Paris, or New York, Siteviral keeps you connected.
                Share key moments, distribute content, and maintain engagement with every member.
              </p>
              <ul className="space-y-3">
                {['Real-time broadcasting', 'Smart push notifications', 'Unlimited multimedia content'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-3 w-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="gap-2 h-11 px-6"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden border border-border"
            >
              <img src={communityImg} alt="Global community" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-28 px-4">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Everything your organization <span className="text-primary">needs</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">One platform. Infinite possibilities.</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group bg-card rounded-2xl border border-border p-8 hover:border-primary/20 transition-colors duration-200 space-y-4"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Devices / PWA ─── */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              className="order-2 md:order-1 rounded-2xl overflow-hidden border border-border"
            >
              <img src={devicesImg} alt="Accessible on all devices" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="order-1 md:order-2 space-y-6"
            >
              <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">PWA Application</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                Accessible on{' '}
                <span className="text-primary">all your devices.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                Installable app directly from your browser. No app store download required.
              </p>
              <ul className="space-y-3">
                {[
                  { text: 'Installable app (PWA)', icon: Smartphone },
                  { text: 'Works offline', icon: Globe },
                  { text: 'Push notifications', icon: Megaphone },
                  { text: 'Ultra-fast loading', icon: Zap },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-3 w-3 text-primary" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-28 px-4">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Trusted by <span className="text-primary">organizations</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="bg-card rounded-2xl border border-border p-8 space-y-4 relative"
              >
                <Quote className="h-8 w-8 text-primary/10 absolute top-6 right-6" />
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="pt-2 border-t border-border/60">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-28 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Start free. <span className="text-primary">Scale as you grow.</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The free plan includes everything to get started. Upgrade to Pro when you're ready to grow.
            </p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-5"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                className={`rounded-2xl p-8 border text-left transition-all duration-200 ${
                  plan.highlight
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 relative'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground border-0 text-[10px] px-3">Popular</Badge>
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
                <Button
                  className="w-full mt-6 h-11"
                  variant={plan.highlight ? 'default' : 'outline'}
                  onClick={() => navigate('/auth?mode=signup')}
                >
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
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center space-y-4"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">Security & Trust</h2>
            <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Your data is protected with end-to-end encryption. Payments are secured through Paystack,
              a leading digital payments provider. GDPR compliant and meeting international standards.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              {['SSL Encryption', 'Paystack Certified', 'GDPR Compliant'].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 border border-border">
                  <CheckCircle className="h-3 w-3 text-primary" />
                  {badge}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-28 px-4">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />

            <div className="relative z-10 p-8 sm:p-14 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground leading-tight">
                Ready to launch your organization?
              </h2>
              <p className="text-primary-foreground/70 max-w-md mx-auto">
                Join organizations already using Siteviral to grow their digital presence and monetize their community.
              </p>
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 border-0 px-8 h-13 text-base gap-2 shadow-elevated"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-card/50">
        <div className="container px-4 py-14">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="space-y-3">
              <span className="text-xl font-extrabold text-foreground">Siteviral</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Infrastructure platform for digital organizations worldwide.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">Get Started</Link></li>
                <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/aml" className="hover:text-foreground transition-colors">AML Policy</Link></li>
                <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
                <li><Link to="/payout-policy" className="hover:text-foreground transition-colors">Payout Policy</Link></li>
                <li><Link to="/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link></li>
                <li><Link to="/dpa" className="hover:text-foreground transition-colors">DPA</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Trust</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/security" className="hover:text-foreground transition-colors">Security</Link></li>
                <li><Link to="/compliance" className="hover:text-foreground transition-colors">Compliance</Link></li>
                <li><Link to="/subprocessors" className="hover:text-foreground transition-colors">Subprocessors</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Hacktualiz Inc. All rights reserved.</span>
            <span>Infrastructure Platform for Digital Organizations</span>
          </div>
          <p className="mt-4 text-[10px] text-muted-foreground/60 text-center">
            Siteviral is operated by Hacktualiz Inc., a Delaware C-Corporation (USA).
            131 Continental Dr, Suite 305, Newark, DE 19713.
            Each organization owns its data. Hacktualiz Inc. acts as data processor in accordance with GDPR.
            For data-related requests, contact the relevant organization or{' '}
            <a href="mailto:privacy@siteviral.com" className="underline hover:text-foreground transition-colors">privacy@siteviral.com</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
