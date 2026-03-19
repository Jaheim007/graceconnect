import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Users, CheckCircle2, X, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
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
    { feature: 'Commission plateforme', siteviral: '10%', chariow: '15%', gumroad: '10%+' },
    { feature: 'Mobile Money Afrique', siteviral: true, chariow: true, gumroad: false },
    { feature: 'Programme ambassadeurs', siteviral: true, chariow: false, gumroad: false },
    { feature: 'IA création de contenu', siteviral: true, chariow: false, gumroad: false },
    { feature: 'CRM & email marketing', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Widget embed sur ton site', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Webhooks & API', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Multi-devises auto', siteviral: true, chariow: false, gumroad: true },
  ] : [
    { feature: 'Platform fee', siteviral: '10%', chariow: '15%', gumroad: '10%+' },
    { feature: 'Mobile Money Africa', siteviral: true, chariow: true, gumroad: false },
    { feature: 'Ambassador program', siteviral: true, chariow: false, gumroad: false },
    { feature: 'AI content creation', siteviral: true, chariow: false, gumroad: false },
    { feature: 'CRM & email marketing', siteviral: true, chariow: false, gumroad: false },
    { feature: 'Embed widget', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Webhooks & API', siteviral: true, chariow: false, gumroad: true },
    { feature: 'Auto multi-currency', siteviral: true, chariow: false, gumroad: true },
  ];

  const renderCell = (val: string | boolean) => {
    if (val === true) return <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />;
    if (val === false) return <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
    return <span className="text-xs font-bold">{val}</span>;
  };

  return (
    <section className="py-16 px-4">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-card border border-border rounded-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2">
              {isFr ? 'Tu vends déjà ailleurs ? Migre en 2 minutes.' : 'Already selling elsewhere? Migrate in 2 minutes.'}
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {isFr
                ? "Compare et vois pourquoi les créateurs africains choisissent SiteViral."
                : "Compare and see why African creators choose SiteViral."}
            </p>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground" />
                  <th className="py-2 px-3 font-bold text-primary text-center">SiteViral</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground text-center">Chariow</th>
                  <th className="py-2 px-3 font-medium text-muted-foreground text-center">Gumroad</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{row.feature}</td>
                    <td className="py-2.5 px-3 text-center text-primary">{renderCell(row.siteviral)}</td>
                    <td className="py-2.5 px-3 text-center">{renderCell(row.chariow)}</td>
                    <td className="py-2.5 px-3 text-center">{renderCell(row.gumroad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* USP blocks */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {(isFr ? [
              { icon: Shield, title: 'Moins cher', desc: '10% vs 15% sur Chariow. Tu gardes plus.' },
              { icon: Users, title: 'Armée d\'ambassadeurs', desc: 'Tes lecteurs vendent pour toi et gagnent aussi.' },
              { icon: Zap, title: 'IA + Outils pro', desc: 'Crée, vends, analyse. Tout en un seul endroit.' },
            ] : [
              { icon: Shield, title: 'Cheaper', desc: '10% vs 15% on Chariow. You keep more.' },
              { icon: Users, title: 'Ambassador army', desc: 'Your readers sell for you and earn too.' },
              { icon: Zap, title: 'AI + Pro tools', desc: 'Create, sell, analyze. All in one place.' },
            ]).map(block => (
              <div key={block.title} className="bg-muted/50 rounded-xl p-4 text-center">
                <block.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold mb-1">{block.title}</p>
                <p className="text-[10px] text-muted-foreground">{block.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" className="gap-2 h-12 px-8" onClick={() => navigate('/migrer')}>
              {isFr ? 'Importer mon contenu' : 'Import my content'} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-[10px] text-muted-foreground mt-3">
              {isFr ? '⚡ Import en 2 minutes · Gratuit · Aucun engagement' : '⚡ 2-minute import · Free · No commitment'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
