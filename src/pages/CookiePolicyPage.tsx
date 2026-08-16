import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function CookiePolicyPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const rows = [
    {
      name: isFr ? 'Session d’authentification' : 'Authentication session',
      cat: isFr ? 'Essentiel' : 'Essential',
      dur: isFr ? 'Jusqu’à la déconnexion' : 'Until sign-out',
      why: isFr ? 'Vous garder connecté à votre espace.' : 'Keep you signed in to your workspace.',
    },
    {
      name: isFr ? 'Attribution ambassadeur' : 'Ambassador attribution',
      cat: isFr ? 'Fonctionnel' : 'Functional',
      dur: isFr ? '7 jours' : '7 days',
      why: isFr ? 'Créditer la bonne personne pour une vente (last-click).' : 'Credit the right person for a sale (last-click).',
    },
    {
      name: isFr ? 'Préférences (langue, thème)' : 'Preferences (language, theme)',
      cat: isFr ? 'Fonctionnel' : 'Functional',
      dur: isFr ? '12 mois' : '12 months',
      why: isFr ? 'Se souvenir de vos réglages d’affichage.' : 'Remember your display settings.',
    },
    {
      name: isFr ? 'Mesure d’audience agrégée' : 'Aggregated analytics',
      cat: isFr ? 'Analytique' : 'Analytics',
      dur: isFr ? '13 mois maximum' : '13 months maximum',
      why: isFr ? 'Comprendre quelles pages aident vraiment les créateurs.' : 'Understand which pages actually help creators.',
    },
  ];

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Politique de cookies — Siteviral' : 'Cookie Policy — Siteviral'}
        description={isFr
          ? 'Quels cookies Siteviral utilise, pourquoi, combien de temps, et comment les refuser ou les supprimer.'
          : 'Which cookies Siteviral uses, why, for how long, and how to refuse or delete them.'}
        canonicalUrl="https://siteviral.com/cookies"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Politique de cookies' : 'Cookie Policy'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 16 août 2026' : 'Last updated: August 16, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Ce que nous utilisons' : '1. What we use'}</h2>
          <p>{isFr
            ? 'Siteviral utilise des cookies et technologies similaires (localStorage, sessionStorage) pour faire fonctionner votre compte, mémoriser vos préférences et mesurer l’usage du service. Nous ne vendons pas vos données et nous n’utilisons pas de cookies publicitaires tiers.'
            : 'Siteviral uses cookies and similar technologies (localStorage, sessionStorage) to run your account, remember your preferences and measure usage. We do not sell your data and we do not use third-party advertising cookies.'}</p>
        </section>

        <section>
          <h2>{isFr ? '2. Détail des cookies' : '2. Cookie details'}</h2>
          <div className="not-prose overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="p-3 font-semibold">{isFr ? 'Cookie' : 'Cookie'}</th>
                  <th className="p-3 font-semibold">{isFr ? 'Catégorie' : 'Category'}</th>
                  <th className="p-3 font-semibold">{isFr ? 'Durée' : 'Duration'}</th>
                  <th className="p-3 font-semibold">{isFr ? 'Finalité' : 'Purpose'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.name} className="border-t border-border/60 align-top">
                    <td className="p-3 font-medium text-foreground">{r.name}</td>
                    <td className="p-3 text-muted-foreground">{r.cat}</td>
                    <td className="p-3 text-muted-foreground">{r.dur}</td>
                    <td className="p-3 text-muted-foreground">{r.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>{isFr ? '3. Votre consentement' : '3. Your consent'}</h2>
          <p>{isFr
            ? 'Les cookies essentiels sont nécessaires au fonctionnement du site et ne requièrent pas de consentement. Les cookies analytiques ne sont activés qu’après votre accord via la bannière affichée lors de votre première visite. Vous pouvez changer d’avis à tout moment en effaçant les cookies du site depuis votre navigateur : la bannière réapparaîtra.'
            : 'Essential cookies are required for the site to work and do not need consent. Analytics cookies are only enabled after you accept them in the banner shown on your first visit. You can change your mind at any time by clearing this site’s cookies in your browser: the banner will appear again.'}</p>
        </section>

        <section>
          <h2>{isFr ? '4. Gérer ou supprimer les cookies' : '4. Managing or deleting cookies'}</h2>
          <p>{isFr
            ? 'Tous les navigateurs permettent de bloquer ou supprimer les cookies (Chrome, Safari, Firefox, Edge : Réglages → Confidentialité). Attention : bloquer les cookies essentiels vous empêchera de rester connecté à votre espace Siteviral.'
            : 'Every browser lets you block or delete cookies (Chrome, Safari, Firefox, Edge: Settings → Privacy). Note: blocking essential cookies will prevent you from staying signed in to your Siteviral workspace.'}</p>
        </section>

        <section>
          <h2>{isFr ? '5. Contact' : '5. Contact'}</h2>
          <p>{isFr
            ? <>Questions sur cette politique : <strong>privacy@siteviral.com</strong>. Voir aussi notre <a href="/privacy">politique de confidentialité</a>.</>
            : <>Questions about this policy: <strong>privacy@siteviral.com</strong>. See also our <a href="/privacy">privacy policy</a>.</>}</p>
        </section>
      </div>
    </LegalPageShell>
  );
}
