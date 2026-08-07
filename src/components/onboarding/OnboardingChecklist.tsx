import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Zap, X, Rocket, Image, Megaphone, ShoppingBag, Heart, Link2, Users, HandHeart } from 'lucide-react';
import { ConfettiCelebration } from '@/components/gamification/ConfettiCelebration';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

interface ChecklistItem {
  id: string;
  icon: typeof Rocket;
  titleKey: string;
  descKey: string;
  route: string;
  check: (ctx: CheckContext) => boolean;
}

interface CheckContext {
  hasLogo: boolean;
  hasBanner: boolean;
  hasProduct: boolean;
  hasCampaign: boolean;
  hasAnnouncement: boolean;
  hasMedia: boolean;
  hasMember: boolean;
  affiliationEnabled: boolean;
  offeringsEnabled: boolean;
}

const CHECKLIST: ChecklistItem[] = [
  { id: 'branding', icon: Image, titleKey: 'checklist.branding', descKey: 'checklist.branding_desc', route: '/admin/settings', check: (c) => c.hasLogo || c.hasBanner },
  { id: 'announcement', icon: Megaphone, titleKey: 'checklist.announcement', descKey: 'checklist.announcement_desc', route: '/admin/announcements/new', check: (c) => c.hasAnnouncement },
  { id: 'product', icon: ShoppingBag, titleKey: 'checklist.product', descKey: 'checklist.product_desc', route: '/admin/products/new', check: (c) => c.hasProduct },
  { id: 'campaign', icon: Heart, titleKey: 'checklist.campaign', descKey: 'checklist.campaign_desc', route: '/admin/campaigns/new', check: (c) => c.hasCampaign },
  { id: 'offerings', icon: HandHeart, titleKey: 'checklist.offerings', descKey: 'checklist.offerings_desc', route: '/admin/offerings', check: (c) => c.offeringsEnabled },
  { id: 'media', icon: Users, titleKey: 'checklist.media', descKey: 'checklist.media_desc', route: '/admin/media/new', check: (c) => c.hasMedia },
  { id: 'affiliate', icon: Link2, titleKey: 'checklist.affiliate', descKey: 'checklist.affiliate_desc', route: '/admin/affiliation', check: (c) => c.affiliationEnabled },
];

export function OnboardingChecklist() {
  const { user } = useAuth();
  const { currentOrg, canManage } = useOrg();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const orgId = currentOrg?.id;
  const isManager = orgId ? canManage(orgId) : false;

  // Fetch counts to determine checklist state
  const { data: ctx } = useQuery({
    queryKey: ['onboarding-checklist', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [products, campaigns, announcements, media, members, offerings] = await Promise.all([
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('donation_campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('announcements').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('media_content').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('offerings').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      ]);
      return {
        hasLogo: !!currentOrg?.logo_url,
        hasBanner: !!currentOrg?.banner_url,
        hasProduct: (products.count || 0) > 0,
        hasCampaign: (campaigns.count || 0) > 0,
        hasAnnouncement: (announcements.count || 0) > 0,
        hasMedia: (media.count || 0) > 0,
        hasMember: (members.count || 0) > 1,
        affiliationEnabled: !!currentOrg?.affiliation_enabled,
        offeringsEnabled: !!(currentOrg as any)?.offerings_enabled || (offerings.count || 0) > 0,
      } as CheckContext;
    },
    enabled: !!orgId && isManager,
    staleTime: 60_000,
  });

  const completed = useMemo(() => {
    if (!ctx) return [];
    return CHECKLIST.filter(item => item.check(ctx));
  }, [ctx]);

  const completedCount = completed.length;
  const totalCount = CHECKLIST.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-dismiss when 100% + celebrate
  useEffect(() => {
    if (progress === 100) {
      setShowConfetti(true);
      const timer = setTimeout(() => setDismissed(true), 4000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Check localStorage for permanent dismiss
  useEffect(() => {
    if (orgId && localStorage.getItem(`checklist_dismissed_${orgId}`)) {
      setDismissed(true);
    }
  }, [orgId]);

  if (!isManager || !ctx || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (orgId) localStorage.setItem(`checklist_dismissed_${orgId}`, '1');
  };

  return (
    <>
      <ConfettiCelebration active={showConfetti} message="🎉 Configuration terminée !" onDone={() => setShowConfetti(false)} />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {progress === 100 ?  : <Rocket className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold">{t('checklist.title')}</h3>
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {completedCount}/{totalCount}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 mt-1.5" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCollapsed(!collapsed)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button onClick={handleDismiss} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Items */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1">
              {CHECKLIST.map((item) => {
                const done = completed.some(c => c.id === item.id);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => !done && navigate(item.route)}
                    className={cn(
                      'flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all duration-200',
                      done
                        ? 'opacity-60'
                        : 'hover:bg-accent/50 cursor-pointer'
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>{t(item.titleKey)}</p>
                      <p className="text-[11px] text-muted-foreground">{t(item.descKey)}</p>
                    </div>
                    {!done && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration */}
      {progress === 100 && (
        <div className="px-4 pb-4 text-center">
          <p className="text-sm font-bold text-primary">🎉 {t('checklist.complete')}</p>
        </div>
      )}
      </motion.div>
    </>
  );
}
