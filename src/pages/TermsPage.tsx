import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';

export default function TermsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? "Conditions d'utilisation — Siteviral" : 'Terms of Service — Siteviral'}
        description={isFr ? "Lisez les Conditions d'utilisation de Siteviral. Règles d'usage, droits et responsabilités pour tous les utilisateurs." : 'Read the Siteviral Terms of Service. Usage rules, rights and responsibilities for all users.'}
        canonicalUrl="https://siteviral.com/terms"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? "Conditions d'utilisation" : 'Terms of Service'}
      </h1>
      <p className="text-lg font-bold text-foreground mb-1">SITEVIRAL</p>
      <p className="text-sm text-muted-foreground mb-8 font-medium">
        {isFr ? 'Dernière mise à jour : 22 février 2026' : 'Last updated: February 22, 2026'}
      </p>

      <div className={proseClasses}>
        <section>
          <h2>1. Introduction</h2>
          <p>
            {isFr
              ? "Les présentes Conditions d'utilisation (« Conditions ») régissent l'accès et l'utilisation de la plateforme Siteviral, y compris tous les sites web associés, sous-domaines (dont siteviral.com et siteviral.co), applications et services (collectivement, le « Service »)."
              : 'These Terms of Service ("Terms") govern your access to and use of the Siteviral platform, including all associated websites, subdomains (including siteviral.com and siteviral.co), applications and services (collectively, the "Service").'}
          </p>
          <p>
            {isFr
              ? "Le Service est opéré par Hacktualiz Inc., une société du Delaware (C-Corporation), dont le siège social est situé au :"
              : 'The Service is operated by Hacktualiz Inc., a Delaware C-Corporation, with its registered office at:'}
          </p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            131 Continental Dr, Suite 305<br />
            Newark, DE 19713<br />
            {isFr ? 'États-Unis' : 'United States'}
          </p>
          <p>{isFr ? 'Dans les présentes Conditions :' : 'In these Terms:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? '« Société », « nous », « notre »' : '"Company", "we", "our"'}</strong> {isFr ? 'désigne Hacktualiz Inc.' : 'refers to Hacktualiz Inc.'}</li>
            <li><strong>« Siteviral »</strong> {isFr ? 'désigne le produit et la plateforme opérée par la Société.' : 'refers to the product and platform operated by the Company.'}</li>
            <li><strong>{isFr ? '« Utilisateur », « vous », « votre »' : '"User", "you", "your"'}</strong> {isFr ? "désigne toute personne physique ou morale accédant au Service ou l'utilisant." : 'refers to any individual or entity accessing or using the Service.'}</li>
            <li><strong>{isFr ? '« Organisation »' : '"Organization"'}</strong> {isFr ? 'désigne toute entité, communauté, entreprise, ONG, organisme religieux ou leader opérant au sein de Siteviral.' : 'refers to any entity, community, business, NGO, religious organization, or leader operating within Siteviral.'}</li>
            <li><strong>{isFr ? '« Membre »' : '"Member"'}</strong> {isFr ? "désigne un utilisateur qui rejoint ou interagit avec une Organisation." : 'refers to a user who joins or interacts with an Organization.'}</li>
            <li><strong>{isFr ? '« Ambassadeur »' : '"Ambassador"'}</strong> {isFr ? "désigne un utilisateur participant au programme ambassadeur Siteviral." : 'refers to a user participating in the Siteviral ambassador program.'}</li>
          </ul>
          <p>
            {isFr
              ? "En accédant au Service ou en l'utilisant, vous acceptez d'être lié par les présentes Conditions."
              : 'By accessing or using the Service, you agree to be bound by these Terms.'}
            <strong> {isFr ? "Si vous n'acceptez pas, vous ne devez pas accéder au Service ni l'utiliser." : 'If you do not agree, you must not access or use the Service.'}</strong>
          </p>
        </section>

        <section>
          <h2>{isFr ? '2. Description du Service' : '2. Description of Service'}</h2>
          <p>{isFr ? 'Siteviral est une infrastructure SaaS multi-tenant qui permet aux Organisations de :' : 'Siteviral is a multi-tenant SaaS infrastructure that enables Organizations to:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Publier et distribuer du contenu numérique (vidéos, audio, médias)' : 'Publish and distribute digital content (videos, audio, media)'}</li>
            <li>{isFr ? 'Vendre des produits numériques' : 'Sell digital products'}</li>
            <li>{isFr ? 'Accepter des dons' : 'Accept donations'}</li>
            <li>{isFr ? "Opérer des programmes de marketing d'affiliation" : 'Operate affiliate marketing programs'}</li>
            <li>{isFr ? 'Gérer des membres et des communications' : 'Manage members and communications'}</li>
            <li>{isFr ? 'Traiter des versements sous réserve de conformité et vérification KYC' : 'Process payouts subject to compliance and KYC verification'}</li>
          </ul>
          <p>
            {isFr
              ? "La Société fournit l'infrastructure et les outils de facilitation de paiement."
              : 'The Company provides the infrastructure and payment facilitation tools.'}
            <strong> {isFr
              ? "La Société n'agit pas en tant que vendeur de produits, destinataire de dons (sauf frais de plateforme) ou fournisseur du contenu des Organisations."
              : 'The Company does not act as a seller of products, recipient of donations (except platform fees), or provider of Organization content.'}</strong>
          </p>
          <p>{isFr ? 'Les Organisations restent seules responsables de leur contenu, de leurs offres et de leur conformité aux lois applicables.' : 'Organizations remain solely responsible for their content, offerings, and compliance with applicable laws.'}</p>
        </section>

        <section>
          <h2>{isFr ? '3. Éligibilité' : '3. Eligibility'}</h2>
          <p>{isFr ? 'Pour utiliser le Service :' : 'To use the Service:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Vous devez avoir au moins 18 ans ou l\'âge de la majorité légale dans votre juridiction.' : 'You must be at least 18 years old or the age of legal majority in your jurisdiction.'}</li>
            <li>{isFr ? 'Vous devez avoir la capacité juridique de conclure des contrats contraignants.' : 'You must have the legal capacity to enter into binding contracts.'}</li>
            <li>{isFr ? "Si vous agissez au nom d'une Organisation, vous devez avoir l'autorité pour engager cette Organisation." : 'If acting on behalf of an Organization, you must have the authority to bind that Organization.'}</li>
          </ul>
          <p>{isFr ? 'La Société peut refuser le service à toute personne ou entité à sa seule discrétion.' : 'The Company may refuse service to any person or entity at its sole discretion.'}</p>
        </section>

        <section>
          <h2>{isFr ? '4. Inscription du compte' : '4. Account Registration'}</h2>
          <p>{isFr ? 'Pour accéder à certaines fonctionnalités, vous devez créer un compte. Vous acceptez de :' : 'To access certain features, you must create an account. You agree to:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Fournir des informations exactes et complètes.' : 'Provide accurate and complete information.'}</li>
            <li>{isFr ? 'Maintenir la sécurité de vos identifiants de connexion.' : 'Maintain the security of your login credentials.'}</li>
            <li>{isFr ? "Nous notifier immédiatement en cas d'utilisation non autorisée." : 'Notify us immediately of any unauthorized use.'}</li>
            <li>{isFr ? 'Accepter l\'entière responsabilité de toute activité sous votre compte.' : 'Accept full responsibility for all activity under your account.'}</li>
          </ul>
          <p>{isFr ? "La Société n'est pas responsable des pertes résultant d'un accès non autorisé dû à votre défaut de protection de vos identifiants." : 'The Company is not liable for losses resulting from unauthorized access due to your failure to protect your credentials.'}</p>
        </section>

        <section>
          <h2>{isFr ? '5. Organisations & Responsabilité du contenu' : '5. Organizations & Content Responsibility'}</h2>
          <p>{isFr ? 'Les Organisations peuvent créer des pages publiques et proposer des produits, dons et liens d\'affiliation.' : 'Organizations can create public pages and offer products, donations, and affiliate links.'}</p>
          <p>{isFr ? 'Chaque Organisation déclare et garantit que :' : 'Each Organization represents and warrants that:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Elle a le droit légal de proposer son contenu, ses produits et ses services.' : 'It has the legal right to offer its content, products, and services.'}</li>
            <li>{isFr ? 'Ses activités sont conformes à toutes les lois et réglementations applicables.' : 'Its activities comply with all applicable laws and regulations.'}</li>
            <li>{isFr ? "Son contenu ne porte pas atteinte aux droits de propriété intellectuelle." : 'Its content does not infringe intellectual property rights.'}</li>
            <li>{isFr ? 'Ses activités ne violent pas les lois AML, anti-fraude, sanctions ou exportation.' : 'Its activities do not violate AML, anti-fraud, sanctions, or export laws.'}</li>
          </ul>
          <p>{isFr ? "La Société n'examine pas l'ensemble du contenu et n'est pas responsable de la légalité, l'exactitude ou la qualité des contenus des Organisations." : 'The Company does not review all content and is not responsible for the legality, accuracy, or quality of Organization content.'}</p>
          <p>{isFr ? 'La Société se réserve le droit de suspendre, restreindre ou supprimer tout contenu ou Organisation en violation des présentes Conditions.' : 'The Company reserves the right to suspend, restrict, or remove any content or Organization in violation of these Terms.'}</p>
        </section>

        <section>
          <h2>{isFr ? '6. Paiements' : '6. Payments'}</h2>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">{isFr ? '6.1 Traitement des paiements' : '6.1 Payment Processing'}</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Les paiements sont traités par des prestataires de paiement tiers, notamment Paystack.' : 'Payments are processed by third-party payment providers, including Paystack.'}</li>
            <li>{isFr ? 'La disponibilité des moyens de paiement peut varier selon le pays et la juridiction.' : 'Payment method availability may vary by country and jurisdiction.'}</li>
            <li>{isFr ? 'La Société ne stocke pas les données complètes de carte bancaire.' : 'The Company does not store full credit card data.'}</li>
          </ul>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">{isFr ? '6.2 Frais de plateforme' : '6.2 Platform Fees'}</h3>
          <p>{isFr ? 'La Société peut facturer des frais de plateforme sur les transactions traitées via le Service. Ces frais peuvent varier selon le plan ou la configuration.' : 'The Company may charge platform fees on transactions processed through the Service. These fees may vary by plan or configuration.'}</p>
          <h3 className="text-lg font-bold text-foreground mt-4 mb-2">{isFr ? '6.3 Répartition des transactions' : '6.3 Transaction Breakdown'}</h3>
          <p>{isFr ? 'Pour les transactions éligibles :' : 'For eligible transactions:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Des frais de plateforme sont retenus par la Société.' : 'Platform fees are retained by the Company.'}</li>
            <li>{isFr ? "Une commission d'affiliation (le cas échéant) est allouée." : 'An affiliate commission (if applicable) is allocated.'}</li>
            <li>{isFr ? "Le montant restant est alloué à l'Organisation." : 'The remaining amount is allocated to the Organization.'}</li>
          </ul>
          <p>{isFr ? 'Toutes les répartitions sont automatisées.' : 'All allocations are automated.'}</p>
        </section>

        <section>
          <h2>{isFr ? "7. Programme d'affiliation" : '7. Affiliate Program'}</h2>
          <p>{isFr ? "Le système d'affiliation permet aux utilisateurs de promouvoir des Organisations et de percevoir des commissions." : 'The affiliate system allows users to promote Organizations and earn commissions.'}</p>
          <p>{isFr ? "Les commissions d'affiliation :" : 'Affiliate commissions:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? "Sont soumises à l'attribution au dernier clic dans une fenêtre de cookie définie." : 'Are subject to last-click attribution within a defined cookie window.'}</li>
            <li>{isFr ? 'Peuvent faire l\'objet d\'un examen pour fraude ou abus.' : 'May be subject to review for fraud or abuse.'}</li>
            <li>{isFr ? 'Deviennent payables uniquement après une période de rétention (minimum 15 jours).' : 'Become payable only after a holding period (minimum 15 days).'}</li>
          </ul>
          <p>{isFr ? "L'auto-parrainage, les activités frauduleuses, le trafic artificiel ou la manipulation des mécanismes d'attribution sont strictement interdits." : 'Self-referral, fraudulent activities, artificial traffic, or manipulation of attribution mechanisms are strictly prohibited.'}</p>
          <p>{isFr ? 'La Société peut annuler les commissions jugées frauduleuses.' : 'The Company may cancel commissions deemed fraudulent.'}</p>
        </section>

        <section>
          <h2>{isFr ? '8. KYC & Versements' : '8. KYC & Payouts'}</h2>
          <p>{isFr ? "Pour recevoir des versements, les Organisations et Affiliés peuvent être tenus de compléter une vérification d'identité (« KYC »)." : 'To receive payouts, Organizations and Affiliates may be required to complete identity verification ("KYC").'}</p>
          <p>{isFr ? 'La Société se réserve le droit de :' : 'The Company reserves the right to:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Demander des documents supplémentaires.' : 'Request additional documents.'}</li>
            <li>{isFr ? 'Retarder les versements pour examen.' : 'Delay payouts for review.'}</li>
            <li>{isFr ? 'Geler les versements en cas de fraude, litige, examen AML ou rétrofacturation.' : 'Freeze payouts in case of fraud, dispute, AML review, or chargeback.'}</li>
            <li>{isFr ? 'Refuser les versements si les normes de conformité ne sont pas respectées.' : 'Refuse payouts if compliance standards are not met.'}</li>
          </ul>
          <p>{isFr ? 'Les délais de versement peuvent varier en fonction de l\'examen de conformité et du traitement par le prestataire de paiement.' : 'Payout timelines may vary based on compliance review and payment provider processing.'}</p>
        </section>

        <section>
          <h2>{isFr ? '9. Remboursements & Rétrofacturations' : '9. Refunds & Chargebacks'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? <>Les biens numériques sont généralement <strong>non remboursables</strong> sauf indication contraire explicite.</> : <>Digital goods are generally <strong>non-refundable</strong> unless explicitly stated otherwise.</>}</li>
            <li>{isFr ? 'Les Organisations sont responsables du respect de leurs politiques de remboursement applicables.' : 'Organizations are responsible for complying with their applicable refund policies.'}</li>
          </ul>
          <p>{isFr ? 'La Société peut :' : 'The Company may:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Geler les versements en cas de rétrofacturations excessives.' : 'Freeze payouts in case of excessive chargebacks.'}</li>
            <li>{isFr ? 'Déduire les montants de rétrofacturation des versements futurs.' : 'Deduct chargeback amounts from future payouts.'}</li>
            <li>{isFr ? 'Utiliser les journaux de transactions et de téléchargements comme preuve de livraison en cas de litige.' : 'Use transaction and download logs as proof of delivery in case of dispute.'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '10. Activités interdites' : '10. Prohibited Activities'}</h2>
          <p>{isFr ? 'Les Utilisateurs et Organisations ne peuvent pas utiliser le Service pour :' : 'Users and Organizations may not use the Service for:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'La fraude ou la tromperie' : 'Fraud or deception'}</li>
            <li>{isFr ? "Le blanchiment d'argent" : 'Money laundering'}</li>
            <li>{isFr ? 'Le financement du terrorisme' : 'Terrorism financing'}</li>
            <li>{isFr ? 'La violation de propriété intellectuelle' : 'Intellectual property infringement'}</li>
            <li>{isFr ? 'La vente de biens ou services illégaux' : 'Sale of illegal goods or services'}</li>
            <li>{isFr ? 'Les discours de haine ou contenus violents' : 'Hate speech or violent content'}</li>
            <li>{isFr ? 'La distribution de logiciels malveillants' : 'Malware distribution'}</li>
            <li>{isFr ? "L'usurpation d'identité ou la fraude à l'identité" : 'Identity theft or identity fraud'}</li>
            <li>{isFr ? 'Les violations de sanctions' : 'Sanctions violations'}</li>
          </ul>
          <p>{isFr ? 'Toute violation peut entraîner une suspension immédiate et un signalement aux autorités.' : 'Any violation may result in immediate suspension and reporting to authorities.'}</p>
        </section>

        <section>
          <h2>{isFr ? '11. Suspension & Résiliation' : '11. Suspension & Termination'}</h2>
          <p>{isFr ? 'La Société peut suspendre ou résilier l\'accès à sa seule discrétion, notamment en cas de :' : 'The Company may suspend or terminate access at its sole discretion, including in cases of:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Violation des présentes Conditions' : 'Violation of these Terms'}</li>
            <li>{isFr ? 'Indicateurs de fraude' : 'Fraud indicators'}</li>
            <li>{isFr ? 'Préoccupations réglementaires' : 'Regulatory concerns'}</li>
            <li>{isFr ? 'Risques de sécurité' : 'Security risks'}</li>
          </ul>
          <p>{isFr ? 'En cas de résiliation, l\'accès au Service peut cesser immédiatement.' : 'Upon termination, access to the Service may cease immediately.'}</p>
        </section>

        <section>
          <h2>{isFr ? '12. Propriété intellectuelle' : '12. Intellectual Property'}</h2>
          <p>{isFr ? 'La plateforme Siteviral, y compris le design, le logiciel, les marques et l\'image de marque, est la propriété de Hacktualiz Inc.' : 'The Siteviral platform, including design, software, trademarks, and branding, is the property of Hacktualiz Inc.'}</p>
          <p>{isFr ? "Les Utilisateurs conservent la propriété de leur contenu mais accordent à la Société une licence limitée pour héberger et afficher ce contenu dans le cadre du fonctionnement du Service." : 'Users retain ownership of their content but grant the Company a limited license to host and display such content as part of operating the Service.'}</p>
        </section>

        <section>
          <h2>{isFr ? '13. Exclusions de garantie' : '13. Disclaimer of Warranties'}</h2>
          <p>{isFr ? <>Le Service est fourni <strong>« EN L'ÉTAT »</strong> et <strong>« SELON DISPONIBILITÉ ».</strong></> : <>The Service is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE."</strong></>}</p>
          <p>{isFr ? 'La Société ne fournit aucune garantie concernant :' : 'The Company makes no warranties regarding:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'La disponibilité' : 'Availability'}</li>
            <li>{isFr ? 'La fiabilité' : 'Reliability'}</li>
            <li>{isFr ? 'Les résultats financiers' : 'Financial results'}</li>
            <li>{isFr ? 'La génération de revenus' : 'Revenue generation'}</li>
            <li>{isFr ? 'La conformité légale des Organisations' : 'Legal compliance of Organizations'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '14. Limitation de responsabilité' : '14. Limitation of Liability'}</h2>
          <p>{isFr ? 'Dans la mesure maximale permise par la loi, Hacktualiz Inc. ne saurait être tenue responsable de :' : 'To the maximum extent permitted by law, Hacktualiz Inc. shall not be liable for:'}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Dommages indirects ou consécutifs' : 'Indirect or consequential damages'}</li>
            <li>{isFr ? 'Perte de bénéfices' : 'Loss of profits'}</li>
            <li>{isFr ? 'Perte de données' : 'Loss of data'}</li>
            <li>{isFr ? "Interruption d'activité" : 'Business interruption'}</li>
          </ul>
          <p>{isFr ? 'La responsabilité totale ne saurait excéder les frais payés à la Société au cours des 12 mois précédents.' : 'Total liability shall not exceed the fees paid to the Company in the preceding 12 months.'}</p>
        </section>

        <section>
          <h2>{isFr ? '15. Indemnisation' : '15. Indemnification'}</h2>
          <p>{isFr ? <>Vous acceptez d'<strong>indemniser et de dégager de toute responsabilité</strong> Hacktualiz Inc., ses dirigeants, employés et affiliés de toute réclamation découlant de :</> : <>You agree to <strong>indemnify and hold harmless</strong> Hacktualiz Inc., its officers, employees, and affiliates from any claims arising from:</>}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Votre utilisation du Service' : 'Your use of the Service'}</li>
            <li>{isFr ? 'Votre contenu' : 'Your content'}</li>
            <li>{isFr ? 'Votre violation des présentes Conditions' : 'Your violation of these Terms'}</li>
            <li>{isFr ? 'Votre violation de la loi' : 'Your violation of the law'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? '16. Droit applicable' : '16. Governing Law'}</h2>
          <p>
            {isFr
              ? "Les présentes Conditions sont régies par les lois de l'État du Delaware, États-Unis, sans égard aux principes de conflits de lois."
              : 'These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.'}
          </p>
          <p>
            {isFr
              ? 'Tout litige sera résolu devant les tribunaux compétents du Delaware, sauf exigence contraire du droit applicable.'
              : 'Any dispute shall be resolved before the competent courts of Delaware, unless otherwise required by applicable law.'}
          </p>
        </section>

        <section>
          <h2>17. {isFr ? 'Modifications' : 'Changes'}</h2>
          <p>{isFr ? "La Société peut modifier les présentes Conditions à tout moment. L'utilisation continue du Service constitue l'acceptation des Conditions mises à jour." : 'The Company may modify these Terms at any time. Continued use of the Service constitutes acceptance of the updated Terms.'}</p>
        </section>

        <section>
          <h2>18. Contact</h2>
          <p>{isFr ? 'Pour toute question juridique :' : 'For any legal inquiries:'}</p>
          <p className="font-medium">
            Hacktualiz Inc.<br />
            131 Continental Dr, Suite 305<br />
            Newark, DE 19713<br />
            {isFr ? 'États-Unis' : 'United States'}
          </p>
          <p className="font-medium mt-2">
            Contact : <a href="mailto:legal@siteviral.com" className="text-primary underline">legal@siteviral.com</a><br />
            {isFr ? 'Confidentialité' : 'Privacy'} : <a href="mailto:privacy@siteviral.com" className="text-primary underline">privacy@siteviral.com</a>
          </p>
        </section>

        <p className="text-sm text-muted-foreground mt-10 text-center">© 2026 Hacktualiz Inc. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
      </div>
    </LegalPageShell>
  );
}
