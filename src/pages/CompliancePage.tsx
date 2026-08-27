import LegalPageShell from '@/components/layout/LegalPageShell';
import { Shield, CheckCircle } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';

export default function CompliancePage() {
  const { t } = useI18n();

  const regulations = [
    { title: 'AML / KYC', key: 'compliance.aml_desc' },
    { title: 'GDPR / RGPD', key: 'compliance.gdpr_desc' },
    { title: 'Lois US sur la vie privée', key: 'compliance.us_privacy_desc' },
    { title: 'PCI-DSS', key: 'compliance.pci_desc' },
    { title: 'Sanctions (OFAC / EU)', key: 'compliance.sanctions_desc' },
  ];

  const securityKeys = Array.from({ length: 8 }, (_, i) => `compliance.sec_${i + 1}`);

  const docs = [
    { key: 'compliance.doc_aml', to: '/aml' },
    { key: 'compliance.doc_privacy', to: '/privacy' },
    { key: 'compliance.doc_dpa', to: '/dpa' },
    { key: 'compliance.doc_security', to: '/security' },
    { key: 'compliance.doc_subprocessors', to: '/subprocessors' },
    { key: 'compliance.doc_acceptable', to: '/acceptable-use' },
  ];

  return (
    <LegalPageShell>
      <SEOHead title="Compliance — Siteviral" description="Siteviral compliance: AML/KYC, GDPR, PCI-DSS, OFAC sanctions. Full regulatory transparency." canonicalUrl="https://siteviral.com/compliance" />
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">{t('compliance.title')}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8 font-medium">{t('compliance.subtitle')}</p>

      <div className="space-y-8 text-foreground text-[15px] sm:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-extrabold mb-3">{t('compliance.legal_entity')}</h2>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="font-semibold">Hacktualiz Inc.</p>
            <p className="text-muted-foreground text-sm mt-1">
              Delaware C-Corporation, registered in the State of Delaware (USA).<br />
              131 Continental Dr, Suite 305, Newark, DE 19713, United States.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">{t('compliance.regulatory')}</h2>
          <div className="space-y-3">
            {regulations.map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-card border border-border rounded-xl p-4">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-muted-foreground text-sm mt-0.5">{t(item.key)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">{t('compliance.security_measures')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {securityKeys.map((key) => (
              <div key={key} className="flex items-center gap-2 text-sm bg-card border border-border rounded-lg p-3">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{t(key)}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">{t('compliance.documentation')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {docs.map((link) => (
              <Link key={link.to} to={link.to} className="bg-card border border-border rounded-lg p-3 text-sm font-semibold text-primary hover:bg-muted/50 transition-colors">
                {t(link.key)} →
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">{t('compliance.contact')}</h2>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">
              {t('compliance.contact_desc')}
            </p>
            <p className="font-semibold text-sm mt-2">
              Email : <a href="mailto:compliance@siteviral.com" className="text-primary">compliance@siteviral.com</a>
            </p>
          </div>
        </section>
      </div>
    </LegalPageShell>
  );
}
