import LegalPageShell from '@/components/layout/LegalPageShell';
import { Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompliancePage() {
  return (
    <LegalPageShell>
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center shadow-gold">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Conformité & Sécurité</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Comment Siteviral protège vos données et respecte les réglementations</p>

      <div className="space-y-8 text-foreground text-[15px] sm:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-extrabold mb-3">Entité juridique</h2>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-semibold">Hacktualiz Inc.</p>
            <p className="text-muted-foreground text-sm mt-1">
              Delaware C-Corporation, registered in the State of Delaware (USA).<br />
              131 Continental Dr, Suite 305, Newark, DE 19713, United States.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">Cadre réglementaire</h2>
          <div className="space-y-3">
            {[
              { title: 'AML / KYC', desc: 'Vérification d\'identité obligatoire pour les organisations recevant des paiements. Surveillance des transactions et gel des fonds en cas de suspicion.' },
              { title: 'RGPD (Union Européenne)', desc: 'Protection des données personnelles des utilisateurs européens. Droit d\'accès, rectification, suppression et portabilité.' },
              { title: 'US Privacy Laws', desc: 'Conformité avec les réglementations fédérales et étatiques américaines en matière de protection des données.' },
              { title: 'PCI-DSS', desc: 'Les paiements sont traités par Paystack, certifié PCI-DSS Level 1, garantissant la sécurité des transactions.' },
              { title: 'Sanctions (OFAC / UE)', desc: 'Conformité avec les programmes de sanctions internationaux. Interdiction de servir des entités ou pays sous embargo.' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-muted-foreground text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">Mesures de sécurité</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Chiffrement SSL/TLS sur toutes les communications',
              'Row Level Security (RLS) sur toutes les tables de données',
              'Vérification KYC multi-niveaux pour les organisations',
              'Détection de fraude automatique',
              'Audit trail permanent sur toutes les actions sensibles',
              'Isolation des données par organisation (multi-tenant)',
              'Validation côté serveur de tous les paiements',
              'Webhooks Paystack signés (HMAC SHA-512)',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm bg-card border border-border rounded-lg p-3">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">Documentation complète</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: 'Politique AML', to: '/aml' },
              { label: 'Politique de Confidentialité', to: '/privacy' },
              { label: 'DPA (Data Processing Agreement)', to: '/dpa' },
              { label: 'Sécurité', to: '/security' },
              { label: 'Sous-traitants', to: '/subprocessors' },
              { label: 'Usage Acceptable', to: '/acceptable-use' },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="bg-card border border-border rounded-lg p-3 text-sm font-semibold text-primary hover:bg-muted/50 transition-colors">
                {link.label} →
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">Contact Conformité</h2>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">
              Pour toute question relative à la conformité, la sécurité ou la protection des données :
            </p>
            <p className="font-semibold text-sm mt-2">
              Email : <a href="mailto:compliance@siteviral.com" className="text-primary">compliance@siteviral.com</a>
            </p>
          </div>
        </section>
      </div>
    </LegalPageShell>
  );
}
