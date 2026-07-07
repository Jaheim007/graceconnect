import { supabase } from '@/integrations/supabase/client';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import { mergeFeatures, getDefaultFeaturesForType } from '@/lib/siteviral/config';

type ActivationSource = 'user' | 'onboarding' | 'migration' | 'system' | 'admin';

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Turn a single feature on for an org and audit it. */
export async function activateFeature(
  orgId: string,
  feature: SiteviralFeatureKey,
  source: ActivationSource = 'user'
) {
  const { data: org, error: fetchErr } = await supabase
    .from('organizations')
    .select('enabled_features')
    .eq('id', orgId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const current = ((org?.enabled_features as SiteviralFeatureKey[]) ?? []);
  if (current.includes(feature)) return current;

  const next = [...current, feature];
  const { error: updErr } = await supabase
    .from('organizations')
    .update({ enabled_features: next })
    .eq('id', orgId);
  if (updErr) throw updErr;

  const uid = await currentUserId();
  await supabase.from('feature_activations').insert({
    org_id: orgId,
    feature_key: feature,
    action: 'activated',
    source,
    activated_by: uid,
  });

  return next;
}

/** Turn a single feature off for an org and audit it. */
export async function deactivateFeature(
  orgId: string,
  feature: SiteviralFeatureKey,
  source: ActivationSource = 'user'
) {
  const { data: org, error: fetchErr } = await supabase
    .from('organizations')
    .select('enabled_features')
    .eq('id', orgId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const current = ((org?.enabled_features as SiteviralFeatureKey[]) ?? []);
  if (!current.includes(feature)) return current;

  const next = current.filter((f) => f !== feature);
  const { error: updErr } = await supabase
    .from('organizations')
    .update({ enabled_features: next })
    .eq('id', orgId);
  if (updErr) throw updErr;

  const uid = await currentUserId();
  await supabase.from('feature_activations').insert({
    org_id: orgId,
    feature_key: feature,
    action: 'deactivated',
    source,
    activated_by: uid,
  });

  return next;
}

/**
 * Set siteviral_type and merge type defaults into enabled_features (non-destructive).
 * Used by onboarding and by the existing-user migration modal.
 */
export async function confirmSiteviralType(
  orgId: string,
  type: SiteviralType,
  extraFeatures: SiteviralFeatureKey[] = [],
  source: ActivationSource = 'onboarding'
) {
  const { data: org, error: fetchErr } = await supabase
    .from('organizations')
    .select('enabled_features')
    .eq('id', orgId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  const existing = ((org?.enabled_features as SiteviralFeatureKey[]) ?? []);
  const merged = mergeFeatures(
    mergeFeatures(existing, getDefaultFeaturesForType(type)),
    extraFeatures
  );

  const now = new Date().toISOString();
  const { error: updErr } = await supabase
    .from('organizations')
    .update({
      siteviral_type: type,
      enabled_features: merged,
      type_confirmed_at: now,
      features_confirmed_at: now,
    })
    .eq('id', orgId);
  if (updErr) throw updErr;

  const uid = await currentUserId();
  const newly = merged.filter((f) => !existing.includes(f));
  if (newly.length) {
    await supabase.from('feature_activations').insert(
      newly.map((feature_key) => ({
        org_id: orgId,
        feature_key,
        action: 'activated',
        source,
        activated_by: uid,
      }))
    );
  }

  return merged;
}
