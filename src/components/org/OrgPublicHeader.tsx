import { useRef, useState } from 'react';
import { useShortLink } from '@/hooks/useShortLink';
import { brandUrl } from '@/lib/storageUrl';
import { useNavigate } from '@/lib/router-compat';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineEditableText } from '@/components/org/InlineEditableText';
import { OrgBadges } from '@/components/org/OrgBadges';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc, getVerifiedLabel } from '@/lib/verifiedLabel';
import { FormattedText } from '@/lib/formatText';
import { ImageCropDialog } from '@/components/ui/ImageCropDialog';
import { useUpdateOrg } from '@/hooks/useOrganizations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getOrgCategoryLabel } from '@/lib/categoryLabels';
import { countryFlag, getCountryName } from '@/lib/countries';
import { motion } from 'framer-motion';
import {
  Globe, MessageCircle, CheckCircle2, Users, CalendarDays,
  Share2, ShoppingBag, Heart, Camera, MapPin, ArrowLeft, MoreHorizontal,
  Play, Pencil, Loader2, Link2, Crown, UserPlus
} from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@/lib/router-compat';
import { SiteLogo } from '@/components/ui/SiteLogo';

interface OrgPublicHeaderProps {
  org: any;
  slug: string;
  memberCount: number;
  products: any[];
  media: any[];
  events: any[];
  photos: any[];
  hasAffiliateRef: boolean;
}

export function OrgPublicHeader({
  org, slug, memberCount, products, media, events, photos, hasAffiliateRef,
}: OrgPublicHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinOrg, leaveOrg, isMemberOf, canManage, setCurrentOrg, userOrgs, currentOrg } = useOrg();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const updateOrg = useUpdateOrg();

  const [joining, setJoining] = useState(false);
  const [enrollingAmbassador, setEnrollingAmbassador] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropField, setCropField] = useState<'banner_url' | 'logo_url'>('banner_url');
  const [cropAspect, setCropAspect] = useState<number | undefined>(3 / 1);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = canManage(org.id);
  const isOwner = org.owner_id === user?.id;
  const isMember = isMemberOf(org.id);
  const orgAny = org as any;

  // Check if user already has an affiliate link for this org
  const { data: existingAffLink } = useQuery({
    queryKey: ['affiliate-link-check', org.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('affiliate_links')
        .select('id, code')
        .eq('user_id', user.id)
        .eq('organization_id', org.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !isOwner,
  });

  const isAmbassador = !!existingAffLink;

  const handleBecomeAmbassador = async () => {
    if (!user) { navigate('/auth'); return; }
    setEnrollingAmbassador(true);
    try {
      const { error } = await supabase.rpc('self_enroll_affiliate', { _org_id: org.id });
      if (error) throw error;
      toast({ title: locale === 'fr' ? '🎉 Vous êtes maintenant Ambassadeur !' : '🎉 You are now an Ambassador!' });
      qc.invalidateQueries({ queryKey: ['affiliate-link-check', org.id, user.id] });
      qc.invalidateQueries({ queryKey: ['user-memberships', user.id] });
      qc.invalidateQueries({ queryKey: ['org-member-count', org.id] });
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('owner')) {
        toast({ title: locale === 'fr' ? 'Les propriétaires ne peuvent pas être ambassadeurs de leur propre organisation' : 'Owners cannot be ambassadors of their own organization', variant: 'destructive' });
      } else {
        toast({ title: msg, variant: 'destructive' });
      }
    }
    setEnrollingAmbassador(false);
  };

  const saveOrgField = async (field: string, value: string) => {
    await updateOrg.mutateAsync({ id: org.id, updates: { [field]: value } });
    qc.invalidateQueries({ queryKey: ['org-by-slug', slug] });
    toast({ title: locale === 'fr' ? 'Modifié ✓' : 'Updated ✓' });
  };

  const handleJoinLeave = async () => {
    if (!user) { navigate('/auth'); return; }
    setJoining(true);
    if (isMember) {
      await leaveOrg(org.id);
      toast({ title: `${t('org_public.left')} ${org.name}` });
    } else {
      await joinOrg(org.id);
      toast({ title: `${t('org_public.joined')} ${org.name} !` });
      navigate('/feed');
    }
    qc.invalidateQueries({ queryKey: ['org-member-count', org.id] });
    setJoining(false);
  };

  const { shareUrl: orgShareUrl } = useShortLink({
    targetPath: `/org/${org.slug}`,
    title: org.name,
    description: org.description?.slice(0, 155) || undefined,
    image: org.banner_url || org.logo_url || undefined,
  });

  const shareWhatsApp = () => {
    const msg = locale === 'fr'
      ? `Découvrez ${org.name} sur Siteviral: ${orgShareUrl}`
      : `Discover ${org.name} on Siteviral: ${orgShareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropSrc(null);
    const setUploading = cropField === 'banner_url' ? setUploadingBanner : setUploadingLogo;
    setUploading(true);
    try {
      const fileName = `${org.id}/${cropField}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('org-uploads').upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('org-uploads').getPublicUrl(fileName);
      await updateOrg.mutateAsync({ id: org.id, updates: { [cropField]: brandUrl(data.publicUrl) } });
      qc.invalidateQueries({ queryKey: ['org-by-slug', slug] });
      toast({ title: locale === 'fr' ? 'Image mise à jour ✓' : 'Image updated ✓' });
    } catch (err: any) {
      toast({ title: err.message || 'Upload failed', variant: 'destructive' });
    }
    setUploading(false);
  };

  return (
    <>
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xs px-4 h-12 flex items-center justify-between">
        <Link to={user ? '/feed' : '/'}>
          <SiteLogo size="sm" linked={false} animate />
        </Link>
        {!user ? (
          <Button size="sm" className="h-7 text-xs bg-primary text-primary-foreground" onClick={() => navigate('/auth')}>
            {t('org_public.login')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-4 w-4" /> {t('org_public.back')}
          </Button>
        )}
      </div>

      {/* Affiliate referral banner */}
      {hasAffiliateRef && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-2">
          <p className="text-xs text-primary font-medium">
            {t('org_public.invited_explore')} {org.name} {t('org_public.browse_below')}
          </p>
        </div>
      )}

      {/* Banner */}
      <div className="relative">
        <div
          className={cn(
            "h-32 sm:h-56 lg:h-72 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20",
            isAdmin && "cursor-pointer group"
          )}
          onClick={() => isAdmin && bannerInputRef.current?.click()}
        >
          {org.banner_url ? (
            <img src={org.banner_url} alt={org.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full hero-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          {isAdmin && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              {uploadingBanner ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <div className="bg-black/50 text-white rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> {locale === 'fr' ? 'Modifier la bannière' : 'Edit banner'}
                </div>
              )}
            </div>
          )}
        </div>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setCropSrc(URL.createObjectURL(f)); setCropField('banner_url'); setCropAspect(3 / 1); }
            e.target.value = '';
          }}
        />

        <div className="container max-w-5xl relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 sm:gap-6 -mt-16 sm:-mt-12 pb-5 sm:pb-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                "h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-4 border-background shadow-elevated overflow-hidden bg-card shrink-0 relative",
                isAdmin && "cursor-pointer group"
              )}
              onClick={() => isAdmin && logoInputRef.current?.click()}
            >
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-primary-foreground">
                    {org.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              {isAdmin && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-2xl">
                  {uploadingLogo ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Pencil className="h-5 w-5 text-white" />}
                </div>
              )}
            </motion.div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setCropSrc(URL.createObjectURL(f)); setCropField('logo_url'); setCropAspect(1); }
                e.target.value = '';
              }}
            />

            <div className="flex-1 min-w-0 sm:pb-1">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                  <InlineEditableText value={org.name} onSave={(v) => saveOrgField('name', v)} canEdit={isAdmin} tag="h1" className="text-2xl sm:text-3xl font-bold truncate" />
                  {isOrgVerifiedOrKyc(org.is_verified, orgAny.kyc_status) && <VerifiedBadge size="lg" label={getVerifiedLabel(org.category, locale)} />}
                </div>
                <OrgBadges isSuspended={orgAny.is_suspended} size="sm" className="mt-2" />
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">{getOrgCategoryLabel(org.category, locale)}</Badge>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {memberCount} {memberCount !== 1 ? t('org_public.members_plural') : t('org_public.members')}
                  </span>
                  {org.country && (
                    <span className="flex items-center gap-1"><span className="text-base leading-none">{countryFlag(org.country)}</span> {getCountryName(org.country, locale)}</span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats & actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pt-6 pb-6 border-t border-border/50">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-2">
              {products.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <AnimatedCounter value={products.length} className="text-sm font-bold" />
                  <span className="text-xs text-muted-foreground">{locale === 'fr' ? 'Produits' : 'Products'}</span>
                </div>
              )}
              {media.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <Play className="h-4 w-4 text-primary" />
                  <AnimatedCounter value={media.length} className="text-sm font-bold" />
                  <span className="text-xs text-muted-foreground">{locale === 'fr' ? 'Contenus' : 'Content'}</span>
                </div>
              )}
              {events.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <AnimatedCounter value={events.length} className="text-sm font-bold" />
                  <span className="text-xs text-muted-foreground">{locale === 'fr' ? 'Événements' : 'Events'}</span>
                </div>
              )}
              {photos.length > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-card">
                  <Camera className="h-4 w-4 text-primary" />
                  <AnimatedCounter value={photos.length} className="text-sm font-bold" />
                  <span className="text-xs text-muted-foreground">Photos</span>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center gap-2">
              {org.whatsapp && (
                <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 text-xs">
                  <a href={`https://wa.me/${org.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4 text-green-500" /> WhatsApp
                  </a>
                </Button>
              )}
              {/* Ambassador button logic */}
              {orgAny.affiliation_enabled && !isOwner && !isAmbassador && (
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={handleBecomeAmbassador} disabled={enrollingAmbassador}>
                  <UserPlus className="h-4 w-4 text-primary" /> {enrollingAmbassador ? '...' : (locale === 'fr' ? 'Devenir Ambassadeur' : 'Become Ambassador')}
                </Button>
              )}
              {orgAny.affiliation_enabled && !isOwner && isAmbassador && (
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => navigate('/gagner')}>
                  <Crown className="h-4 w-4 text-primary" /> {locale === 'fr' ? 'Mon lien Ambassadeur' : 'My Ambassador Link'}
                </Button>
              )}
              {orgAny.affiliation_enabled && isOwner && (
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => {
                  if (currentOrg?.id !== org.id) {
                    const targetOrg = userOrgs.find(o => o.id === org.id);
                    if (targetOrg) setCurrentOrg(targetOrg);
                  }
                  navigate('/admin/analytics');
                }}>
                  <Crown className="h-4 w-4 text-primary" /> {locale === 'fr' ? 'Mes Ambassadeurs' : 'My Ambassadors'}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={shareWhatsApp} className="h-9 gap-1.5 text-xs">
                <Share2 className="h-4 w-4" /> {t('org_public.share')}
              </Button>
              {isMember ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 text-xs px-3"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleJoinLeave} className="text-destructive focus:text-destructive text-xs">
                      {t('org_public.leave')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" onClick={handleJoinLeave} disabled={joining} className="h-9 text-xs px-5 bg-primary text-primary-foreground">
                  {joining ? '...' : t('org_public.join')}
                </Button>
              )}
            </motion.div>
          </div>

          {/* Description */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="max-w-3xl mt-1 mb-4 overflow-hidden">
            {isAdmin ? (
              <InlineEditableText value={org.description || ''} onSave={(v) => saveOrgField('description', v)} canEdit multiline className="text-sm text-muted-foreground break-words leading-relaxed" placeholder={locale === 'fr' ? 'Ajoutez une description...' : 'Add a description...'} />
            ) : org.description ? (
              <FormattedText text={org.description} className="text-sm text-muted-foreground break-words leading-relaxed" />
            ) : null}
          </motion.div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            {org.website && (
              <a href={org.website} className="flex items-center gap-1.5 text-xs text-primary hover:underline" target="_blank" rel="noreferrer">
                <Globe className="h-3.5 w-3.5" /> {org.website.replace(/https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Leader biography */}
      {(orgAny.leader_name || isAdmin) && (
        <div className="container max-w-5xl">
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-2 mb-8 p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">{t('org_public.leader_bio')}</h2>
            <div className="flex flex-col sm:flex-row gap-5">
              {orgAny.leader_image_url && (
                <div className="shrink-0">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-elevated">
                    <img src={orgAny.leader_image_url} alt={orgAny.leader_name} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <InlineEditableText value={orgAny.leader_name || ''} onSave={(v) => saveOrgField('leader_name', v)} canEdit={isAdmin} tag="h3" className="text-lg sm:text-xl font-bold" placeholder={locale === 'fr' ? 'Nom du leader...' : 'Leader name...'} />
                <InlineEditableText value={orgAny.leader_title || ''} onSave={(v) => saveOrgField('leader_title', v)} canEdit={isAdmin} tag="p" className="text-sm text-primary font-medium mt-0.5" placeholder={locale === 'fr' ? 'Titre...' : 'Title...'} />
                {isAdmin ? (
                  <InlineEditableText value={orgAny.leader_bio || ''} onSave={(v) => saveOrgField('leader_bio', v)} canEdit multiline className="text-sm text-muted-foreground mt-2 leading-relaxed break-words" placeholder={locale === 'fr' ? 'Biographie...' : 'Biography...'} />
                ) : orgAny.leader_bio ? (
                  <FormattedText text={orgAny.leader_bio} className="text-sm text-muted-foreground mt-2 leading-relaxed break-words" />
                ) : null}
              </div>
            </div>
          </motion.section>
        </div>
      )}

      {/* Crop Dialog */}
      {cropSrc && (
        <ImageCropDialog open={!!cropSrc} imageSrc={cropSrc} aspect={cropAspect} onClose={() => setCropSrc(null)} onCropComplete={handleCropComplete} />
      )}
    </>
  );
}
