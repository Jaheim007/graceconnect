import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';

interface Props {
  organizationId?: string | null;
  ownerId?: string | null;
  variant?: 'inline' | 'footer';
}

/**
 * Subtle "Powered by SiteViral" badge shown on org public pages
 * for organizations whose owner is on the FREE platform tier.
 * Hidden automatically for Pro / Org / Founder tiers.
 */
export function PoweredBySiteViral({ ownerId, variant = 'footer' }: Props) {
  const { locale } = useI18n();
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!ownerId) {
      setTier('free');
      return;
    }
    (async () => {
      try {
        const { data } = await supabase.rpc('get_user_platform_tier', { _user_id: ownerId });
        if (!cancelled) setTier((data as string) || 'free');
      } catch {
        if (!cancelled) setTier('free');
      }
    })();
    return () => { cancelled = true; };
  }, [ownerId]);

  if (tier === null) return null;
  if (tier === 'pro' || tier === 'org' || tier === 'founder') return null;

  const label = locale === 'fr' ? 'Propulsé par' : 'Powered by';

  return (
    <div
      className={
        variant === 'inline'
          ? 'inline-flex items-center gap-1 text-[11px] text-muted-foreground'
          : 'flex justify-center py-4 text-xs text-muted-foreground/80'
      }
    >
      <span>{label}</span>
      <a
        href="https://siteviral.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-foreground/80 hover:text-primary transition-colors underline-offset-2 hover:underline"
      >
        SiteViral
      </a>
    </div>
  );
}
