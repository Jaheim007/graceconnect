import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function CopyrightPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Droits d’auteur & signalement — Siteviral' : 'Copyright & Takedown — Siteviral'}
        description={isFr
          ? 'Procédure de signalement d’une violation de droits d’auteur sur Siteviral, contre-notification et sanctions en cas de récidive.'
          : 'How to report a copyright infringement on Siteviral, counter-notice procedure and repeat-infringer policy.'}
        canonicalUrl="https://siteviral.com/copyright"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Droits d’auteur & signalement' : 'Copyright & Takedown'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 16 août 2026' : 'Last updated: August 16, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Notre position' : '1. Our position'}</h2>
          <p>{isFr
            ? 'Siteviral respecte les droits d’auteur. Les contenus publiés (livres, formations, images, audio) sont créés et mis en ligne par nos utilisateurs. Nous retirons rapidement tout contenu signalé comme portant atteinte à des droits, après vérification.'
            : 'Siteviral respects copyright. Content published on the platform (books, formations, images, audio) is created and uploaded by our users. We promptly remove content reported as infringing, after review.'}</p>
        </section>

        <section>
          <h2>{isFr ? '2. Envoyer un signalement' : '2. Filing a report'}</h2>
          <p>{isFr
            ? <>Envoyez votre notification à <strong>legal@siteviral.com</strong> avec l’objet « Signalement droits d’auteur » et incluez :</>
            : <>Send your notice to <strong>legal@siteviral.com</strong> with the subject “Copyright report” and include:</>}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Vos nom, adresse e-mail et qualité (titulaire ou mandataire).' : 'Your name, email address and capacity (rights holder or agent).'}</li>
            <li>{isFr ? 'L’URL exacte du contenu concerné sur siteviral.com.' : 'The exact URL of the content on siteviral.com.'}</li>
            <li>{isFr ? 'La description de l’œuvre protégée et la preuve de vos droits.' : 'A description of the protected work and evidence of your rights.'}</li>
            <li>{isFr ? 'Une déclaration de bonne foi indiquant que l’usage n’est pas autorisé.' : 'A good-faith statement that the use is not authorized.'}</li>
            <li>{isFr ? 'Une déclaration d’exactitude des informations fournies, et votre signature (électronique acceptée).' : 'A statement that the information is accurate, and your signature (electronic accepted).'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '3. Ce que nous faisons' : '3. What we do'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Accusé de réception :' : 'Acknowledgment:'}</strong> {isFr ? '48 heures ouvrées.' : '48 business hours.'}</li>
            <li><strong>{isFr ? 'Examen :' : 'Review:'}</strong> {isFr ? '5 jours ouvrés maximum.' : '5 business days maximum.'}</li>
            <li>{isFr
              ? 'Si le signalement est fondé : dépublication du contenu, suspension des ventes concernées et notification de l’utilisateur.'
              : 'If the report is valid: the content is unpublished, related sales are suspended and the user is notified.'}</li>
            <li>{isFr
              ? 'Les paiements liés au contenu litigieux peuvent être gelés le temps de l’examen.'
              : 'Payouts linked to the disputed content may be held during the review.'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '4. Contre-notification' : '4. Counter-notice'}</h2>
          <p>{isFr
            ? 'Si votre contenu a été retiré par erreur, répondez à legal@siteviral.com en fournissant la preuve de vos droits ou de votre licence. Après vérification, le contenu est rétabli et les ventes reprennent.'
            : 'If your content was removed by mistake, reply to legal@siteviral.com with proof of your rights or licence. After verification, the content is restored and sales resume.'}</p>
        </section>

        <section>
          <h2>{isFr ? '5. Récidive' : '5. Repeat infringers'}</h2>
          <p>{isFr
            ? 'Un compte faisant l’objet de signalements fondés répétés est suspendu définitivement, ses contenus dépubliés et ses versements en attente examinés au cas par cas, conformément aux CGU et à la politique d’usage acceptable.'
            : 'An account with repeated valid reports is permanently suspended, its content unpublished, and pending payouts reviewed case by case, in line with the Terms and Acceptable Use Policy.'}</p>
          <p>{isFr
            ? <>Voir aussi : <a href="/acceptable-use">usage acceptable</a> · <a href="/terms">CGU</a> · <a href="/legal-notices">mentions légales</a></>
            : <>See also: <a href="/acceptable-use">acceptable use</a> · <a href="/terms">Terms</a> · <a href="/legal-notices">legal notices</a></>}</p>
        </section>
      </div>
    </LegalPageShell>
  );
}
