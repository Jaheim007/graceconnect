
-- Email logs table to track all sent emails
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template text NOT NULL,
  recipient text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'sent',
  resend_message_id text,
  error_message text,
  organization_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can read email logs
CREATE POLICY "email_logs_superadmin_select" ON public.email_logs
  FOR SELECT USING (is_superadmin(auth.uid()));

-- No direct insert/update/delete from client - only via edge function with service role
CREATE INDEX idx_email_logs_template ON public.email_logs (template);
CREATE INDEX idx_email_logs_recipient ON public.email_logs (recipient);
CREATE INDEX idx_email_logs_created_at ON public.email_logs (created_at DESC);
CREATE INDEX idx_email_logs_org ON public.email_logs (organization_id);
