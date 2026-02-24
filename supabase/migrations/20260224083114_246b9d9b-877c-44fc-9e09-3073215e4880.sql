
-- ==========================================
-- 1. BOOKMARKS / FAVORITES TABLE
-- ==========================================
CREATE TABLE public.user_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'product', 'media', 'event', 'campaign', 'announcement'
  content_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON public.user_bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "bookmarks_insert_own" ON public.user_bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookmarks_delete_own" ON public.user_bookmarks FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_bookmarks_user ON public.user_bookmarks(user_id);
CREATE INDEX idx_bookmarks_content ON public.user_bookmarks(content_type, content_id);

-- ==========================================
-- 2. COMMENTS TABLE
-- ==========================================
CREATE TABLE public.content_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'announcement', 'event', 'media'
  content_id UUID NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_public" ON public.content_comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "comments_insert_auth" ON public.content_comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_update_own" ON public.content_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "comments_delete_own" ON public.content_comments FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_comments_content ON public.content_comments(content_type, content_id);
CREATE INDEX idx_comments_user ON public.content_comments(user_id);

-- ==========================================
-- 3. NOTIFICATION PREFERENCES TABLE
-- ==========================================
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  purchases BOOLEAN NOT NULL DEFAULT true,
  donations BOOLEAN NOT NULL DEFAULT true,
  announcements BOOLEAN NOT NULL DEFAULT true,
  events BOOLEAN NOT NULL DEFAULT true,
  comments BOOLEAN NOT NULL DEFAULT true,
  affiliate BOOLEAN NOT NULL DEFAULT true,
  programs BOOLEAN NOT NULL DEFAULT true,
  marketing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_select_own" ON public.notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notif_prefs_insert_own" ON public.notification_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_prefs_update_own" ON public.notification_preferences FOR UPDATE USING (user_id = auth.uid());

-- ==========================================
-- 4. CONTENT VERSIONS TABLE (versioning)
-- ==========================================
CREATE TABLE public.content_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'announcement', 'product', 'event'
  content_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  changed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "versions_select_admin" ON public.content_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM organizations o
    WHERE can_manage_org(auth.uid(), o.id)
  ) OR is_superadmin(auth.uid()));

CREATE INDEX idx_versions_content ON public.content_versions(content_type, content_id);

-- ==========================================
-- 5. CLIENT ANALYTICS / EVENT TRACKING
-- ==========================================
CREATE TABLE public.client_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_insert_anon" ON public.client_events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_select_superadmin" ON public.client_events FOR SELECT USING (is_superadmin(auth.uid()));

CREATE INDEX idx_client_events_name ON public.client_events(event_name);
CREATE INDEX idx_client_events_date ON public.client_events(created_at);
