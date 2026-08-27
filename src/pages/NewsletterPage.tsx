import { useState } from 'react';
import LegalPageShell from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, TrendingUp, BookOpen, CheckCircle2 } from 'lucide-react';

export default function NewsletterPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [email, setEmail] = useState('');

  const benefits = [
    { icon: Sparkles, fr: 'Nouveautés produit', en: 'Product updates',
      frD: 'Les nouvelles fonctions du Studio IA, des paiements et du programme ambassadeur, expliquées simplement.',
      enD: 'New AI Studio, payments and ambassador features, explained in plain language.' },
    { icon: TrendingUp, fr: 'Tactiques de vente', en: 'Selling tactics',
      frD: 'Ce qui fonctionne réellement pour vendre un livre ou une formation en Afrique francophone.',
      enD: 'What actually works to sell a book or a course in francophone Africa.' },
    { icon: BookOpen, fr: 'Histoires de créateurs', en: 'Creator stories',
      frD: 'Des exemples concrets : prix, canal de diffusion, chiffres.',
      enD: 'Concrete examples: pricing, distribution channel, real numbers.' },
  ];

  const mailto = `mailto:hello@siteviral.com?subject=${encodeURIComponent(isFr ? 'Inscription newsletter' : 'Newsletter signup')}&body=${encodeURIComponent(email)}`;

  return (
    <LegalPageShell>
      <SEOHead
        title={isFr ? 'Newsletter Siteviral — vendre son savoir' : 'Siteviral Newsletter — sell your knowledge'}
        description={isFr
          ? 'Une lettre courte, une à deux fois par mois : nouveautés Siteviral, tactiques de vente et histoires de créateurs.'
          : 'A short letter, once or twice a month: Siteviral updates, selling tactics and creator stories.'}
        canonicalUrl="https://siteviral.com/newsletter"
      />

      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-5 w-5 text-primary" />
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {isFr ? '1 à 2 e-mails par mois' : '1–2 emails a month'}
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 text-foreground">
        {isFr ? 'La lettre Siteviral' : 'The Siteviral letter'}
      </h1>
      <p className="text-base text-muted-foreground mb-8 font-medium max-w-xl leading-relaxed">
        {isFr
          ? 'Pour les auteurs, formateurs, coachs et églises qui veulent transformer leur savoir en revenu. Court, concret, sans spam. Désinscription en un clic.'
          : 'For authors, trainers, coaches and churches turning knowledge into income. Short, concrete, no spam. One-click unsubscribe.'}
      </p>

      <form
        className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-xs mb-10"
        onSubmit={(e) => { e.preventDefault(); window.location.href = mailto; }}
      >
        <label htmlFor="newsletter-email" className="block text-sm font-bold mb-2 text-foreground">
          {isFr ? 'Votre adresse e-mail' : 'Your email address'}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isFr ? 'vous@exemple.com' : 'you@example.com'}
            className="sm:flex-1"
          />
          <Button type="submit">{isFr ? "S'inscrire" : 'Subscribe'}</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-medium">
          {isFr ? <>En vous inscrivant, vous acceptez notre <Link to="/privacy" className="underline">politique de confidentialité</Link>.</>
                : <>By subscribing you agree to our <Link to="/privacy" className="underline">privacy policy</Link>.</>}
        </p>
      </form>

      <h2 className="text-xl font-extrabold mb-4 text-foreground">{isFr ? 'Ce que vous recevez' : 'What you get'}</h2>
      <div className="grid gap-3 sm:grid-cols-3 mb-10">
        {benefits.map(b => {
          const Icon = b.icon;
          return (
            <div key={b.en} className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xs">
              <Icon className="h-4 w-4 text-primary mb-2" />
              <p className="font-bold text-sm text-foreground mb-1">{isFr ? b.fr : b.en}</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">{isFr ? b.frD : b.enD}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">{isFr ? 'Nos engagements' : 'Our promises'}</p>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 font-medium list-disc pl-5">
          <li>{isFr ? 'Jamais de revente ni de partage de votre adresse.' : 'We never sell or share your address.'}</li>
          <li>{isFr ? 'Deux e-mails par mois au maximum.' : 'Two emails per month maximum.'}</li>
          <li>{isFr ? 'Désinscription immédiate depuis chaque e-mail.' : 'Instant unsubscribe from every email.'}</li>
        </ul>
      </div>
    </LegalPageShell>
  );
}
