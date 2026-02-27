import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/**
 * Lead-capture "White Paper" / Livre Blanc section.
 * Links to the PDF in /public for direct download.
 */
export function LandingWhitePaper() {
  const { t } = useI18n();

  const benefits = [
    t('landing.wp_benefit_1'),
    t('landing.wp_benefit_2'),
    t('landing.wp_benefit_3'),
    t('landing.wp_benefit_4'),
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-elevated">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
            <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row gap-8 items-center">
              {/* Icon */}
              <div className="shrink-0">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">{t('landing.wp_badge')}</Badge>
                <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                  {t('landing.wp_title')}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t('landing.wp_desc')}
                </p>
                <ul className="space-y-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="gap-2 mt-2"
                  onClick={() => window.open('/Present-marktg-SITEVIRAL.pdf', '_blank')}
                >
                  {t('landing.wp_cta')} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
