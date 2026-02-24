import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

export interface OrgPageSettings {
  id: string;
  organization_id: string;
  section_order: string[];
  hidden_sections: string[];
  theme_primary_color: string | null;
  theme_accent_color: string | null;
  facebook_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  google_tag_id: string | null;
  popup_config: Record<string, unknown> | null;
  updated_at: string;
}

const DEFAULT_SECTION_ORDER = ['products', 'campaigns', 'content', 'photos', 'events'];

export function useOrgPageSettings(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-page-settings', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await db
        .from('org_page_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single();
      return (data as OrgPageSettings | null) ?? {
        organization_id: orgId,
        section_order: DEFAULT_SECTION_ORDER,
        hidden_sections: [],
        theme_primary_color: null,
        theme_accent_color: null,
        facebook_pixel_id: null,
        tiktok_pixel_id: null,
        google_tag_id: null,
        popup_config: null,
      } as OrgPageSettings;
    },
    enabled: !!orgId,
  });
}

export function useUpsertOrgPageSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, updates }: { orgId: string; updates: Partial<OrgPageSettings> }) => {
      const { data: existing } = await db
        .from('org_page_settings')
        .select('id')
        .eq('organization_id', orgId)
        .single();

      if (existing) {
        const { data, error } = await db
          .from('org_page_settings')
          .update(updates)
          .eq('organization_id', orgId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await db
          .from('org_page_settings')
          .insert({ organization_id: orgId, ...updates })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_: unknown, vars) => {
      qc.invalidateQueries({ queryKey: ['org-page-settings', vars.orgId] });
    },
  });
}
