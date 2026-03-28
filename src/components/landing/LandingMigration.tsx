import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface CompRow {
  feature: string;
  siteviral: string | boolean;
  chariow: string | boolean;
  gumroad: string | boolean;
}

export function LandingMigration() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const rows: CompRow[] = isFr ? [
    { feature: 'Prix', siteviral: 'Gratuit', chariow: 'Gratuit', gumroad: '$10/mois' },
    { feature: 'Commission plateforme', siteviral: '10%', chariow: '15%', gumroad: '10%+' },
    { feature: 'Mobile Money Afrique', siteviral: true, chariow: true, gumroad: false },
    { feature: 'Programme ambassadeurs', siteviral: true, chariow: false, gumroad: false },
    { feature: 'IA création de contenu', siteviral: true, chariow: false, gumroad: false },
    { feature: 'CRM & email marketing', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Collecte de dons/offrandes', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Protection anti-piratage', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Widget embed sur ton site', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Multi-devises automatique', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Tableau de bord analytique', siteviral: true, chariow: 'Limité', gumroad: true },
  ] : [
    { feature: 'Price', siteviral: 'Free', chariow: 'Free', gumroad: '$10/mo' },
    { feature: 'Platform fee', siteviral: '10%', chariow: '15%', gumroad: '10%+' },
    { feature: 'Mobile Money Africa', siteviral: true, chariow: true, gumroad: false },
    { feature: 'Ambassador program', siteviral: true, chariow: false, gumroad: false },
    { feature: 'AI content creation', siteviral: true, chariow: false, gumroad: false },
    { feature: 'CRM & email marketing', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Donation collection', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Anti-piracy protection', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Embed widget', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Auto multi-currency', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Analytics dashboard', siteviral: true, chariow: 'Limited', gumroad: true },
  ];

  const renderCell = (val: string | boolean) => {
    if (val === true) return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (val === false) return <X className="h-5 w-5 text-muted-foreground/30" />;
    return <span className="text-sm font-semibold text-foreground">{val}</span>;
  };

  return (
    <section className="py-24 px-4">
      <div className="container max-w-4xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
            {isFr ? (
              <>Pourquoi choisir <span className="text-primary">SiteViral</span> ?</>
            ) : (
              <>Why choose <span className="text-primary">SiteViral</span>?</>
            )}
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            {isFr
              ? "Compare et vois pourquoi les créateurs africains choisissent SiteViral."
              : "Compare and see why African creators choose SiteViral."}
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card overflow-hidden shadow-[var(--shadow-elevated)]"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-5 pl-6 pr-4 font-medium text-muted-foreground w-[40%]" />
                <th className="py-5 px-6 text-center w-[20%]">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-primary font-extrabold text-base">SiteViral</span>
                    <span className="text-[10px] text-primary/60 font-medium">{isFr ? 'Recommandé' : 'Recommended'}</span>
                  </div>
                </th>
                <th className="py-5 px-6 text-center w-[20%]">
                  <span className="font-semibold text-muted-foreground">Chariow</span>
                </th>
                <th className="py-5 px-6 text-center w-[20%]">
                  <span className="font-semibold text-muted-foreground">Gumroad</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20',
                    i % 2 === 0 && 'bg-muted/5'
                  )}
                >
                  <td className="py-4 pl-6 pr-4 font-medium text-foreground">{row.feature}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">{renderCell(row.siteviral)}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">{renderCell(row.chariow)}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center">{renderCell(row.gumroad)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* CTA row */}
          <div className="border-t border-border bg-muted/20 p-8 text-center">
            <Button size="lg" className="gap-2 h-12 px-8 text-sm" onClick={() => navigate('/auth?mode=signup')}>
              {isFr ? 'Commencer gratuitement' : 'Start for free'} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-[11px] text-muted-foreground mt-3">
              {isFr ? '✓ Gratuit · ✓ Pas de carte requise · ✓ Migration en 2 minutes' : '✓ Free · ✓ No card needed · ✓ Migrate in 2 minutes'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
