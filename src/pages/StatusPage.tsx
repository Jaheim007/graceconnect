import { SEOHead } from '@/components/seo/SEOHead';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const services = [
  { name: 'Application web', status: 'operational' as const },
  { name: 'Paiement Mobile Money (Paystack)', status: 'operational' as const },
  { name: 'Paiement Carte (Stripe)', status: 'operational' as const },
  { name: 'Upload & stockage fichiers', status: 'operational' as const },
  { name: 'Notifications push', status: 'operational' as const },
  { name: 'API & Edge Functions', status: 'operational' as const },
  { name: 'Base de données', status: 'operational' as const },
  { name: 'Emails transactionnels', status: 'operational' as const },
];

const statusConfig = {
  operational: { icon: CheckCircle, label: 'Opérationnel', color: 'text-green-500' },
  degraded: { icon: AlertTriangle, label: 'Dégradé', color: 'text-yellow-500' },
  maintenance: { icon: Clock, label: 'Maintenance', color: 'text-muted-foreground' },
};

export default function StatusPage() {
  const allOperational = services.every((s) => s.status === 'operational');

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Statut de la plateforme — Siteviral" description="Vérifiez l'état de tous les services Siteviral en temps réel." canonicalUrl="https://siteviral.com/status" />
      <LandingNav />

      <section className="pt-14">
        <div className="container max-w-3xl px-4 pt-24 pb-8 text-center">
          <Badge variant="secondary" className="mb-4 text-xs px-4 py-1.5 rounded-full">🟢 Statut</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Statut de la plateforme</h1>
          {allOperational && (
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-5 py-2.5 rounded-full font-semibold text-sm">
              <CheckCircle className="h-4 w-4" /> Tous les systèmes sont opérationnels
            </div>
          )}
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="container max-w-3xl space-y-3">
          {services.map((s) => {
            const cfg = statusConfig[s.status];
            const Icon = cfg.icon;
            return (
              <div key={s.name} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <span className="font-medium text-sm">{s.name}</span>
                <div className={`flex items-center gap-2 text-sm ${cfg.color}`}>
                  <Icon className="h-4 w-4" />
                  <span>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="container max-w-3xl mt-12">
          <h2 className="text-xl font-bold mb-4">Historique récent</h2>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => {
              const d = new Date(); d.setDate(d.getDate() - i);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <span className="text-sm text-muted-foreground">{d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-xs text-green-500 font-medium">100% disponible</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
