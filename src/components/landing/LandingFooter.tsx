import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { SiteLogo } from '@/components/ui/SiteLogo';
export function LandingFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container px-4 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-3">
            <SiteLogo size="lg" linked={false} />
            <p className="text-sm text-muted-foreground leading-relaxed">{t('landing.footer_desc')}</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t('landing.footer_product')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-foreground transition-colors">{t('landing.footer_features')}</Link></li>
              <li><Link to="/ambassador-program" className="hover:text-foreground transition-colors">{t('landing.footer_ambassadors')}</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">{t('landing.about')}</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">{t('landing.get_started')}</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t('landing.footer_legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground transition-colors">{t('auth.terms_of_service')}</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">{t('auth.privacy_policy')}</Link></li>
              <li><Link to="/aml" className="hover:text-foreground transition-colors">{t('landing.footer_aml')}</Link></li>
              <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">{t('landing.footer_refund')}</Link></li>
              <li><Link to="/payout-policy" className="hover:text-foreground transition-colors">{t('landing.footer_payout')}</Link></li>
              <li><Link to="/acceptable-use" className="hover:text-foreground transition-colors">{t('landing.footer_acceptable')}</Link></li>
              <li><Link to="/dpa" className="hover:text-foreground transition-colors">{t('landing.footer_dpa')}</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t('landing.footer_trust')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/security" className="hover:text-foreground transition-colors">{t('landing.footer_security')}</Link></li>
              <li><Link to="/compliance" className="hover:text-foreground transition-colors">{t('landing.footer_compliance')}</Link></li>
              <li><Link to="/subprocessors" className="hover:text-foreground transition-colors">{t('landing.footer_subprocessors')}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">{t('landing.footer_contact')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Hacktualiz Inc. {t('landing.footer_rights')}</span>
          <span>{t('landing.footer_infra')}</span>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground/60 text-center">
          {t('landing.footer_operated')}{' '}
          {t('landing.footer_data_requests')}{' '}
          <a href="mailto:privacy@siteviral.com" className="underline hover:text-foreground transition-colors">privacy@siteviral.com</a>.
        </p>
      </div>
    </footer>
  );
}
