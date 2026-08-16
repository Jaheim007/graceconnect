import LegalPageShell, { proseClasses } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ShieldAlert, CreditCard, Copyright, Bug, Mail } from 'lucide-react';

export default function ReportAbusePage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const channels = [
    { icon: CreditCard, mail: 'fraud@siteviral.com',
      fr: 'Arnaque ou paiement suspect', en: 'Scam or suspicious payment',
      frD: 'Un vendeur demande un paiement hors plateforme, un produit n’a jamais été livré, ou une transaction vous semble frauduleuse.',
      enD: 'A seller asks for payment outside the platform, a product was never delivered, or a transaction looks fraudulent.' },
    { icon: Copyright, mail: 'copyright@siteviral.com',
      fr: 'Contenu volé ou droits d’auteur', en: 'Stolen content or copyright',
      frD: 'Un livre, une formation ou un visuel reprend votre œuvre sans autorisation.',
      enD: 'A book, course or visual reuses your work without permission.', to: '/copyright' },
    { icon: ShieldAlert, mail: 'abuse@siteviral.com',
      fr: 'Abus, haine ou contenu illégal', en: 'Abuse, hate or illegal content',
      frD: 'Harcèlement, contenu haineux, contenu sexuel impliquant des mineurs, ou toute violation de nos règles d’usage.',
      enD: 'Harassment, hateful content, sexual content involving minors, or any breach of our acceptable use rules.', to: '/acceptable-use' },
    { icon: Bug, mail: 'security@siteviral.com',
      fr: 'Faille de sécurité', en: 'Security vulnerability',
      frD: 'Divulgation responsable : décrivez la faille, l’impact et les étapes de reproduction. Ne testez jamais sur des comptes réels.',
      enD: 'Responsible disclosure: describe the flaw, the impact and reproduction steps. Never test against real accounts.', to: '/security' },
  ];

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Signaler un abus — Siteviral' : 'Report abuse — Siteviral'}
        description={isFr
          ? 'Signaler une arnaque, une fraude au paiement, un contenu illégal, une violation de droits d’auteur ou une faille de sécurité sur Siteviral.'
          : 'Report a scam, payment fraud, illegal content, a copyright violation or a security vulnerability on Siteviral.'}
        canonicalUrl="https://siteviral.com/report"
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Signaler un problème' : 'Report a problem'}
      </h1>
      <p className="text-sm text-muted-foreground mb-8 font-medium max-w-xl">
        {isFr
          ? 'Un seul point d’entrée pour les arnaques, les fraudes, les contenus illégaux et les failles de sécurité. Chaque signalement est lu par une personne réelle.'
          : 'One entry point for scams, fraud, illegal content and security flaws. Every report is read by a real person.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {channels.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.mail} className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm flex flex-col">
              <Icon className="h-4 w-4 text-primary mb-2" />
              <p className="font-bold text-sm text-foreground mb-1">{isFr ? c.fr : c.en}</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium mb-3 flex-1">
                {isFr ? c.frD : c.enD}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <a href={`mailto:${c.mail}`}><Mail className="h-3.5 w-3.5 mr-1" />{c.mail}</a>
                </Button>
                {c.to && (
                  <Button asChild size="sm" variant="ghost" className="text-xs">
                    <Link to={c.to}>{isFr ? 'Procédure' : 'Procedure'}</Link>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={proseClasses}>
        <section>
          <h2>{isFr ? 'Ce qu’il faut inclure' : 'What to include'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isFr ? 'Le lien exact (URL) du produit, de la plateforme ou du profil concerné.' : 'The exact link (URL) of the product, platform or profile involved.'}</li>
            <li>{isFr ? 'La date et le montant si un paiement est concerné.' : 'The date and amount if a payment is involved.'}</li>
            <li>{isFr ? 'Des captures d’écran ou des messages qui appuient votre signalement.' : 'Screenshots or messages that support your report.'}</li>
            <li>{isFr ? 'Une adresse e-mail où nous pouvons vous répondre.' : 'An email address where we can reply to you.'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? 'Délais de traitement' : 'Response times'}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{isFr ? 'Accusé de réception :' : 'Acknowledgment:'}</strong> {isFr ? '72 heures' : '72 hours'}</li>
            <li><strong>{isFr ? 'Contenu illégal urgent :' : 'Urgent illegal content:'}</strong> {isFr ? 'retrait sous 24 heures après vérification' : 'removed within 24 hours after review'}</li>
            <li><strong>{isFr ? 'Fraude au paiement :' : 'Payment fraud:'}</strong> {isFr ? 'versement suspendu pendant l’enquête' : 'payout held during the investigation'}</li>
          </ul>
        </section>

        <section>
          <h2>{isFr ? 'Urgence vitale' : 'Life-threatening emergencies'}</h2>
          <p>{isFr
            ? 'Siteviral n’est pas un service d’urgence. En cas de danger immédiat pour une personne, contactez les autorités locales avant de nous écrire.'
            : 'Siteviral is not an emergency service. If someone is in immediate danger, contact your local authorities before writing to us.'}</p>
        </section>

        <section>
          <h2>{isFr ? 'Besoin d’aide simple ?' : 'Just need help?'}</h2>
          <p>{isFr
            ? <>Pour une question de compte, de commande ou de versement, passez par <Link to="/support">le support</Link> ou <Link to="/help">le centre d’aide</Link>.</>
            : <>For an account, order or payout question, use <Link to="/support">support</Link> or the <Link to="/help">help center</Link>.</>}</p>
        </section>
      </div>
    </LegalPageShell>
  );
}
