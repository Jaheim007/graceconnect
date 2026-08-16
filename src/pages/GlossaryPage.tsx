import { useMemo, useState } from 'react';
import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

type Entry = { term: string; def: string };

export default function GlossaryPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [q, setQ] = useState('');

  const entries: Entry[] = isFr ? [
    { term: 'Ambassadeur', def: 'Une personne qui promeut le produit d’un créateur et touche une commission sur chaque vente attribuée (attribution last-click, 7 jours).' },
    { term: 'Attribution', def: 'Le mécanisme qui détermine à quel ambassadeur ou lien une vente est créditée.' },
    { term: 'Brouillon', def: 'Un contenu enregistré mais non publié. Les brouillons ne sont visibles que dans votre espace.' },
    { term: 'Crédit', def: 'L’unité qui mesure l’usage de l’IA (génération de livre, formation, chat). Un échange de chat coûte une fraction de crédit.' },
    { term: 'Creators Studio', def: 'L’assistant conversationnel de Siteviral : il crée, structure et publie vos contenus à partir d’une conversation.' },
    { term: 'Espace (plateforme)', def: 'Votre boutique et votre tableau de bord : vos produits, vos ventes, vos membres et vos réglages de paiement.' },
    { term: 'Flyer', def: 'Une image de promotion générée automatiquement pour un produit, avec titre, prix et QR code vers votre page de vente.' },
    { term: 'Formation', def: 'Un cours structuré en modules et leçons, avec quiz, flashcards et certificat à la fin.' },
    { term: 'Giving (Dons)', def: 'Le module de collecte pour les églises, ONG et communautés : dons ponctuels ou récurrents.' },
    { term: 'KYC', def: 'La vérification d’identité exigée avant un premier versement, pour lutter contre la fraude et le blanchiment.' },
    { term: 'MCP', def: 'Model Context Protocol : le standard qui permet à un assistant IA externe (Claude, ChatGPT, Gemini) de piloter Siteviral via des outils.' },
    { term: 'Mobile Money', def: 'Les paiements par portefeuille mobile (Orange Money, MTN MoMo, Wave…), le moyen de paiement principal de Siteviral.' },
    { term: 'Palier de prix', def: 'Une offre tarifaire pour un même contenu (par exemple Essentiel, Complet, Premium) avec un accès différent.' },
    { term: 'Versement (payout)', def: 'Le transfert de votre solde disponible vers votre compte Mobile Money ou bancaire, après vérification.' },
    { term: 'Solde disponible', def: 'La part de vos revenus déjà encaissés, hors litiges et hors période de rétention, que vous pouvez demander en versement.' },
    { term: 'Certificat', def: 'Le PDF signé délivré à un apprenant qui termine une formation, vérifiable publiquement via son code.' },
  ] : [
    { term: 'Ambassador', def: 'Someone who promotes a creator’s product and earns a commission on every attributed sale (last-click attribution, 7 days).' },
    { term: 'Attribution', def: 'The mechanism that decides which ambassador or link a sale is credited to.' },
    { term: 'Available balance', def: 'The portion of your collected revenue, excluding disputes and holding periods, that you can request as a payout.' },
    { term: 'Certificate', def: 'The signed PDF issued to a learner who completes a formation, publicly verifiable through its code.' },
    { term: 'Credit', def: 'The unit that measures AI usage (book generation, formation, chat). One chat exchange costs a fraction of a credit.' },
    { term: 'Creators Studio', def: 'Siteviral’s conversational assistant: it creates, structures and publishes your content from a conversation.' },
    { term: 'Draft', def: 'Content that is saved but not published. Drafts are only visible inside your workspace.' },
    { term: 'Flyer', def: 'A promotional image generated automatically for a product, with title, price and a QR code to your sales page.' },
    { term: 'Formation', def: 'A course structured into modules and lessons, with quizzes, flashcards and a certificate at the end.' },
    { term: 'Giving', def: 'The collection module for churches, NGOs and communities: one-off or recurring donations.' },
    { term: 'KYC', def: 'The identity verification required before a first payout, to prevent fraud and money laundering.' },
    { term: 'MCP', def: 'Model Context Protocol: the standard that lets an external AI assistant (Claude, ChatGPT, Gemini) drive Siteviral through tools.' },
    { term: 'Mobile Money', def: 'Mobile wallet payments (Orange Money, MTN MoMo, Wave…), Siteviral’s primary payment method.' },
    { term: 'Payout', def: 'The transfer of your available balance to your Mobile Money or bank account, after verification.' },
    { term: 'Pricing tier', def: 'A price option for the same content (for example Essential, Complete, Premium) granting different access.' },
    { term: 'Workspace (platform)', def: 'Your storefront and dashboard: your products, sales, members and payment settings.' },
  ];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return entries;
    return entries.filter(e => e.term.toLowerCase().includes(s) || e.def.toLowerCase().includes(s));
  }, [q, entries]);

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Glossaire Siteviral — tous les termes expliqués' : 'Siteviral Glossary — every term explained'}
        description={isFr
          ? 'Crédits, versements, ambassadeurs, MCP, paliers de prix : le vocabulaire de Siteviral expliqué simplement.'
          : 'Credits, payouts, ambassadors, MCP, pricing tiers: Siteviral vocabulary explained in plain language.'}
        canonicalUrl="https://siteviral.com/glossary"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Glossaire' : 'Glossary'}
      </h1>
      <p className="text-muted-foreground mb-6 max-w-2xl">
        {isFr
          ? 'Le vocabulaire de Siteviral, expliqué sans jargon. Cherchez un mot pour comprendre exactement ce qu’il change pour vous.'
          : 'Siteviral vocabulary, explained without jargon. Search a word to see exactly what it changes for you.'}
      </p>

      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={isFr ? 'Chercher un terme…' : 'Search a term…'}
          className="pl-9"
          aria-label={isFr ? 'Chercher un terme' : 'Search a term'}
        />
      </div>

      <dl className="space-y-3">
        {filtered.map(e => (
          <div key={e.term} className="rounded-xl border border-border bg-card/50 p-4">
            <dt className="font-bold text-foreground">{e.term}</dt>
            <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">{e.def}</dd>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Aucun terme trouvé. Écrivez-nous à support@siteviral.com.' : 'No term found. Write to us at support@siteviral.com.'}
          </p>
        )}
      </dl>
    </LegalPageShell>
  );
}
