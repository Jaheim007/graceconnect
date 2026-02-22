import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Users, Globe, Shield, Target, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import communityImg from '@/assets/landing-community.png';
import heroImg from '@/assets/landing-hero.jpg';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const values = [
  { icon: Heart, title: 'Impact', desc: 'Nous croyons que la technologie doit servir les organisations pour amplifier leur mission.' },
  { icon: Users, title: 'Communauté', desc: 'Chaque fonctionnalité est pensée pour renforcer les liens entre leaders et membres.' },
  { icon: Shield, title: 'Confiance', desc: 'Sécurité des données, transparence financière et conformité aux lois ivoiriennes.' },
  { icon: Globe, title: 'Accessibilité', desc: 'Une plateforme accessible depuis n\'importe quel appareil, partout dans le monde.' },
];

const team = [
  { role: 'Vision & Produit', desc: 'Concevoir la plateforme idéale pour les communautés africaines.' },
  { role: 'Ingénierie', desc: 'Bâtir une infrastructure fiable, rapide et évolutive.' },
  { role: 'Communauté', desc: 'Accompagner chaque organisation dans sa croissance digitale.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/">
            <span className="text-xl font-extrabold tracking-tight italic text-gold">Siteviral</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/auth">Connexion</Link></Button>
            <Button size="sm" className="gold-gradient text-primary-foreground border-0 shadow-gold" asChild>
              <Link to="/auth?tab=signup">Commencer</Link>
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
              Notre mission :{' '}
              <span className="text-gold italic">connecter les organisations et leurs communautés.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Siteviral, opéré par HACKTUALIZ Inc. (Delaware, USA), est né d'une conviction simple : chaque organisation mérite
              des outils digitaux puissants, accessibles et adaptés à ses réalités. Nous construisons l'infrastructure
              qui rapproche leaders et membres, partout dans le monde.
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
                L'histoire derrière <span className="text-gold italic">Siteviral</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  En Côte d'Ivoire, des milliers d'organisations et associations s'appuient encore
                  sur des outils fragmentés — WhatsApp pour la communication, Facebook pour les vidéos,
                  et des transferts manuels pour les dons.
                </p>
                <p>
                  Siteviral réunit tout cela en une seule plateforme : médiathèque, collecte de fonds,
                  boutique digitale, gestion des membres et programme d'affiliation. Le tout pensé pour
                  le contexte africain, avec des paiements via Mobile Money et Paystack.
                </p>
                <p>
                  Notre ambition : devenir la référence digitale des organisations et leaders en Afrique francophone,
                  puis au-delà.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl overflow-hidden shadow-elevated border border-border/40"
            >
              <img src={communityImg} alt="Communauté unie" className="w-full h-auto object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Nos valeurs</h2>
            <p className="text-muted-foreground">Ce qui guide chacune de nos décisions.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-3 text-center"
              >
                <div className="h-10 w-10 mx-auto rounded-xl gold-gradient flex items-center justify-center shadow-gold">
                  <v.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission targets */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Pour qui est Siteviral ?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Target, title: 'Organisations', desc: 'Gérez votre communauté, partagez vos contenus et collectez des dons en ligne.' },
              { icon: Zap, title: 'Leaders & Créateurs', desc: 'Créez votre page, vendez vos formations et développez votre audience.' },
              { icon: Users, title: 'ONG & Associations', desc: 'Lancez des campagnes de collecte et fédérez votre communauté autour de votre mission.' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-3"
              >
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">Notre équipe</h2>
            <p className="text-muted-foreground">Une équipe passionnée, basée à Abidjan.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {team.map((t, i) => (
              <motion.div
                key={t.role}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card text-center space-y-2"
              >
                <div className="h-12 w-12 mx-auto rounded-full gold-gradient flex items-center justify-center shadow-gold">
                  <span className="text-sm font-bold text-primary-foreground">{t.role.charAt(0)}</span>
                </div>
                <h3 className="font-semibold text-sm">{t.role}</h3>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container max-w-2xl text-center">
          <div className="bg-card rounded-3xl border border-primary/20 p-8 sm:p-10 shadow-elevated space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold">Rejoignez le mouvement</h2>
            <p className="text-muted-foreground">
              Des centaines de communautés utilisent déjà Siteviral. C'est votre tour.
            </p>
            <Button
              size="lg"
              className="gold-gradient text-primary-foreground border-0 shadow-gold px-10 h-12 gap-2 w-full sm:w-auto"
              asChild
            >
              <Link to="/auth?tab=signup">
                Créez votre communauté <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20">
        <div className="container px-4 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="text-xl font-extrabold italic text-gold">Siteviral</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                La plateforme tout-en-un pour les leaders et organisations en Afrique.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/discover" className="hover:text-foreground transition-colors">Découvrir</Link></li>
                <li><Link to="/auth?tab=signup" className="hover:text-foreground transition-colors">Créer une communauté</Link></li>
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Confidentialité</Link></li>
                <li><Link to="/aml" className="hover:text-foreground transition-colors">AML</Link></li>
                <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Remboursement</Link></li>
                <li><Link to="/payout-policy" className="hover:text-foreground transition-colors">Retraits</Link></li>
                <li><Link to="/acceptable-use" className="hover:text-foreground transition-colors">Usage acceptable</Link></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Entreprise</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>contact@siteviral.com</li>
                <li className="text-[11px]">Operated by HACKTUALIZ Inc.<br/>Delaware, USA</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Siteviral — Operated by HACKTUALIZ Inc.</span>
            <span>Infrastructure Platform for Digital Organizations</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
