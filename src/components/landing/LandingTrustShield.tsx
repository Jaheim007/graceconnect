import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, Fingerprint, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Repositioned as digital-creator protection. Real features only.
 */
export function LandingTrustShield() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const features = isFr ? [
    { icon: Lock, label: 'Watermark intelligent', desc: "Email de l'acheteur en diagonale sur chaque document." },
    { icon: Eye, label: 'Prévisualisation sécurisée', desc: 'Aperçu flou — pas de téléchargement avant achat.' },
    { icon: Fingerprint, label: 'Hash forensique', desc: 'Chaque copie est unique et traçable.' },
    { icon: Shield, label: 'Anti-piratage actif', desc: 'Logs de téléchargement + signalement intégré.' },
  ] : [
    { icon: Lock, label: 'Smart watermark', desc: "Buyer's email stamped diagonally on every document." },
    { icon: Eye, label: 'Secure preview', desc: 'Blurred preview — no download before purchase.' },
    { icon: Fingerprint, label: 'Forensic hash', desc: 'Every copy is unique and traceable.' },
    { icon: Shield, label: 'Active anti-piracy', desc: 'Download logs + built-in reporting.' },
  ];

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 items-start">
          <div>
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 mb-5">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-2">
              {isFr ? 'Créateurs digitaux' : 'Digital creators'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isFr ? 'Conçu pour protéger les créateurs digitaux' : 'Built to protect digital creators'}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
              {isFr
                ? 'Vendez ebooks, documents et ressources digitales avec prévisualisation sécurisée, watermarking individualisé, traçabilité et outils anti-piratage.'
                : 'Sell ebooks, documents and digital resources with secure previews, individualised watermarking, traceability and anti-piracy tools.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild className="h-10 px-4 font-semibold gap-1.5">
                <Link to="/discover?type=digital">
                  {isFr ? 'Explorer les produits digitaux' : 'Explore digital products'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 px-4 font-semibold">
                <Link to="/start?activity=digital">
                  {isFr ? 'Vendre des produits digitaux' : 'Sell digital products'}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.label} className="flex gap-3 rounded-2xl border border-border/70 bg-background p-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
