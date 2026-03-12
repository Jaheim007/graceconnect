import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function AcceptableUsePage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? "Politique d'Utilisation Acceptable — Siteviral" : 'Acceptable Use Policy — Siteviral'}
        description={isFr ? 'Règles de conduite sur Siteviral. Contenus autorisés, interdictions et sanctions.' : 'Conduct rules on Siteviral. Allowed content, prohibitions and sanctions.'}
        canonicalUrl="https://siteviral.com/acceptable-use"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? "Politique d'Utilisation Acceptable" : 'Acceptable Use Policy'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 22 février 2026' : 'Last updated: February 22, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? '1. Objet' : '1. Purpose'}</h2>
          <p>{isFr ? 'Cette Politique d\'Utilisation Acceptable définit les règles de conduite que tous les utilisateurs de Siteviral doivent respecter. Elle vise à maintenir un environnement sûr, professionnel et respectueux pour toutes les communautés.' : 'This Acceptable Use Policy defines the rules of conduct that all Siteviral users must follow. It aims to maintain a safe, professional and respectful environment for all communities.'}</p>
        </section>

        <section>
          <h2>{isFr ? '2. Contenus interdits' : '2. Prohibited Content'}</h2>
          <p>{isFr ? 'Les utilisateurs s\'engagent à ne pas publier, partager ou promouvoir :' : 'Users agree not to publish, share, or promote:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Contenu illégal, diffamatoire, ou incitant à la haine' : 'Illegal, defamatory, or hate-inciting content'}</li>
            <li>{isFr ? 'Contenu à caractère pornographique, violent ou choquant' : 'Pornographic, violent, or shocking content'}</li>
            <li>{isFr ? 'Contenu portant atteinte aux droits de propriété intellectuelle d\'autrui' : 'Content infringing on others\' intellectual property rights'}</li>
            <li>{isFr ? 'Informations personnelles de tiers sans leur consentement' : 'Third-party personal information without their consent'}</li>
            <li>{isFr ? 'Spam, publicités non sollicitées ou contenus trompeurs' : 'Spam, unsolicited advertising, or misleading content'}</li>
            <li>{isFr ? 'Logiciels malveillants, virus ou code destructeur' : 'Malware, viruses, or destructive code'}</li>
            <li>{isFr ? 'Contenu promouvant des activités frauduleuses, illégales ou terroristes' : 'Content promoting fraudulent, illegal, or terrorist activities'}</li>
            <li>{isFr ? 'Contenu en violation des droits d\'auteur (copyright)' : 'Copyright-infringing content'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '3. Activités commerciales interdites' : '3. Prohibited Commercial Activities'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Vente de produits contrefaits ou volés' : 'Sale of counterfeit or stolen products'}</li>
            <li>{isFr ? 'Schémas de Ponzi, systèmes pyramidaux ou MLM frauduleux' : 'Ponzi schemes, pyramid schemes, or fraudulent MLM'}</li>
            <li>{isFr ? 'Blanchiment d\'argent ou financement d\'activités illicites' : 'Money laundering or financing of illicit activities'}</li>
            <li>{isFr ? 'Manipulation des systèmes de commission ou d\'affiliation' : 'Manipulation of commission or affiliate systems'}</li>
            <li>{isFr ? 'Auto-achat ou auto-référencement frauduleux' : 'Fraudulent self-purchase or self-referral'}</li>
            <li>{isFr ? 'Création de fausses organisations pour collecter des fonds' : 'Creating fake organizations to collect funds'}</li>
            <li>{isFr ? 'Commerce de biens ou services soumis à sanctions ou embargos internationaux' : 'Trade in goods or services subject to international sanctions or embargoes'}</li>
            <li>{isFr ? 'Opérations impliquant des entités figurant sur les listes de sanctions (OFAC, UE, ONU)' : 'Operations involving entities on sanctions lists (OFAC, EU, UN)'}</li>
            <li>{isFr ? 'Production ou distribution de faux documents d\'identité' : 'Production or distribution of fake identity documents'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '4. Comportements interdits' : '4. Prohibited Behavior'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Harcèlement, intimidation ou menaces envers d\'autres utilisateurs' : 'Harassment, intimidation, or threats toward other users'}</li>
            <li>{isFr ? 'Usurpation d\'identité ou représentation frauduleuse' : 'Identity theft or fraudulent representation'}</li>
            <li>{isFr ? 'Tentatives d\'accès non autorisé aux comptes d\'autres utilisateurs' : 'Unauthorized access attempts to other users\' accounts'}</li>
            <li>{isFr ? 'Exploitation de failles de sécurité de la plateforme' : 'Exploiting platform security vulnerabilities'}</li>
            <li>{isFr ? 'Utilisation de bots ou scripts automatisés non autorisés' : 'Use of unauthorized bots or automated scripts'}</li>
            <li>{isFr ? 'Manipulation des métriques (vues, likes, membres fictifs)' : 'Manipulation of metrics (views, likes, fake members)'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '5. Obligations des organisations' : '5. Organization Obligations'}</h2>
          <p>{isFr ? 'Les organisations utilisant Siteviral doivent :' : 'Organizations using Siteviral must:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Fournir des informations véridiques et à jour' : 'Provide truthful and up-to-date information'}</li>
            <li>{isFr ? 'Respecter les lois et réglementations applicables dans leur juridiction' : 'Comply with applicable laws and regulations in their jurisdiction'}</li>
            <li>{isFr ? 'Protéger les données de leurs membres et donateurs' : 'Protect the data of their members and donors'}</li>
            <li>{isFr ? 'Utiliser les fonds collectés conformément aux objectifs déclarés' : 'Use collected funds in accordance with stated objectives'}</li>
            <li>{isFr ? 'Répondre aux demandes de vérification KYC dans les délais impartis' : 'Respond to KYC verification requests within the allotted time'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '6. Signalement' : '6. Reporting'}</h2>
          <p>{isFr ? 'Tout utilisateur peut signaler un contenu ou comportement violant cette politique via le système de signalement intégré ou par email à abuse@siteviral.com.' : 'Any user can report content or behavior violating this policy via the built-in reporting system or by email to abuse@siteviral.com.'}</p>
          <p>{isFr ? 'Les signalements sont traités sous 48 heures ouvrées. L\'identité du signaleur est protégée.' : 'Reports are processed within 48 business hours. The reporter\'s identity is protected.'}</p>
        </section>

        <section>
          <h2>7. {isFr ? 'Sanctions' : 'Sanctions'}</h2>
          <p>{isFr ? 'En cas de violation de cette politique, Siteviral peut appliquer les mesures suivantes :' : 'In case of violation of this policy, Siteviral may apply the following measures:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Avertissement' : 'Warning'}</strong> : {isFr ? 'premier manquement mineur' : 'first minor violation'}</li>
            <li><strong>{isFr ? 'Suppression de contenu' : 'Content removal'}</strong> : {isFr ? 'contenu non conforme retiré' : 'non-compliant content removed'}</li>
            <li><strong>{isFr ? 'Suspension temporaire' : 'Temporary suspension'}</strong> : {isFr ? 'accès restreint pour une durée déterminée' : 'restricted access for a set period'}</li>
            <li><strong>{isFr ? 'Suspension définitive' : 'Permanent suspension'}</strong> : {isFr ? 'fermeture du compte et de l\'organisation' : 'account and organization closure'}</li>
            <li><strong>{isFr ? 'Gel des fonds' : 'Fund freeze'}</strong> : {isFr ? 'retraits bloqués pendant l\'enquête' : 'withdrawals blocked during investigation'}</li>
            <li><strong>{isFr ? 'Signalement aux autorités' : 'Reporting to authorities'}</strong> : {isFr ? 'en cas d\'activité criminelle' : 'in case of criminal activity'}</li>
          </ul>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            Trust & Safety<br />
            131 Continental Dr, Suite 305, Newark, DE 19713, USA<br />
            Email : abuse@siteviral.com
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
