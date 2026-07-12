/**
 * OrgSwitcher — Space switcher for Personal + managed workspaces.
 * Personal is a client-side context (currentOrg === null) — never a DB row.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { useCurrentSpace } from '@/hooks/useCurrentSpace';
import { Organization } from '@/types/database';
import { brandUrl } from '@/lib/storageUrl';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc } from '@/lib/verifiedLabel';
import { SITEVIRAL_TYPES } from '@/lib/siteviral/config';
import {
  Building2, ChevronDown, Check, Plus, Crown, ShieldCheck, Pencil, Users2,
  Link2, ArrowRight, Settings2, User as UserIcon,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const roleConfigFn = (isFr: boolean): Record<string, { label: string; icon: typeof Crown; color: string }> => ({
  owner: { label: isFr ? 'Propriétaire' : 'Owner', icon: Crown, color: 'text-amber-500' },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'text-blue-500' },
  editor: { label: isFr ? 'Éditeur' : 'Editor', icon: Pencil, color: 'text-emerald-500' },
  member: { label: isFr ? 'Membre' : 'Member', icon: Users2, color: 'text-muted-foreground' },
  affiliate: { label: isFr ? 'Ambassadeur' : 'Ambassador', icon: Link2, color: 'text-purple-500' },
});

interface OrgSwitcherProps {
  variant?: 'sidebar' | 'topbar';
  collapsed?: boolean;
}

export function OrgSwitcher({ variant = 'sidebar', collapsed = false }: OrgSwitcherProps) {
  const { currentOrg, userOrgs, setCurrentOrg, getRoleFor } = useOrg();
  const { user } = useAuth();
  const space = useCurrentSpace();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const roleConfig = roleConfigFn(isFr);
  const [open, setOpen] = useState(false);

  if (!user || !space) return null;

  const managedOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role === 'owner' || role === 'admin';
  });

  const isPersonal = space.kind === 'personal';

  const handleSelectPersonal = () => {
    setCurrentOrg(null);
    setOpen(false);
    navigate('/dashboard');
  };

  const handleSelectOrg = (org: Organization) => {
    const role = getRoleFor(org.id);
    const isManager = role === 'owner' || role === 'admin';
    setCurrentOrg(org);
    setOpen(false);
    if (isManager) navigate('/dashboard');
    else navigate(`/org/${org.slug}`);
  };

  const initialsFrom = (s: string) =>
    s.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const Avatar = ({
    src, name, size = 'md', active, fallbackIcon,
  }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg'; active?: boolean; fallbackIcon?: React.ReactNode }) => {
    const sizeClasses = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
    return (
      <div className={cn(
        'rounded-xl overflow-hidden flex items-center justify-center shrink-0 font-bold ring-2 transition-all',
        sizeClasses[size],
        active ? 'ring-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]' : 'ring-transparent'
      )}>
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground">
            {fallbackIcon ?? initialsFrom(name)}
          </div>
        )}
      </div>
    );
  };

  const PersonalRow = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all duration-200 group text-left',
        isPersonal ? 'bg-primary/10 border border-primary/25' : 'hover:bg-muted/60 border border-transparent'
      )}
    >
      <button onClick={handleSelectPersonal} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="relative">
          <Avatar
            src={space.kind === 'personal' ? space.avatarUrl : (user.user_metadata?.avatar_url ?? null)}
            name={user.email ?? 'U'}
            size="md"
            active={isPersonal}
            fallbackIcon={<UserIcon className="h-4 w-4 text-primary-foreground" />}
          />
          {isPersonal && (
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-md">
              <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-sm font-semibold truncate', isPersonal ? 'text-primary' : 'text-foreground')}>
              {isFr ? 'Personnel' : 'Personal'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>
        {!isPersonal && (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </button>
    </motion.div>
  );

  const OrgRow = ({ org }: { org: Organization }) => {
    const role = getRoleFor(org.id);
    const config = roleConfig[role || 'member'];
    const RoleIcon = config.icon;
    const isActive = !isPersonal && org.id === currentOrg?.id;
    const verified = isOrgVerifiedOrKyc(org.is_verified, (org as any).kyc_status);
    const typeMeta = org.siteviral_type ? SITEVIRAL_TYPES[org.siteviral_type as keyof typeof SITEVIRAL_TYPES] : null;
    const typeLabel = typeMeta ? (isFr ? typeMeta.labelFr : typeMeta.labelEn).replace(/^SiteViral\s+/i, '') : (isFr ? 'Type non défini' : 'No type set');

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all duration-200 group text-left',
          isActive ? 'bg-primary/10 border border-primary/25' : 'hover:bg-muted/60 border border-transparent'
        )}
      >
        <button onClick={() => handleSelectOrg(org)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="relative">
            <Avatar src={brandUrl(org.logo_url)} name={org.name} size="md" active={isActive} />
            {isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn('text-sm font-semibold truncate', isActive ? 'text-primary' : 'text-foreground')}>
                {org.name}
              </span>
              {verified && <VerifiedBadge size="xs" showTooltip={false} />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                {typeMeta?.emoji ?? '🧩'} <span className="truncate max-w-[110px]">{typeLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <RoleIcon className={cn('h-3 w-3', config.color)} />
                <span className={cn('text-[10px]', config.color)}>{config.label}</span>
              </span>
            </div>
          </div>
          {!isActive && (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentOrg(org); setOpen(false); navigate('/admin/features'); }}
          title={isFr ? 'Changer le type SiteViral' : 'Change SiteViral type'}
          className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    );
  };

  // Trigger button — reads from useCurrentSpace so it reflects Personal too
  const triggerLabel = space.label;
  const triggerAvatar = space.avatarUrl;
  const triggerFallbackIcon = isPersonal ? <UserIcon className="h-4 w-4 text-primary-foreground" /> : undefined;

  const TriggerButton =
    variant === 'topbar' ? (
      <Button variant="ghost" size="sm" className="h-7 text-[11px] font-semibold gap-1 max-w-[120px] lg:hidden border border-border px-2 shrink-0">
        {isPersonal ? <UserIcon className="h-3 w-3 shrink-0 text-primary" /> : <Building2 className="h-3 w-3 shrink-0 text-primary" />}
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
      </Button>
    ) : collapsed ? (
      <button className="w-full flex items-center justify-center p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
        <Avatar src={triggerAvatar} name={triggerLabel} size="sm" fallbackIcon={triggerFallbackIcon} />
      </button>
    ) : (
      <button className="w-full p-2.5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 hover:from-primary/15 hover:to-primary/10 transition-all text-left group">
        <div className="flex items-center gap-2.5">
          <Avatar src={triggerAvatar} name={triggerLabel} size="sm" fallbackIcon={triggerFallbackIcon} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-primary truncate">{triggerLabel}</p>
              {!isPersonal && currentOrg && isOrgVerifiedOrKyc(currentOrg.is_verified, (currentOrg as any).kyc_status) && (
                <VerifiedBadge size="xs" showTooltip={false} />
              )}
            </div>
            {isPersonal && (
              <p className="text-[10px] text-muted-foreground truncate">{isFr ? 'Mon espace' : 'My space'}</p>
            )}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-primary/60 shrink-0 group-hover:text-primary transition-colors" />
        </div>
      </button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={variant === 'sidebar' ? cn(collapsed ? 'px-1 mt-3' : 'mx-3 mt-3') : undefined}>
          {TriggerButton}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden rounded-2xl border-primary/10 max-h-[85vh] flex flex-col">
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/8 to-transparent px-5 pt-5 pb-4 shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_60%)]" />
          <DialogHeader className="relative">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {isFr ? 'Changer d’espace' : 'Switch space'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {isFr
                ? `Personnel + ${managedOrgs.length} espace(s)`
                : `Personal + ${managedOrgs.length} workspace(s)`}
            </p>
          </DialogHeader>
        </div>

        <div className="px-3 py-3 flex-1 min-h-0 overflow-y-auto space-y-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
              {isFr ? 'Mon espace' : 'My space'}
            </p>
            <PersonalRow />
          </div>

          {managedOrgs.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2">
                {isFr ? 'Mes espaces / pages' : 'My workspaces / pages'}
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
        </div>

        <div className="border-t border-border/60 px-4 py-3 bg-muted/30 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-2 rounded-lg border-dashed border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
            onClick={() => { setOpen(false); navigate('/create-org'); }}
          >
            <Plus className="h-3.5 w-3.5" />
            {isFr ? 'Créer un nouvel espace/page' : 'Create a new workspace/page'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
