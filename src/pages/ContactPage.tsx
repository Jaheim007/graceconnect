import { LegalFooter } from '@/components/layout/LegalPageShell';
import { Link } from '@/lib/router-compat';
import { Mail, MapPin, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalBackground, LegalHeader } from '@/components/layout/LegalPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';

export default function ContactPage() {
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t('contact.title') + ' — Siteviral'} description={isFr ? 'Contactez Siteviral pour toute question. Support, partenariats, données personnelles.' : 'Contact Siteviral for any questions. Support, partnerships, personal data.'} />
      <LegalBackground />
      <LegalHeader />

      <main className="relative z-10 container max-w-3xl px-4 pt-24 pb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">{t('contact.title')}</h1>
        <p className="text-sm text-muted-foreground mb-10 font-medium">{t('contact.subtitle')}</p>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
          {isFr ? 'Nos canaux de contact' : 'Ways to reach us'}
        </h2>

        <div className="grid sm:grid-cols-2 gap-6">

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">{t('contact.general')}</h3>
            <p className="text-sm text-muted-foreground">{t('contact.general_desc')}</p>
            <a href="mailto:support@siteviral.com" className="text-sm font-semibold text-primary hover:underline">
              support@siteviral.com
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">{t('contact.partnerships')}</h3>
            <p className="text-sm text-muted-foreground">{t('contact.partnerships_desc')}</p>
            <a href="mailto:business@siteviral.com" className="text-sm font-semibold text-primary hover:underline">
              business@siteviral.com
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">{t('contact.data_privacy')}</h3>
            <p className="text-sm text-muted-foreground">{t('contact.data_privacy_desc')}</p>
            <a href="mailto:privacy@siteviral.com" className="text-sm font-semibold text-primary hover:underline">
              privacy@siteviral.com
            </a>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground">{t('contact.hq')}</h3>
            <p className="text-sm text-muted-foreground">
              Hacktualiz Inc.<br />
              131 Continental Dr, Suite 305<br />
              Newark, DE 19713<br />
              United States
            </p>
          </div>
        </div>

        <div className="mt-10 bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">{t('contact.need_help')}</h2>
          <p className="text-sm text-muted-foreground text-center">{t('contact.help_desc')}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const hp = (form.elements.namedItem('website') as HTMLInputElement)?.value;
              if (hp) return;
              const email = (form.elements.namedItem('contact_email') as HTMLInputElement)?.value;
              const msg = (form.elements.namedItem('contact_message') as HTMLTextAreaElement)?.value;
              if (!email || !msg) return;
              window.location.href = `mailto:support@siteviral.com?subject=Contact%20Siteviral&body=${encodeURIComponent(msg)}`;
            }}
            className="space-y-3 max-w-md mx-auto"
          >
            <input type="text" name="website" autoComplete="off" tabIndex={-1} className="absolute opacity-0 h-0 w-0 pointer-events-none" aria-hidden="true" />
            <input name="contact_email" type="email" required placeholder={isFr ? 'Votre email' : 'Your email'} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm" />
            <textarea name="contact_message" required placeholder={isFr ? 'Votre message' : 'Your message'} rows={4} maxLength={2000} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none" />
            <Button type="submit" className="w-full bg-primary text-primary-foreground">
              {isFr ? 'Ouvrir mon application e-mail' : 'Open my email app'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {isFr
                ? 'Ce bouton ouvre votre application e-mail avec un message pré-rempli adressé à support@siteviral.com. Rien n’est envoyé depuis ce formulaire.'
                : 'This button opens your email app with a pre-filled message to support@siteviral.com. Nothing is sent from this form itself.'}
            </p>

          </form>
          <div className="text-center">
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Link to="/faq">{t('contact.view_faq')}</Link>
            </Button>
          </div>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
