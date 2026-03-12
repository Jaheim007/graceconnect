import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

const subprocessors = [
  {
    name: 'Supabase Inc.',
    purpose_fr: 'Hébergement de base de données, authentification, stockage de fichiers, fonctions edge (calcul serverless)',
    purpose_en: 'Database hosting, authentication, file storage, edge functions (serverless compute)',
    location_fr: 'États-Unis',
    location_en: 'United States',
    website: 'https://supabase.com',
  },
  {
    name: 'Paystack (Stripe Inc.)',
    purpose_fr: 'Traitement des paiements, vérification des transactions, versement des fonds',
    purpose_en: 'Payment processing, transaction verification, fund disbursement',
    location_fr: 'Nigeria / États-Unis',
    location_en: 'Nigeria / United States',
    website: 'https://paystack.com',
  },
  {
    name: 'Resend Inc.',
    purpose_fr: 'Envoi d\'e-mails transactionnels et de campagnes',
    purpose_en: 'Transactional and campaign email delivery',
    location_fr: 'États-Unis',
    location_en: 'United States',
    website: 'https://resend.com',
  },
  {
    name: 'Sentry (Functional Software Inc.)',
    purpose_fr: 'Surveillance des erreurs frontend et suivi des performances',
    purpose_en: 'Frontend error monitoring and performance tracking',
    location_fr: 'États-Unis',
    location_en: 'United States',
    website: 'https://sentry.io',
  },
];

export default function SubprocessorsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Sous-traitants ultérieurs — Siteviral' : 'Subprocessors — Siteviral'}
        description={isFr ? 'Liste des sous-traitants tiers utilisés par Siteviral.' : 'List of third-party subprocessors used by Siteviral.'}
        canonicalUrl="https://siteviral.com/subprocessors"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Sous-traitants ultérieurs' : 'Subprocessors'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : février 2026' : 'Last updated: February 2026'}
      </p>

      <p className="text-foreground text-[15px] sm:text-base font-semibold leading-relaxed mb-6">
        {isFr
          ? <>Siteviral, opéré par Hacktualiz Inc., fait appel aux sous-traitants tiers suivants pour fournir les services de la plateforme. Chaque sous-traitant est contractuellement tenu de protéger vos données conformément à notre <a href="/dpa" className="text-primary underline">Accord de traitement des données</a>.</>
          : <>Siteviral, operated by Hacktualiz Inc., uses the following third-party subprocessors to provide platform services. Each subprocessor is contractually required to protect your data in accordance with our <a href="/dpa" className="text-primary underline">Data Processing Agreement</a>.</>
        }
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border rounded-lg">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-bold text-foreground">{isFr ? 'Sous-traitant' : 'Subprocessor'}</th>
              <th className="text-left p-3 font-bold text-foreground">{isFr ? 'Finalité' : 'Purpose'}</th>
              <th className="text-left p-3 font-bold text-foreground">{isFr ? 'Localisation' : 'Location'}</th>
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
                <td className="p-3 text-muted-foreground">{isFr ? sp.purpose_fr : sp.purpose_en}</td>
                <td className="p-3 text-muted-foreground">{isFr ? sp.location_fr : sp.location_en}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-4 text-[15px] sm:text-base font-semibold leading-relaxed text-foreground">
        <h2 className="text-xl font-extrabold">{isFr ? 'Modifications de cette liste' : 'Changes to This List'}</h2>
        <p>
          {isFr
            ? 'Nous mettrons à jour cette page lorsque des sous-traitants seront ajoutés ou retirés. Les organisations utilisant notre plateforme seront notifiées des changements importants par e-mail au moins 30 jours à l\'avance.'
            : 'We will update this page when subprocessors are added or removed. Organizations using our platform will be notified of significant changes by email at least 30 days in advance.'}
        </p>

        <h2 className="text-xl font-extrabold mt-8">{isFr ? 'Contact' : 'Contact'}</h2>
        <p className="font-medium">
          {isFr
            ? <>Pour toute question concernant nos sous-traitants ou nos pratiques de traitement des données :<br /><a href="mailto:privacy@siteviral.com" className="text-primary hover:underline">privacy@siteviral.com</a></>
            : <>For any questions about our subprocessors or data processing practices:<br /><a href="mailto:privacy@siteviral.com" className="text-primary hover:underline">privacy@siteviral.com</a></>
          }
        </p>
      </div>
    </LegalPageShell>
  );
}
