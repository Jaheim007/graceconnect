import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';

const subprocessors = [
  {
    name: 'Supabase Inc.',
    purpose: 'Hébergement de base de données, authentification, stockage de fichiers, fonctions edge (calcul serverless)',
    location: 'États-Unis',
    website: 'https://supabase.com',
  },
  {
    name: 'Paystack (Stripe Inc.)',
    purpose: 'Traitement des paiements, vérification des transactions, versement des fonds',
    location: 'Nigeria / États-Unis',
    website: 'https://paystack.com',
  },
  {
    name: 'Resend Inc.',
    purpose: 'Envoi d\'e-mails transactionnels et de campagnes',
    location: 'États-Unis',
    website: 'https://resend.com',
  },
  {
    name: 'Sentry (Functional Software Inc.)',
    purpose: 'Surveillance des erreurs frontend et suivi des performances',
    location: 'États-Unis',
    website: 'https://sentry.io',
  },
];

export default function SubprocessorsPage() {
  return (
    <LegalPageShell>
      <SEOHead title="Sous-traitants ultérieurs — Siteviral" description="Liste des sous-traitants tiers utilisés par Siteviral. Traitement des données, hébergement, paiements." canonicalUrl="https://siteviral.com/subprocessors" />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">Sous-traitants ultérieurs</h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">Dernière mise à jour : février 2026</p>

      <p className="text-foreground text-[15px] sm:text-base font-semibold leading-relaxed mb-6">
        Siteviral, opéré par Hacktualiz Inc., fait appel aux sous-traitants tiers suivants pour fournir
        les services de la plateforme. Chaque sous-traitant est contractuellement tenu de protéger vos données
        conformément à notre <a href="/dpa" className="text-primary underline">Accord de traitement des données</a>.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-bold text-foreground">Sous-traitant</th>
              <th className="text-left p-3 font-bold text-foreground">Finalité</th>
              <th className="text-left p-3 font-bold text-foreground">Localisation</th>
            </tr>
          </thead>
          <tbody>
            {subprocessors.map((sp, i) => (
              <tr key={sp.name} className={i < subprocessors.length - 1 ? 'border-b border-border/50' : ''}>
                <td className="p-3 font-semibold text-foreground">
                  <a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {sp.name}
                  </a>
                </td>
                <td className="p-3 text-muted-foreground">{sp.purpose}</td>
                <td className="p-3 text-muted-foreground">{sp.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-4 text-[15px] sm:text-base font-semibold leading-relaxed text-foreground">
        <h2 className="text-xl font-extrabold">Modifications de cette liste</h2>
        <p>
          Nous mettrons à jour cette page lorsque des sous-traitants seront ajoutés ou retirés. Les organisations
          utilisant notre plateforme seront notifiées des changements importants par e-mail au moins 30 jours à l'avance.
        </p>

        <h2 className="text-xl font-extrabold mt-8">Contact</h2>
        <p className="font-medium">
          Pour toute question concernant nos sous-traitants ou nos pratiques de traitement des données :<br />
          <a href="mailto:privacy@siteviral.com" className="text-primary hover:underline">privacy@siteviral.com</a>
        </p>
      </div>
    </LegalPageShell>
  );
}