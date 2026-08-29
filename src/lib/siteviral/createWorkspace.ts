/**
 * SINGLE workspace-creation engine.
 *
 * Every onboarding entry point (/create-org, /start/*, church onboarding,
 * dashboards CTAs…) MUST go through `createWorkspace()` so that a workspace is
 * always created the same way: org row + primary world + default features +
 * provider profile + partner attribution.
 */
import { db } from '@/lib/db';
import { confirmSiteviralType } from '@/lib/siteviral/activation';
import { WORLDS, type SiteviralWorld } from '@/lib/siteviral/worlds';
import { mergeFeatures } from '@/lib/siteviral/config';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';

export const PARTNER_STORAGE_KEY = 'sv_partner_code';

export function slugifyWorkspaceName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return base || 'space-' + Math.random().toString(36).slice(2, 7);
}

/** Map a legacy SiteviralType back to its canonical world. */
export function worldForSiteviralType(type: SiteviralType | null | undefined): SiteviralWorld {
  if (!type) return 'digital';
  const match = (Object.values(WORLDS) as { id: SiteviralWorld; siteviralType: SiteviralType }[])
    .find((w) => w.siteviralType === type);
  return match?.id ?? 'digital';
}

/**
 * True when another platform already uses this name (or the slug it produces).
 * Names are unique across SiteViral so buyers never confuse two platforms.
 */
export async function isWorkspaceNameTaken(name: string, excludeOrgId?: string | null): Promise<boolean> {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  const slug = slugifyWorkspaceName(trimmed);
  let query = (db.from('organizations') as any)
    .select('id')
    .or(`name.ilike.${trimmed.replace(/[,()]/g, ' ')},slug.eq.${slug}`)
    .limit(1);
  if (excludeOrgId) query = query.neq('id', excludeOrgId);
  const { data, error } = await query;
  if (error) return false; // never block creation on a read failure
  return Array.isArray(data) && data.length > 0;
}

export class WorkspaceNameTakenError extends Error {
  constructor() {
    super('Ce nom de plateforme est déjà utilisé — choisis-en un autre. / This platform name is already taken — please pick another one.');
    this.name = 'WorkspaceNameTakenError';
  }
}

export interface CreateWorkspaceInput {
  name: string;
  world: SiteviralWorld;
  currency: string;
  description?: string | null;
  /** Extra features on top of the world defaults (additive, deduplicated). */
  extraFeatures?: SiteviralFeatureKey[];
  /** Optional onboarding snapshot (specialties, services, …). */
  providerProfile?: Record<string, unknown> | null;
  /** Partner referral code — falls back to sessionStorage. */
  partnerCode?: string | null;
  /** Owner identity category override (creator / church / ngo / community). */
  category?: 'church' | 'leader' | 'community' | 'ngo' | 'other' | null;
  /** Reuse an already-created org id (idempotent retries). */
  existingOrgId?: string | null;
}

export interface CreateWorkspaceResult {
  orgId: string;
  org: any | null;
  world: SiteviralWorld;
  siteviralType: SiteviralType;
  features: SiteviralFeatureKey[];
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<CreateWorkspaceResult> {
  const meta = WORLDS[input.world] ?? WORLDS.digital;
  const features = mergeFeatures(meta.defaultFeatures, input.extraFeatures ?? []);

  let orgId = input.existingOrgId ?? null;

  if (!orgId) {
    if (await isWorkspaceNameTaken(input.name)) throw new WorkspaceNameTakenError();
    const { data, error } = await db.rpc('create_organization_with_owner', {
      _name: input.name,
      _slug: slugifyWorkspaceName(input.name),
      _category: input.category ?? meta.category,
      _description: input.description ?? undefined,
      _currency: input.currency,
    });
    if (error) throw error;
    orgId = data as string;
  }

  // Persist the chosen world so the dashboard is shaped right on first load.
  try {
    await (db.from('organizations') as any).update({ primary_world: input.world }).eq('id', orgId);
  } catch { /* non-fatal */ }

  await confirmSiteviralType(orgId!, meta.siteviralType, features, 'onboarding');

  if (input.providerProfile) {
    try {
      await (db.from('organizations') as any)
        .update({ provider_profile: input.providerProfile })
        .eq('id', orgId);
    } catch { /* non-fatal */ }
  }

  const partnerCode = input.partnerCode ?? readStoredPartnerCode();
  if (partnerCode) {
    try {
      await db.rpc('attribute_org_to_partner', { _org_id: orgId, _partner_code: partnerCode });
      try { sessionStorage.removeItem(PARTNER_STORAGE_KEY); } catch { /* ignore */ }
    } catch { /* non-fatal */ }
  }

  const { data: org } = await db.from('organizations').select('*').eq('id', orgId!).maybeSingle();

  return { orgId: orgId!, org: org ?? null, world: input.world, siteviralType: meta.siteviralType, features };
}

export function readStoredPartnerCode(): string | null {
  try { return sessionStorage.getItem(PARTNER_STORAGE_KEY); } catch { return null; }
}
