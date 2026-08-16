import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useI18n } from '@/i18n/I18nContext';
import { Check, X } from 'lucide-react';

export default function BrandKitPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const dos = isFr ? [
    'Utiliser le logo Siteviral tel quel, sans le redessiner.',
    'Laisser une marge libre égale à la hauteur du « S » autour du logo.',
    'Écrire « Siteviral » en un seul mot, avec un S majuscule.',
    'Dire « Publié avec Siteviral » ou « Paiements via Siteviral ».',
  ] : [
    'Use the Siteviral logo as provided, without redrawing it.',
    'Keep clear space around the logo equal to the height of the “S”.',
    'Write “Siteviral” as one word, with a capital S.',
    'Say “Published with Siteviral” or “Payments via Siteviral”.',
  ];

  const donts = isFr ? [
    'Modifier les couleurs, l’ombre ou les proportions du logo.',
    'Placer le logo sur un fond qui nuit à la lisibilité.',
    'Utiliser notre marque pour suggérer un partenariat ou une approbation non accordée.',
    'Écrire « SiteViral », « Site Viral » ou « site-viral » dans un texte officiel.',
  ] : [
    'Alter the logo colors, shadow or proportions.',
    'Place the logo on a background that harms legibility.',
    'Use our brand to imply a partnership or endorsement that was not granted.',
    'Write “SiteViral”, “Site Viral” or “site-viral” in official copy.',
  ];

  const palette = [
    { name: isFr ? 'Navy de marque' : 'Brand navy', hex: '#0B1B3A' },
    { name: isFr ? 'Bleu action' : 'Action blue', hex: '#1D5BFF' },
    { name: isFr ? 'Or accent' : 'Accent gold', hex: '#D4AF37' },
    { name: isFr ? 'Ivoire' : 'Ivory', hex: '#F7F4EC' },
    { name: isFr ? 'Encre' : 'Ink', hex: '#0A0A0B' },
  ];

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Marque & kit média — Siteviral' : 'Brand & Media Kit — Siteviral'}
        description={isFr
          ? 'Logo, couleurs, typographie et règles d’usage de la marque Siteviral pour la presse, les partenaires et les créateurs.'
          : 'Logo, colors, typography and usage rules for the Siteviral brand, for press, partners and creators.'}
        canonicalUrl="https://siteviral.com/brand"
      />
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">
        {isFr ? 'Marque & kit média' : 'Brand & media kit'}
      </h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        {isFr
          ? 'Tout ce qu’il faut pour parler de Siteviral correctement : logo, couleurs, typographie et formulation officielle.'
          : 'Everything you need to talk about Siteviral correctly: logo, colors, typography and official wording.'}
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">{isFr ? 'Le logo' : 'The logo'}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-background p-8 flex items-center justify-center">
            <SiteLogo size="lg" linked={false} />
          </div>
          <div className="rounded-2xl border border-border bg-foreground/95 p-8 flex items-center justify-center">
            <div className="dark"><SiteLogo size="lg" linked={false} /></div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {isFr
            ? 'Besoin des fichiers vectoriels (SVG, PNG transparent) ? Écrivez à press@siteviral.com et nous vous envoyons le pack complet.'
            : 'Need vector files (SVG, transparent PNG)? Email press@siteviral.com and we will send the full pack.'}
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">{isFr ? 'Couleurs' : 'Colors'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {palette.map(c => (
            <div key={c.hex} className="rounded-xl border border-border overflow-hidden">
              <div className="h-20" style={{ background: c.hex }} />
              <div className="p-2.5">
                <p className="text-xs font-semibold text-foreground">{c.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">{isFr ? 'Typographie' : 'Typography'}</h2>
        <div className="rounded-2xl border border-border p-6 space-y-3">
          <p className="font-heading text-3xl font-extrabold">Bricolage Grotesque — {isFr ? 'titres' : 'headings'}</p>
          <p className="text-base text-muted-foreground">Inter — {isFr ? 'texte courant, interfaces et documents' : 'body copy, interfaces and documents'}</p>
        </div>
      </section>

      <section className="mb-10 grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-foreground">
            <Check className="h-4 w-4 text-primary" /> {isFr ? 'À faire' : 'Do'}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {dos.map(d => <li key={d}>• {d}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-border p-6">
          <h3 className="font-bold mb-3 flex items-center gap-2 text-foreground">
            <X className="h-4 w-4 text-destructive" /> {isFr ? 'À éviter' : 'Don’t'}
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {donts.map(d => <li key={d}>• {d}</li>)}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">{isFr ? 'Description officielle' : 'Official boilerplate'}</h2>
        <div className="rounded-2xl border border-border bg-card/50 p-6 text-sm text-muted-foreground leading-relaxed">
          {isFr
            ? 'Siteviral est une plateforme qui permet à toute personne d’écrire un livre ou une formation avec l’aide de l’IA, de le publier sur sa propre page de vente, et d’être payée en Mobile Money. Églises, ONG et communautés l’utilisent aussi pour collecter des dons et diffuser leur contenu.'
            : 'Siteviral is a platform that lets anyone write a book or a formation with AI, publish it on their own sales page, and get paid by Mobile Money. Churches, NGOs and communities also use it to collect donations and distribute their content.'}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {isFr ? 'Contact presse : press@siteviral.com' : 'Press contact: press@siteviral.com'}
        </p>
      </section>
    </LegalPageShell>
  );
}
