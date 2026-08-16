import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function LegalNoticesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Mentions légales — Siteviral' : 'Legal Notices — Siteviral'}
        description={isFr
          ? 'Éditeur, hébergement, propriété intellectuelle et contacts légaux de la plateforme Siteviral.'
          : 'Publisher, hosting, intellectual property and legal contacts for the Siteviral platform.'}
        canonicalUrl="https://siteviral.com/legal-notices"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Mentions légales' : 'Legal Notices'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 16 août 2026' : 'Last updated: August 16, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Éditeur du site' : '1. Site publisher'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Société :' : 'Company:'}</strong> Hacktualiz Inc.</li>
            <li><strong>{isFr ? 'Service :' : 'Service:'}</strong> Siteviral (siteviral.com)</li>
            <li><strong>{isFr ? 'Contact général :' : 'General contact:'}</strong> support@siteviral.com</li>
            <li><strong>{isFr ? 'Contact légal :' : 'Legal contact:'}</strong> legal@siteviral.com</li>
            <li><strong>{isFr ? 'Protection des données :' : 'Data protection:'}</strong> privacy@siteviral.com</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '2. Nature du service' : '2. Nature of the service'}</h2>
          <p>{isFr
            ? 'Siteviral est un service logiciel (SaaS) permettant à des créateurs, formateurs, églises, ONG et communautés de créer, publier, vendre et distribuer des contenus numériques, et d’encaisser des paiements ou des dons. Siteviral n’est pas l’auteur des contenus publiés par ses utilisateurs et agit comme intermédiaire technique.'
            : 'Siteviral is a software service (SaaS) that lets creators, trainers, churches, NGOs and communities create, publish, sell and distribute digital content, and collect payments or donations. Siteviral does not author the content published by its users and acts as a technical intermediary.'}</p>
        </section>

        <section>
          <h2>{isFr ? '3. Hébergement et infrastructure' : '3. Hosting and infrastructure'}</h2>
          <p>{isFr
            ? 'L’application et ses données sont hébergées chez des fournisseurs d’infrastructure cloud professionnels. La liste détaillée de nos sous-traitants (hébergement, base de données, paiements, e-mails, IA) est publiée sur la page Sous-traitants.'
            : 'The application and its data are hosted with professional cloud infrastructure providers. The detailed list of our subprocessors (hosting, database, payments, email, AI) is published on the Subprocessors page.'}</p>
          <p>{isFr
            ? <>Voir : <a href="/subprocessors">Sous-traitants</a> · <a href="/security">Sécurité</a> · <a href="/dpa">DPA</a></>
            : <>See: <a href="/subprocessors">Subprocessors</a> · <a href="/security">Security</a> · <a href="/dpa">DPA</a></>}</p>
        </section>

        <section>
          <h2>{isFr ? '4. Propriété intellectuelle' : '4. Intellectual property'}</h2>
          <p>{isFr
            ? 'La marque Siteviral, son logo, son interface, son code et ses éléments graphiques sont la propriété de Hacktualiz Inc. Toute reproduction non autorisée est interdite. Les contenus publiés par les utilisateurs (livres, formations, images, audio) restent la propriété de leurs auteurs respectifs.'
            : 'The Siteviral brand, logo, interface, code and graphic elements are the property of Hacktualiz Inc. Any unauthorized reproduction is prohibited. Content published by users (books, formations, images, audio) remains the property of its respective authors.'}</p>
        </section>

        <section>
          <h2>{isFr ? '5. Signalement de contenu' : '5. Reporting content'}</h2>
          <p>{isFr
            ? <>Pour signaler un contenu illicite ou une violation de droits d’auteur, utilisez la procédure décrite sur la page <a href="/copyright">Droits d’auteur</a> ou écrivez à legal@siteviral.com.</>
            : <>To report illegal content or a copyright infringement, follow the procedure described on the <a href="/copyright">Copyright</a> page or email legal@siteviral.com.</>}</p>
        </section>

        <section>
          <h2>{isFr ? '6. Documents contractuels' : '6. Contractual documents'}</h2>
          <p>{isFr
            ? <>L’usage du service est régi par les <a href="/terms">CGU</a>, la <a href="/privacy">politique de confidentialité</a>, la <a href="/acceptable-use">politique d’usage acceptable</a>, la <a href="/refund-policy">politique de remboursement</a> et la <a href="/payout-policy">politique de versement</a>.</>
            : <>Use of the service is governed by the <a href="/terms">Terms</a>, the <a href="/privacy">Privacy Policy</a>, the <a href="/acceptable-use">Acceptable Use Policy</a>, the <a href="/refund-policy">Refund Policy</a> and the <a href="/payout-policy">Payout Policy</a>.</>}</p>
        </section>
      </div>
    </LegalPageShell>
  );
}
