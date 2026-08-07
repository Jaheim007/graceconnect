/**
 * MyCommunities — Premium glassmorphism community cards with fire design.
 * Horizontal scrollable showcase of orgs the user is a member of (not owner/admin).
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, ArrowRight, Shield, Zap, Crown } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Organization } from '@/types/database';
import { brandUrl } from '@/lib/storageUrl';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc } from '@/lib/verifiedLabel';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

export function MyCommunities() {
  const { userOrgs, getRoleFor } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const memberOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role !== 'owner' && role !== 'admin';
  });

  const orgIds = memberOrgs.map((o) => o.id);
  const { data: memberCounts = {} } = useQuery({
    queryKey: ['community-member-counts', orgIds],
    queryFn: async () => {
      if (orgIds.length === 0) return {};
      const counts: Record<string, number> = {};
      for (const id of orgIds) {
        const { count } = await db
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', id);
        counts[id] = count || 0;
      }
      return counts;
    },
    enabled: orgIds.length > 0,
    staleTime: 120_000,
  });

  if (memberOrgs.length === 0) return null;

  const roleLabel = (orgId: string) => {
    const role = getRoleFor(orgId);
    const labels: Record<string, string> = {
      editor: isFr ? 'Éditeur' : 'Editor',
      member: isFr ? 'Membre' : 'Member',
      affiliate: isFr ? 'Ambassadeur' : 'Ambassador',
    };
    return labels[role || 'member'] || labels.member;
  };

  return (
    <section className="space-y-4">
      {/* Section header with glow accent */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-base tracking-tight">{isFr ? 'Mes communautés' : 'My Communities'}</h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              {memberOrgs.length} {memberOrgs.length > 1 ? (isFr ? 'communautés actives' : 'active communities') : (isFr ? 'communauté active' : 'active community')}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable cards with premium glassmorphism */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3 -mx-1 px-1">
        {memberOrgs.map((org, i) => (
          <CommunityCard
            key={org.id}
            org={org}
            role={roleLabel(org.id)}
            memberCount={memberCounts[org.id] || 0}
            index={i}
            onClick={() => navigate(`/org/${org.slug}`)}
          />
        ))}
      </div>
    </section>
  );
}

function CommunityCard({
  org,
  role,
  memberCount,
  index,
  onClick,
}: {
  org: Organization;
  role: string;
  memberCount: number;
  index: number;
  onClick: () => void;
}) {
  const logo = brandUrl(org.logo_url);
  const initials = org.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const verified = isOrgVerifiedOrKyc(org.is_verified, (org as any).kyc_status);
  const coverUrl = brandUrl((org as any).cover_image_url);

  return (
    <motion.button
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden',
        'bg-card/80 backdrop-blur-xl border border-border/50',
        'shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)]',
        'transition-shadow duration-500',
        'text-left group focus-visible:ring-2 focus-visible:ring-primary relative'
      )}
    >
      {/* Cover with cinematic gradient overlay */}
      <div className="relative h-28 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/15 to-accent/20 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.25),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.2),transparent_50%)]" />
          </div>
        )}
        {/* Multi-layer gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Floating member count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur-md border border-border/30 shadow-sm">
          <Users className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-bold text-foreground">{memberCount}</span>
        </div>

        {/* Avatar with glowing ring */}
        <div className="absolute -bottom-6 left-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl overflow-hidden ring-[3px] ring-card shadow-[0_4px_16px_rgba(0,0,0,0.15)] group-hover:ring-primary/30 transition-all duration-300">
              {logo ? (
                <img src={logo} alt={org.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-base">
                  {initials}
                </div>
              )}
            </div>
            {verified && (
              <div className="absolute -bottom-1 -right-1">
                <VerifiedBadge size="xs" showTooltip={false} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="pt-8 px-4 pb-4 space-y-3">
        <div>
          <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors duration-200">
            {org.name}
          </h3>
        </div>

        {/* Role badge with gradient */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
            <Shield className="h-3 w-3" />
            {role}
          </span>
        </div>

        {org.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {org.description}
          </p>
        )}

        {/* Hover-reveal CTA */}
        <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold pt-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <span>Visit</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </div>
    </motion.button>
  );
}
