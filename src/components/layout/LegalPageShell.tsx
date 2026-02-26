import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteLogo } from '@/components/ui/SiteLogo';
import termsBg from '@/assets/terms-bg.jpg';
import { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nContext';

interface LegalPageShellProps {
  children: ReactNode;
}

export function LegalFooter() {
  const { t } = useI18n();
  return (
    <footer className="relative z-10 border-t border-border/60 py-10 px-4 bg-background/80">
      <div className="container max-w-5xl">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">{t('legal.product')}</h4>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">{t('landing.get_started')}</Link></li>
              <li><Link to="/install" className="hover:text-foreground transition-colors">Install</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">{t('legal.legal')}</h4>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link to="/dpa" className="hover:text-foreground transition-colors">DPA</Link></li>
              <li><Link to="/aml" className="hover:text-foreground transition-colors">AML</Link></li>
              <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund</Link></li>
              <li><Link to="/payout-policy" className="hover:text-foreground transition-colors">Payout</Link></li>
              <li><Link to="/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">{t('legal.trust')}</h4>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link to="/security" className="hover:text-foreground transition-colors">Security</Link></li>
              <li><Link to="/compliance" className="hover:text-foreground transition-colors">Compliance</Link></li>
              <li><Link to="/subprocessors" className="hover:text-foreground transition-colors">Subprocessors</Link></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">{t('legal.company')}</h4>
            <ul className="space-y-1.5 text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">{t('landing.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <SiteLogo size="sm" animate />
          <span className="text-center">© {new Date().getFullYear()} Hacktualiz Inc. · Delaware C-Corp, United States · 131 Continental Dr, Suite 305, Newark, DE 19713</span>
        </div>
      </div>
    </footer>
  );
}

export function LegalHeader() {
  const { t } = useI18n();
  return (
    <header className="fixed top-0 w-full z-50 glass border-b border-border/40">
      <div className="container flex items-center justify-between h-14 px-4">
        <SiteLogo size="md" animate />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" /> {t('legal.back')}</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-xs hidden sm:inline-flex">
            <Link to="/features">Fonctionnalités</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-xs hidden sm:inline-flex">
            <Link to="/faq">FAQ</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function LegalBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <img src={termsBg} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
    </div>
  );
}

const proseClasses = "max-w-none space-y-6 text-foreground text-[15px] sm:text-base font-semibold leading-relaxed [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:font-medium [&_li]:font-medium";

export { proseClasses };

export default function LegalPageShell({ children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <LegalBackground />
      <LegalHeader />
      <main className="relative z-10 container max-w-3xl px-4 pt-24 pb-16">{children}</main>
      <LegalFooter />
    </div>
  );
}
