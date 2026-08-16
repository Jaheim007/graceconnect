import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function DataDeletionPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Suppression des données — Siteviral' : 'Data Deletion — Siteviral'}
        description={isFr
          ? 'Comment supprimer votre compte Siteviral et vos données, ce qui est effacé, ce qui est conservé et sous quels délais.'
          : 'How to delete your Siteviral account and data, what is erased, what is retained and within what timeframes.'}
        canonicalUrl="https://siteviral.com/data-deletion"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Suppression de compte et de données' : 'Account & Data Deletion'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 16 août 2026' : 'Last updated: August 16, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Demander la suppression' : '1. Requesting deletion'}</h2>
          <p>{isFr ? 'Deux options :' : 'Two options:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr
              ? <>Depuis l’application : <strong>Profil → Paramètres du compte → Supprimer mon compte</strong>.</>
              : <>In the app: <strong>Profile → Account settings → Delete my account</strong>.</>}</li>
            <li>{isFr
              ? <>Par e-mail : écrivez à <strong>privacy@siteviral.com</strong> depuis l’adresse associée à votre compte, avec l’objet « Suppression de données ».</>
              : <>By email: write to <strong>privacy@siteviral.com</strong> from the address linked to your account, with the subject “Data deletion”.</>}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '2. Ce qui est supprimé' : '2. What gets deleted'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Votre profil, votre photo, vos préférences et vos sessions.' : 'Your profile, photo, preferences and sessions.'}</li>
            <li>{isFr ? 'Vos brouillons, livres, formations et fichiers non publiés.' : 'Your drafts, books, formations and unpublished files.'}</li>
            <li>{isFr ? 'Vos messages, notifications et historiques de conversation IA.' : 'Your messages, notifications and AI conversation history.'}</li>
            <li>{isFr ? 'Vos espaces (plateformes) dont vous êtes le seul propriétaire, ainsi que leur contenu public.' : 'Workspaces (platforms) where you are the sole owner, along with their public content.'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '3. Ce qui est conservé (et pourquoi)' : '3. What is retained (and why)'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr
              ? <><strong>Registres de transactions, factures et versements</strong> : conservés pour obligations comptables, fiscales et anti-fraude (généralement 10 ans).</>
              : <><strong>Transaction records, invoices and payouts</strong>: retained for accounting, tax and anti-fraud obligations (typically 10 years).</>}</li>
            <li>{isFr
              ? <><strong>Accès déjà achetés par des clients</strong> : les acheteurs conservent l’accès aux contenus qu’ils ont payés, conformément à nos CGU.</>
              : <><strong>Purchases already made by customers</strong>: buyers keep access to the content they paid for, as stated in our Terms.</>}</li>
            <li>{isFr
              ? <><strong>Journaux de sécurité anonymisés</strong> : conservés de façon agrégée, sans identifiant personnel.</>
              : <><strong>Anonymized security logs</strong>: kept in aggregated form, with no personal identifier.</>}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '4. Délais' : '4. Timeframes'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Accusé de réception :' : 'Acknowledgment:'}</strong> {isFr ? '72 heures' : '72 hours'}</li>
            <li><strong>{isFr ? 'Suppression effective :' : 'Effective deletion:'}</strong> {isFr ? '30 jours maximum' : '30 days maximum'}</li>
            <li><strong>{isFr ? 'Purge des sauvegardes :' : 'Backup purge:'}</strong> {isFr ? '90 jours maximum' : '90 days maximum'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '5. Avant de supprimer' : '5. Before you delete'}</h2>
          <p>{isFr
            ? 'Demandez votre versement en attente, exportez vos contenus (PDF, fichiers) et téléchargez vos factures : après suppression, ces éléments ne sont plus accessibles depuis votre compte. Vous pouvez aussi demander une simple export de données au lieu d’une suppression.'
            : 'Request any pending payout, export your content (PDFs, files) and download your invoices: after deletion these items are no longer accessible from your account. You can also request a data export instead of a deletion.'}</p>
        </section>

        <section>
          <h2>{isFr ? '6. Contact' : '6. Contact'}</h2>
          <p>{isFr
            ? <><strong>privacy@siteviral.com</strong> — voir aussi <a href="/privacy">confidentialité</a> et <a href="/cookies">cookies</a>.</>
            : <><strong>privacy@siteviral.com</strong> — see also <a href="/privacy">privacy</a> and <a href="/cookies">cookies</a>.</>}</p>
        </section>
      </div>
    </LegalPageShell>
  );
}
