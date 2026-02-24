
-- Store organization page customization (section order, visibility, theme)
CREATE TABLE public.org_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_order text[] DEFAULT ARRAY['products', 'campaigns', 'content', 'photos', 'events']::text[],
  hidden_sections text[] DEFAULT '{}'::text[],
  theme_primary_color text DEFAULT NULL,
  theme_accent_color text DEFAULT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.org_page_settings ENABLE ROW LEVEL SECURITY;

-- Only org managers can read/write their page settings
CREATE POLICY "page_settings_manager_select" ON public.org_page_settings
  FOR SELECT USING (can_manage_org(auth.uid(), organization_id));

CREATE POLICY "page_settings_manager_insert" ON public.org_page_settings
  FOR INSERT WITH CHECK (can_manage_org(auth.uid(), organization_id));

CREATE POLICY "page_settings_manager_update" ON public.org_page_settings
  FOR UPDATE USING (can_manage_org(auth.uid(), organization_id));

-- Public can read settings (for rendering)
CREATE POLICY "page_settings_public_select" ON public.org_page_settings
  FOR SELECT USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_org_page_settings_updated_at
  BEFORE UPDATE ON public.org_page_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
