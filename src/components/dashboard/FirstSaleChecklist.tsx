import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/hooks/useClientAnalytics';
import type { SiteviralType } from '@/types/database';

interface Step {
  id: string;
  label: { fr: string; en: string };
  cta: { fr: string; en: string };
  done: boolean;
  href?: string;
  onClick?: () => void;
}

/**
 * "Your first sale in 24h" — guided onboarding checklist for creators.
 *
 * Reads existing data (org, products, ambassador status, sales) to compute
 * progress. Persists collapsed/dismissed state in localStorage.
 *
 * Auto-hides once the user has at least one completed sale OR has dismissed it.
 */
export function FirstSaleChecklist() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  const storageKey = `first_sale_checklist_v1_${user?.id || 'anon'}`;

  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return;
    const raw = localStorage.getItem(storageKey);
    if (raw === 'dismissed') setDismissed(true);
    else if (raw === 'collapsed') setCollapsed(true);
  }, [storageKey, user?.id]);

  const orgId = currentOrg?.id;

  // ── Signals (read-only, no business logic changes) ──
  const { data: signals } = useQuery({
    queryKey: ['first-sale-signals', orgId, user?.id],
    queryFn: async () => {
      if (!orgId || !user?.id) return null;

      const [productsRes, salesRes, affRes, orgRes, progRes, campRes, annRes, churchRes] = await Promise.all([
        db.from('digital_products').select('id, is_published').eq('organization_id', orgId).limit(5),
        db.from('product_purchases').select('id').eq('organization_id', orgId).eq('status', 'completed').limit(1),
        db.from('affiliate_links').select('code').eq('user_id', user.id).limit(1),
        db.from('organizations').select('logo_url, description').eq('id', orgId).maybeSingle(),
        db.from('programs').select('id').eq('organization_id', orgId).limit(1),
        db.from('donation_campaigns').select('id').eq('organization_id', orgId).limit(1),
        db.from('announcements').select('id').eq('organization_id', orgId).limit(1),
        db.from('church_providers').select('id').eq('user_id', user.id).maybeSingle(),
      ]);

      let hasSermon = false;
      const churchId = (churchRes as any)?.data?.id as string | undefined;
      if (churchId) {
        const { data } = await db.from('church_sermons').select('id').eq('church_id', churchId).limit(1);
        hasSermon = (data || []).length > 0;
      }

      const products = productsRes.data || [];
      return {
        hasOrg: true,
        hasProduct: products.length > 0,
        hasPublishedProduct: products.some((p: any) => p.is_published),
        hasSale: (salesRes.data || []).length > 0,
        hasAffiliateCode: (affRes.data || []).length > 0,
        hasOrgBranding: !!(orgRes.data?.logo_url && orgRes.data?.description),
        hasProgram: (progRes.data || []).length > 0,
        hasCampaign: (campRes.data || []).length > 0,
        hasAnnouncement: (annRes.data || []).length > 0,
        hasSermon,
      };
    },
    enabled: !!orgId && !!user?.id,
    staleTime: 60_000,
  });


  const type = (currentOrg?.siteviral_type as SiteviralType | null) ?? null;

  const steps: Step[] = useMemo(() => {
    const s = signals;
    return buildStepsForType(type, s, navigate);
  }, [signals, navigate, type]);

  const completedCount = steps.filter(s => s.done).length;
  const total = steps.length;
  const percent = Math.round((completedCount / total) * 100);

  // Auto-hide once user has a sale (success state) or dismissed
  if (dismissed || signals?.hasSale) return null;
  if (!signals) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, 'dismissed');
    trackEvent('first_sale_checklist_dismissed', { completed: completedCount }, user?.id);
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (next) localStorage.setItem(storageKey, 'collapsed');
    else localStorage.removeItem(storageKey);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base truncate">
              {goalTitle(type, isFr)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{total} {isFr ? 'étapes' : 'steps'} · {percent}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="h-7 w-7">
            <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed && '-rotate-90')} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-7 w-7 text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Progress value={percent} className="h-1.5 mb-3" />

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {steps.map(step => (
              <li
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors',
                  step.done ? 'opacity-60' : 'hover:bg-muted/50',
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={cn('text-sm flex-1 min-w-0 truncate', step.done && 'line-through')}>
                  {step.label[isFr ? 'fr' : 'en']}
                </span>
                {!step.done && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      trackEvent('first_sale_step_click', { step: step.id }, user?.id);
                      step.onClick?.();
                    }}
                    className="h-7 px-2 text-xs shrink-0"
                  >
                    {step.cta[isFr ? 'fr' : 'en']}
                  </Button>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Per-vertical checklist
// ────────────────────────────────────────────────────────────

type Signals = {
  hasOrg: boolean;
  hasProduct: boolean;
  hasPublishedProduct: boolean;
  hasSale: boolean;
  hasAffiliateCode: boolean;
  hasOrgBranding: boolean;
} | null | undefined;

function goalTitle(type: SiteviralType | null, isFr: boolean): string {
  switch (type) {
    case 'artisans_home_services':
      return isFr ? 'Ta première intervention en 48h' : 'Your first job in 48h';
    case 'beauty':
      return isFr ? 'Ton premier rendez-vous en 48h' : 'Your first booking in 48h';
    case 'tutors_home_teachers':
      return isFr ? 'Ta première session en 48h' : 'Your first session in 48h';
    case 'church':
      return isFr ? 'Ton premier don en 48h' : 'Your first gift in 48h';
    case 'instrumentists':
    case 'sport':
    case 'services':
    case 'influencers':
      return isFr ? 'Ta première réservation en 48h' : 'Your first booking in 48h';
    default:
      return isFr ? 'Ta première vente en 24h' : 'Your first sale in 24h';
  }
}

function buildStepsForType(
  type: SiteviralType | null,
  s: Signals,
  navigate: (to: string) => void,
): Step[] {
  const branding: Step = {
    id: 'branding',
    label: { fr: 'Ajoute logo + description', en: 'Add logo + description' },
    cta: { fr: 'Personnaliser', en: 'Customize' },
    done: !!s?.hasOrgBranding,
    onClick: () => navigate('/admin/settings'),
  };

  // Artisan / home services
  if (type === 'artisans_home_services') {
    return [
      branding,
      { id: 'kyc', label: { fr: 'Vérifie ton identité (KYC)', en: 'Verify your identity (KYC)' },
        cta: { fr: 'Vérifier', en: 'Verify' }, done: false,
        onClick: () => navigate('/home/pro/kyc') },
      { id: 'services', label: { fr: 'Ajoute tes services et tarifs', en: 'Add your services & prices' },
        cta: { fr: 'Ajouter', en: 'Add' }, done: false,
        onClick: () => navigate('/home/pro/services') },
      { id: 'zone', label: { fr: 'Définis ta zone d\'intervention', en: 'Set your service area' },
        cta: { fr: 'Définir', en: 'Set' }, done: false,
        onClick: () => navigate('/admin/settings') },
      { id: 'share', label: { fr: 'Partage ton profil sur 1 réseau', en: 'Share your profile on 1 channel' },
        cta: { fr: 'Partager', en: 'Share' }, done: false,
        onClick: () => navigate('/home/pro') },
    ];
  }

  // Beauty
  if (type === 'beauty') {
    return [
      branding,
      { id: 'kyc', label: { fr: 'Vérifie ton identité', en: 'Verify your identity' },
        cta: { fr: 'Vérifier', en: 'Verify' }, done: false,
        onClick: () => navigate('/beauty/kyc') },
      { id: 'services', label: { fr: 'Ajoute tes prestations', en: 'Add your services' },
        cta: { fr: 'Ajouter', en: 'Add' }, done: false,
        onClick: () => navigate('/admin/services') },
      { id: 'availability', label: { fr: 'Définis tes disponibilités', en: 'Set your availability' },
        cta: { fr: 'Définir', en: 'Set' }, done: false,
        onClick: () => navigate('/admin/settings') },
      { id: 'share', label: { fr: 'Partage ton salon', en: 'Share your salon' },
        cta: { fr: 'Partager', en: 'Share' }, done: false,
        onClick: () => navigate('/discover') },
    ];
  }

  // Tutors / teachers
  if (type === 'tutors_home_teachers') {
    return [
      branding,
      { id: 'kyc', label: { fr: 'Vérifie ton identité', en: 'Verify your identity' },
        cta: { fr: 'Vérifier', en: 'Verify' }, done: false,
        onClick: () => navigate('/education/kyc') },
      { id: 'subjects', label: { fr: 'Ajoute tes matières et tarifs', en: 'Add subjects & rates' },
        cta: { fr: 'Ajouter', en: 'Add' }, done: false,
        onClick: () => navigate('/education/tutor/subjects') },
      { id: 'availability', label: { fr: 'Définis tes créneaux', en: 'Set your time slots' },
        cta: { fr: 'Définir', en: 'Set' }, done: false,
        onClick: () => navigate('/admin/settings') },
      { id: 'share', label: { fr: 'Partage ton profil tuteur', en: 'Share your tutor profile' },
        cta: { fr: 'Partager', en: 'Share' }, done: false,
        onClick: () => navigate('/education/discover') },
    ];
  }

  // Church
  if (type === 'church') {
    return [
      branding,
      { id: 'kyc', label: { fr: 'Vérifie ton église', en: 'Verify your church' },
        cta: { fr: 'Vérifier', en: 'Verify' }, done: false,
        onClick: () => navigate('/church/kyc') },
      { id: 'campaign', label: { fr: 'Lance ta 1re campagne de don', en: 'Launch your 1st giving campaign' },
        cta: { fr: 'Créer', en: 'Create' }, done: false,
        onClick: () => navigate('/admin/campaigns') },
      { id: 'announce', label: { fr: 'Publie une annonce', en: 'Post an announcement' },
        cta: { fr: 'Publier', en: 'Publish' }, done: false,
        onClick: () => navigate('/church/pro/announcements') },
      { id: 'share', label: { fr: 'Partage sur 1 canal', en: 'Share on 1 channel' },
        cta: { fr: 'Partager', en: 'Share' }, done: false,
        onClick: () => navigate('/discover') },
    ];
  }

  // Events / other bookable service verticals
  if (type === 'instrumentists' || type === 'sport' || type === 'services' || type === 'influencers') {
    return [
      branding,
      { id: 'kyc', label: { fr: 'Vérifie ton identité', en: 'Verify your identity' },
        cta: { fr: 'Vérifier', en: 'Verify' }, done: false,
        onClick: () => navigate('/events/kyc') },
      { id: 'packages', label: { fr: 'Crée tes offres et tarifs', en: 'Create your offers & pricing' },
        cta: { fr: 'Créer', en: 'Create' }, done: false,
        onClick: () => navigate('/events/pro/packages') },
      { id: 'availability', label: { fr: 'Définis tes disponibilités', en: 'Set your availability' },
        cta: { fr: 'Définir', en: 'Set' }, done: false,
        onClick: () => navigate('/admin/settings') },
      { id: 'share', label: { fr: 'Partage ton profil', en: 'Share your profile' },
        cta: { fr: 'Partager', en: 'Share' }, done: false,
        onClick: () => navigate('/events/discover') },
    ];
  }

  // Digital creator (default) — keep original flow
  return [
    { id: 'org', label: { fr: 'Crée ton organisation', en: 'Create your organization' },
      cta: { fr: 'Créer', en: 'Create' }, done: !!s?.hasOrg,
      onClick: () => navigate('/create-organization') },
    branding,
    { id: 'product', label: { fr: 'Publie ton premier produit', en: 'Publish your first product' },
      cta: { fr: 'Créer un produit', en: 'Create product' },
      done: !!s?.hasPublishedProduct, onClick: () => navigate('/sell') },
    { id: 'affiliate', label: { fr: 'Active ton code ambassadeur', en: 'Activate your ambassador code' },
      cta: { fr: 'Activer', en: 'Activate' },
      done: !!s?.hasAffiliateCode, onClick: () => navigate('/earn') },
    { id: 'share', label: { fr: 'Partage ton lien sur 1 réseau', en: 'Share your link on 1 channel' },
      cta: { fr: 'Partager', en: 'Share' },
      done: !!s?.hasSale, onClick: () => navigate('/discover') },
  ];
}
