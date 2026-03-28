import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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

  const renderCell = (val: string | boolean, isSiteviral = false) => {
    if (val === true) return (
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center",
        isSiteviral ? "bg-primary/10" : "bg-emerald-500/10"
      )}>
        <CheckCircle2 className={cn("h-4.5 w-4.5", isSiteviral ? "text-primary" : "text-emerald-500")} />
      </div>
    );
    if (val === false) return (
      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50">
        <X className="h-4 w-4 text-muted-foreground/30" />
      </div>
    );
    return <span className="text-sm font-bold text-foreground">{val}</span>;
  };

  return (
    <section className="py-24 sm:py-32 px-4">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
            {isFr ? 'Comparaison' : 'Comparison'}
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            {isFr ? (
              <>Pourquoi choisir <span className="text-primary">SiteViral</span> ?</>
            ) : (
              <>Why choose <span className="text-primary">SiteViral</span>?</>
            )}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
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
          className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg"
        >
          {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '34%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '22%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-6 pl-8 pr-4 font-medium text-muted-foreground">
                    {isFr ? 'Fonctionnalité' : 'Feature'}
                  </th>
                  <th className="py-6 px-4 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-accent" />
                        <span className="text-primary font-extrabold text-lg">SiteViral</span>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold px-3 py-0.5 rounded-full">
                        {isFr ? '⭐ Recommandé' : '⭐ Recommended'}
                      </span>
                    </div>
                  </th>
                  <th className="py-6 px-4 text-center">
                    <span className="font-semibold text-muted-foreground text-base">Chariow</span>
                  </th>
                  <th className="py-6 px-4 text-center">
                    <span className="font-semibold text-muted-foreground text-base">Gumroad</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      'border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30',
                      i % 2 === 0 && 'bg-muted/5'
                    )}
                  >
                    <td className="py-4.5 pl-8 pr-4 font-medium text-foreground text-sm">{row.feature}</td>
                    <td className="py-4.5 px-4">
                      <div className="flex items-center justify-center">{renderCell(row.siteviral, true)}</div>
                    </td>
                    <td className="py-4.5 px-4">
                      <div className="flex items-center justify-center">{renderCell(row.chariow)}</div>
                    </td>
                    <td className="py-4.5 px-4">
                      <div className="flex items-center justify-center">{renderCell(row.gumroad)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA row */}
          <div className="border-t border-border bg-muted/20 p-8 sm:p-10 text-center">
            <Button size="lg" className="gap-2 h-13 px-10 text-base shadow-lg shadow-primary/20" onClick={() => navigate('/auth?mode=signup')}>
              {isFr ? 'Commencer gratuitement' : 'Start for free'} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              {isFr ? '✓ Gratuit · ✓ Pas de carte requise · ✓ Migration en 2 minutes' : '✓ Free · ✓ No card needed · ✓ Migrate in 2 minutes'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
