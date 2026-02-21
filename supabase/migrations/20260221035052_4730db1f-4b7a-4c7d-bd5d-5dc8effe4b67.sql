
-- Photo gallery for organizations
CREATE TABLE public.org_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_photos ENABLE ROW LEVEL SECURITY;

-- Public can see published photos
CREATE POLICY "photos_public_select" ON public.org_photos
  FOR SELECT USING (is_published = true);

-- Managers can see all photos for their org
CREATE POLICY "photos_manager_select" ON public.org_photos
  FOR SELECT USING (can_manage_org(auth.uid(), organization_id));

-- Managers can insert
CREATE POLICY "photos_manager_insert" ON public.org_photos
  FOR INSERT WITH CHECK (can_manage_org(auth.uid(), organization_id));

-- Managers can update
CREATE POLICY "photos_manager_update" ON public.org_photos
  FOR UPDATE USING (can_manage_org(auth.uid(), organization_id));

-- Admins can delete
CREATE POLICY "photos_admin_delete" ON public.org_photos
  FOR DELETE USING (can_admin_org(auth.uid(), organization_id));

-- Superadmin select
CREATE POLICY "photos_superadmin_select" ON public.org_photos
  FOR SELECT USING (is_superadmin(auth.uid()));

-- Index for fast org lookups
CREATE INDEX idx_org_photos_org ON public.org_photos(organization_id, display_order);
