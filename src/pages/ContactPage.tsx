import { LegalFooter } from '@/components/layout/LegalPageShell';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Globe, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LegalBackground, LegalHeader } from '@/components/layout/LegalPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';

export default function ContactPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t('contact.title') + ' — Siteviral'} description="Contactez Siteviral pour toute question. Support, partenariats, données personnelles." />
      <LegalBackground />
      <LegalHeader />

      <main className="relative z-10 container max-w-3xl px-4 pt-24 pb-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 text-foreground">{t('contact.title')}</h1>
        <p className="text-sm text-muted-foreground mb-10 font-medium">{t('contact.subtitle')}</p>

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

        <div className="mt-10 bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-bold text-foreground">{t('contact.need_help')}</h3>
          <p className="text-sm text-muted-foreground">{t('contact.help_desc')}</p>
          <Button asChild className="bg-primary text-primary-foreground gap-2">
            <Link to="/faq">{t('contact.view_faq')}</Link>
          </Button>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
