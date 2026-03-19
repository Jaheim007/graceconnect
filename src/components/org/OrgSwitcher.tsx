/**
 * OrgSwitcher — Premium organization switching UI.
 * Inspired by Facebook/Instagram/WhatsApp account switching patterns.
 * Uses a drawer (mobile) or popover (desktop) with org avatars, roles & active state.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Organization } from '@/types/database';
import { brandUrl } from '@/lib/storageUrl';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc, getVerifiedLabel } from '@/lib/verifiedLabel';
import {
  Building2, ChevronDown, Check, Plus, Crown, ShieldCheck, Pencil, Users2,
  Link2, ArrowRight,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const roleConfig: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: 'Propriétaire', icon: Crown, color: 'text-amber-500' },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'text-blue-500' },
  editor: { label: 'Éditeur', icon: Pencil, color: 'text-emerald-500' },
  member: { label: 'Membre', icon: Users2, color: 'text-muted-foreground' },
  affiliate: { label: 'Ambassadeur', icon: Link2, color: 'text-purple-500' },
};

interface OrgSwitcherProps {
  /** Render mode — "sidebar" shows full card, "topbar" shows compact pill */
  variant?: 'sidebar' | 'topbar';
  collapsed?: boolean;
}

export function OrgSwitcher({ variant = 'sidebar', collapsed = false }: OrgSwitcherProps) {
  const { currentOrg, userOrgs, setCurrentOrg, getRoleFor } = useOrg();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (!currentOrg || userOrgs.length === 0) return null;

  const managedOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role === 'owner' || role === 'admin';
  });
  const memberOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role !== 'owner' && role !== 'admin';
  });

  const handleSelect = (org: Organization) => {
    const role = getRoleFor(org.id);
    const isManager = role === 'owner' || role === 'admin';
    setCurrentOrg(org);
    setOpen(false);
    if (isManager) {
      navigate('/admin');
    } else {
      navigate(`/org/${org.slug}`);
    }
  };

  const OrgAvatar = ({ org, size = 'md' }: { org: Organization; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
    const logo = brandUrl(org.logo_url);
    const initials = org.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
      <div className={cn(
        'rounded-xl overflow-hidden flex items-center justify-center shrink-0 font-bold ring-2 transition-all',
        sizeClasses[size],
        org.id === currentOrg?.id
          ? 'ring-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]'
          : 'ring-transparent'
      )}>
        {logo ? (
          <img src={logo} alt={org.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground">
            {initials}
          </div>
        )}
      </div>
    );
  };

  const OrgRow = ({ org }: { org: Organization }) => {
    const role = getRoleFor(org.id);
    const config = roleConfig[role || 'member'];
    const RoleIcon = config.icon;
    const isActive = org.id === currentOrg?.id;
    const verified = isOrgVerifiedOrKyc(org.is_verified, (org as any).kyc_status);

    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleSelect(org)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-left',
          isActive
            ? 'bg-primary/10 border border-primary/25'
            : 'hover:bg-muted/60 border border-transparent'
        )}
      >
        <div className="relative">
          <OrgAvatar org={org} size="md" />
          {isActive && (
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-md">
              <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-sm font-semibold truncate',
              isActive ? 'text-primary' : 'text-foreground'
            )}>
              {org.name}
            </span>
            {verified && <VerifiedBadge size="xs" showTooltip={false} />}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <RoleIcon className={cn('h-3 w-3', config.color)} />
            <span className={cn('text-[11px]', config.color)}>{config.label}</span>
          </div>
        </div>
        {!isActive && (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </motion.button>
    );
  };

  // Trigger button — adapts to variant
  const TriggerButton = (
    variant === 'topbar' ? (
      <Button variant="ghost" size="sm" className="h-7 text-[11px] font-semibold gap-1 max-w-[100px] lg:hidden border border-border px-2 shrink-0">
        <Building2 className="h-3 w-3 shrink-0 text-primary" />
        <span className="truncate">{currentOrg.name}</span>
        <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
      </Button>
    ) : collapsed ? (
      <button className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
        <OrgAvatar org={currentOrg} size="sm" />
      </button>
    ) : (
      <button className="w-full p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:from-primary/15 hover:to-primary/10 transition-all text-left group">
        <div className="flex items-center gap-2.5">
          <OrgAvatar org={currentOrg} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-primary truncate">{currentOrg.name}</p>
              {isOrgVerifiedOrKyc(currentOrg.is_verified, (currentOrg as any).kyc_status) && (
                <VerifiedBadge size="xs" showTooltip={false} />
              )}
            </div>
          </div>
          {userOrgs.length > 1 && (
            <ChevronDown className="h-3.5 w-3.5 text-primary/60 shrink-0 group-hover:text-primary transition-colors" />
          )}
        </div>
      </button>
    )
  );

  // If only 1 org, just show the card, no switching
  if (userOrgs.length <= 1 && variant === 'sidebar') {
    return <div className={cn(collapsed ? 'px-1 mt-3' : 'mx-3 mt-3')}>{TriggerButton}</div>;
  }
  if (userOrgs.length <= 1) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={variant === 'sidebar' ? cn(collapsed ? 'px-1 mt-3' : 'mx-3 mt-3') : undefined}>
          {TriggerButton}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl border-primary/10">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-5 pt-5 pb-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
          <DialogHeader className="relative">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {t('sidebar.switch_platform')}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {managedOrgs.length} {managedOrgs.length > 1 ? 'platforms' : 'platform'} · {memberOrgs.length > 0 ? `${memberOrgs.length} ${memberOrgs.length > 1 ? 'communities' : 'community'}` : ''}
            </p>
          </DialogHeader>
        </div>

        {/* Org list */}
        <div className="px-3 py-3 max-h-[400px] overflow-y-auto space-y-1">
          {managedOrgs.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                Mes organisations
              </p>
              <AnimatePresence>
                {managedOrgs.map((org, i) => (
                  <motion.div key={org.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <OrgRow org={org} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {memberOrgs.length > 0 && (
            <div className={managedOrgs.length > 0 ? 'pt-2' : ''}>
              {managedOrgs.length > 0 && (
                <div className="mx-3 mb-2 border-t border-border/60" />
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                Membre de
              </p>
              <AnimatePresence>
                {memberOrgs.map((org, i) => (
                  <motion.div key={org.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (managedOrgs.length + i) * 0.04 }}>
                    <OrgRow org={org} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="border-t border-border/60 px-4 py-3 bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-2 rounded-lg border-dashed border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
            onClick={() => { setOpen(false); navigate('/create-org'); }}
          >
            <Plus className="h-3.5 w-3.5" />
            Créer une nouvelle organisation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
