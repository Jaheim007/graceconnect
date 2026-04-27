import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { SiteLogo } from '@/components/ui/SiteLogo';

export function LandingFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container px-4 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="space-y-3 lg:col-span-1">
            <SiteLogo size="lg" linked={false} />
            <p className="text-sm text-muted-foreground leading-relaxed">{t('landing.footer_desc')}</p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t('landing.footer_product')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/features" className="hover:text-foreground transition-colors">{t('landing.footer_features')}</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">{t('landing.nav_pricing') || 'Pricing'}</Link></li>
              <li><Link to="/ambassador-program" className="hover:text-foreground transition-colors">{t('landing.footer_ambassadors')}</Link></li>
              <li><Link to="/discover" className="hover:text-foreground transition-colors">{t('nav.discover')}</Link></li>
              <li><Link to="/auth?mode=signup" className="hover:text-foreground transition-colors">{t('landing.get_started')}</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/founders" className="hover:text-foreground transition-colors">👑 Founders</Link></li>
              <li><Link to="/changelog" className="hover:text-foreground transition-colors">{t('landing.footer_changelog')}</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t('landing.footer_solutions')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/pour/influenceurs" className="hover:text-foreground transition-colors">{t('nav.persona_influencers')}</Link></li>
              <li><Link to="/pour/eglises" className="hover:text-foreground transition-colors">{t('nav.persona_churches')}</Link></li>
              <li><Link to="/pour/ong" className="hover:text-foreground transition-colors">{t('nav.persona_ngos')}</Link></li>
              <li><Link to="/pour/coachs" className="hover:text-foreground transition-colors">{t('nav.persona_coaches')}</Link></li>
              <li><Link to="/pour/auteurs" className="hover:text-foreground transition-colors">{t('nav.persona_authors')}</Link></li>
              <li><Link to="/pour/entrepreneurs" className="hover:text-foreground transition-colors">{t('nav.persona_entrepreneurs')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t('landing.footer_resources')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/blog" className="hover:text-foreground transition-colors">{t('landing.footer_blog')}</Link></li>
              <li><Link to="/guide/vendre-ebook" className="hover:text-foreground transition-colors">{t('landing.footer_guides')}</Link></li>
              <li><Link to="/calculateur" className="hover:text-foreground transition-colors">{t('landing.footer_calculator')}</Link></li>
              <li><Link to="/etudes-de-cas" className="hover:text-foreground transition-colors">{t('landing.footer_case_studies')}</Link></li>
              <li><Link to="/temoignages" className="hover:text-foreground transition-colors">{t('landing.footer_testimonials')}</Link></li>
              <li><Link to="/comparer" className="hover:text-foreground transition-colors">{t('landing.footer_compare')}</Link></li>
              <li><Link to="/presse" className="hover:text-foreground transition-colors">{t('landing.footer_press')}</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">{t('landing.about')}</Link></li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">{t('landing.footer_legal')} & {t('landing.footer_trust')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground transition-colors">{t('auth.terms_of_service')}</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">{t('auth.privacy_policy')}</Link></li>
              <li><Link to="/aml" className="hover:text-foreground transition-colors">{t('landing.footer_aml')}</Link></li>
              <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">{t('landing.footer_refund')}</Link></li>
              <li><Link to="/security" className="hover:text-foreground transition-colors">{t('landing.footer_security')}</Link></li>
              <li><Link to="/compliance" className="hover:text-foreground transition-colors">{t('landing.footer_compliance')}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">{t('landing.footer_contact')}</Link></li>
              <li><Link to="/help" className="hover:text-foreground transition-colors">{t('landing.footer_help')}</Link></li>
              <li><Link to="/partenaires" className="hover:text-foreground transition-colors">{t('landing.footer_partners')}</Link></li>
              <li><Link to="/status" className="hover:text-foreground transition-colors">{t('landing.footer_status')}</Link></li>
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
