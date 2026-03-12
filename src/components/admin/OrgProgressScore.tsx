import { useOrg } from '@/contexts/OrgContext';
import { useOrgMedia } from '@/hooks/useMedia';
import { useOrgProducts, useOrgCampaigns } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useOrgOfferings } from '@/hooks/useOfferings';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import {
  Trophy, Star, Zap, Crown, TrendingUp, CheckCircle2
} from 'lucide-react';

type OrgTier = 'starter' | 'actif' | 'performer' | 'leader';

interface TierConfig {
  key: OrgTier;
  label: string;
  labelEn: string;
  icon: typeof Trophy;
  minScore: number;
  color: string;
  bg: string;
  border: string;
}

const TIERS: TierConfig[] = [
  { key: 'starter', label: 'Starter', labelEn: 'Starter', icon: Star, minScore: 0, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-muted' },
  { key: 'actif', label: 'Actif', labelEn: 'Active', icon: Zap, minScore: 30, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { key: 'performer', label: 'Performer', labelEn: 'Performer', icon: TrendingUp, minScore: 60, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { key: 'leader', label: 'Leader', labelEn: 'Leader', icon: Crown, minScore: 85, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
];

function getTier(score: number): TierConfig {
  let tier = TIERS[0];
  for (const t of TIERS) {
    if (score >= t.minScore) tier = t;
  }
  return tier;
}

function getNextTier(current: TierConfig): TierConfig | null {
  const idx = TIERS.findIndex(t => t.key === current.key);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

interface StepDef { key: string; label: string; weight: number; done: boolean }

export function useOrgScore(orgId: string | undefined) {
  const { currentOrg } = useOrg();
  const org = currentOrg;
  const { data: media = [] } = useOrgMedia(orgId, false);
  const { data: products = [] } = useOrgProducts(orgId, false);
  const { data: campaigns = [] } = useOrgCampaigns(orgId, false);
  const { data: members = [] } = useOrgMembers(orgId);
  const { data: offerings = [] } = useOrgOfferings(orgId, false);

  const { data: salesCount = 0 } = useQuery({
    queryKey: ['org-sales-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId).eq('status', 'completed');
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: affiliateCount = 0 } = useQuery({
    queryKey: ['org-affiliate-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('affiliate_links')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId).eq('is_active', true);
      return count || 0;
    },
    enabled: !!orgId,
  });

  // Steps use stable keys for matching, labels are for display only
  const steps: StepDef[] = [
    { key: 'logo', label: 'logo', weight: 8, done: !!(org?.logo_url || org?.banner_url) },
    { key: 'description', label: 'description', weight: 8, done: !!(org?.description && org.description.length > 20) },
    { key: 'first-content', label: 'first-content', weight: 12, done: media.some(m => m.is_published) },
    { key: 'first-product', label: 'first-product', weight: 12, done: products.some(p => p.is_published) },
    { key: 'donations', label: 'donations', weight: 8, done: campaigns.length > 0 || offerings.length > 0 },
    { key: 'members-3', label: 'members-3', weight: 8, done: members.length >= 3 },
    { key: 'kyc', label: 'kyc', weight: 12, done: org?.kyc_status === 'level1' || org?.kyc_status === 'level2' },
    { key: 'first-sale', label: 'first-sale', weight: 15, done: salesCount > 0 },
    { key: 'ambassadors', label: 'ambassadors', weight: 10, done: affiliateCount >= 3 },
    { key: 'contact', label: 'contact', weight: 7, done: !!(org?.whatsapp || org?.website) },
  ];

  const score = steps.reduce((sum, s) => sum + (s.done ? s.weight : 0), 0);
  const tier = getTier(score);
  const nextTier = getNextTier(tier);
  const nextStep = steps.find(s => !s.done);

  return { score, steps, tier, nextTier, nextStep };
}

const STEP_LABELS: Record<string, { fr: string; en: string }> = {
  'logo': { fr: 'Logo ou bannière', en: 'Logo or banner' },
  'description': { fr: 'Description complète', en: 'Full description' },
  'first-content': { fr: 'Premier contenu publié', en: 'First content published' },
  'first-product': { fr: 'Premier produit publié', en: 'First product published' },
  'donations': { fr: 'Module dons activé', en: 'Donations enabled' },
  'members-3': { fr: 'Au moins 3 membres', en: 'At least 3 members' },
  'kyc': { fr: 'Identité vérifiée', en: 'Identity verified' },
  'first-sale': { fr: 'Première vente', en: 'First sale' },
  'ambassadors': { fr: 'Ambassadeurs actifs (3+)', en: 'Active ambassadors (3+)' },
  'contact': { fr: 'WhatsApp ou site web', en: 'WhatsApp or website' },
};

export function OrgProgressScore() {
  const { currentOrg } = useOrg();
  const { score, steps, tier, nextTier, nextStep } = useOrgScore(currentOrg?.id);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const TierIcon = tier.icon;
  const completedCount = steps.filter(s => s.done).length;
  const tierLabel = isFr ? tier.label : tier.labelEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center border', tier.bg, tier.border)}>
            <TierIcon className={cn('h-5 w-5', tier.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-bold uppercase tracking-wider', tier.color)}>{tierLabel}</span>
              {nextTier && (
                <span className="text-[10px] text-muted-foreground">
                  → {isFr ? nextTier.label : nextTier.labelEn} {isFr ? 'à' : 'at'} {nextTier.minScore}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{completedCount}/{steps.length} {isFr ? 'étapes complétées' : 'steps completed'}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black tabular-nums">{score}</span>
          <span className="text-sm text-muted-foreground font-medium">%</span>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r from-primary to-primary/70')}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {TIERS.map((t) => (
            <div key={t.key} className="flex flex-col items-center" style={{ position: 'absolute', left: `${t.minScore}%`, transform: 'translateX(-50%)' }}>
              <div className={cn('w-1.5 h-1.5 rounded-full mt-1', score >= t.minScore ? 'bg-primary' : 'bg-muted-foreground/30')} />
              <span className={cn('text-[8px] mt-0.5', score >= t.minScore ? 'text-primary font-semibold' : 'text-muted-foreground/50')}>
                {isFr ? t.label : t.labelEn}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1 mt-6">
        {steps.map((step) => {
          const labels = STEP_LABELS[step.key] || { fr: step.key, en: step.key };
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg',
                step.done ? 'text-muted-foreground/60' : 'text-foreground'
              )}
            >
              <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0', step.done ? 'text-primary' : 'text-muted-foreground/30')} />
              <span className={cn(step.done && 'line-through')}>{isFr ? labels.fr : labels.en}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">+{step.weight}%</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
