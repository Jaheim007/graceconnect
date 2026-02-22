
-- Table for curated directory listing applications
CREATE TABLE public.directory_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  decision_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one pending/approved application per org
CREATE UNIQUE INDEX idx_directory_applications_org_unique 
  ON public.directory_applications (organization_id) 
  WHERE status IN ('pending', 'approved');

-- Enable RLS
ALTER TABLE public.directory_applications ENABLE ROW LEVEL SECURITY;

-- Org admins can submit applications for their org
CREATE POLICY "dir_app_insert_org_admin" ON public.directory_applications
  FOR INSERT WITH CHECK (can_admin_org(auth.uid(), organization_id));

-- Org admins can view their own applications
CREATE POLICY "dir_app_select_org_admin" ON public.directory_applications
  FOR SELECT USING (can_admin_org(auth.uid(), organization_id));

-- Superadmin can view all
CREATE POLICY "dir_app_select_superadmin" ON public.directory_applications
  FOR SELECT USING (is_superadmin(auth.uid()));

-- Superadmin can update (approve/reject)
CREATE POLICY "dir_app_update_superadmin" ON public.directory_applications
  FOR UPDATE USING (is_superadmin(auth.uid()));
