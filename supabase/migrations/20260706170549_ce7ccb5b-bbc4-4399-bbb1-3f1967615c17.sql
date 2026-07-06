
CREATE TABLE public.education_tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  headline text, bio text, avatar_url text, cover_url text,
  city text, country text DEFAULT 'CI',
  languages text[] DEFAULT ARRAY['fr']::text[],
  levels text[] DEFAULT ARRAY[]::text[],
  teaching_modes text[] DEFAULT ARRAY['online']::text[],
  hourly_rate_xof integer DEFAULT 5000,
  years_experience integer DEFAULT 0,
  diplomas text[],
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  kyc_status text DEFAULT 'pending',
  rating_avg numeric(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  sessions_completed integer DEFAULT 0,
  response_minutes integer DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_tutors TO anon, authenticated;
GRANT INSERT, UPDATE ON public.education_tutors TO authenticated;
GRANT ALL ON public.education_tutors TO service_role;
ALTER TABLE public.education_tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_tutors_public_read" ON public.education_tutors FOR SELECT USING (is_active = true);
CREATE POLICY "edu_tutors_insert_own" ON public.education_tutors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "edu_tutors_update_own" ON public.education_tutors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "edu_tutors_admin_all" ON public.education_tutors FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));

CREATE TABLE public.education_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  subject text NOT NULL, level text, description text,
  rate_xof integer NOT NULL DEFAULT 5000,
  duration_min integer DEFAULT 60,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_subjects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.education_subjects TO authenticated;
GRANT ALL ON public.education_subjects TO service_role;
ALTER TABLE public.education_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_subjects_public" ON public.education_subjects FOR SELECT USING (is_active = true);
CREATE POLICY "edu_subjects_owner" ON public.education_subjects FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TABLE public.education_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  weekday smallint NOT NULL, start_time time NOT NULL, end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.education_availability TO authenticated;
GRANT ALL ON public.education_availability TO service_role;
ALTER TABLE public.education_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_avail_public" ON public.education_availability FOR SELECT USING (true);
CREATE POLICY "edu_avail_owner" ON public.education_availability FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TABLE public.education_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL, reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_availability_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.education_availability_blocks TO authenticated;
GRANT ALL ON public.education_availability_blocks TO service_role;
ALTER TABLE public.education_availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_blocks_public" ON public.education_availability_blocks FOR SELECT USING (true);
CREATE POLICY "edu_blocks_owner" ON public.education_availability_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TABLE public.education_provider_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  url text NOT NULL, kind text DEFAULT 'photo', caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_provider_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.education_provider_media TO authenticated;
GRANT ALL ON public.education_provider_media TO service_role;
ALTER TABLE public.education_provider_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_media_public" ON public.education_provider_media FOR SELECT USING (true);
CREATE POLICY "edu_media_owner" ON public.education_provider_media FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TABLE public.education_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, student_id)
);
GRANT SELECT, INSERT, UPDATE ON public.education_conversations TO authenticated;
GRANT ALL ON public.education_conversations TO service_role;
ALTER TABLE public.education_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_conv_participants" ON public.education_conversations FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));
CREATE POLICY "edu_conv_student_create" ON public.education_conversations FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "edu_conv_admin" ON public.education_conversations FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));

CREATE TABLE public.education_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.education_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL, filtered_body text,
  is_flagged boolean DEFAULT false,
  attachment_url text, read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.education_messages TO authenticated;
GRANT ALL ON public.education_messages TO service_role;
ALTER TABLE public.education_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_msg_view" ON public.education_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_conversations c WHERE c.id = conversation_id
    AND (c.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = c.tutor_id AND t.user_id = auth.uid()))));
CREATE POLICY "edu_msg_send" ON public.education_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.education_conversations c WHERE c.id = conversation_id
    AND (c.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = c.tutor_id AND t.user_id = auth.uid()))));

CREATE TABLE public.education_chat_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.education_messages(id) ON DELETE CASCADE,
  conversation_id uuid, sender_id uuid NOT NULL,
  raw_body text, categories text[], severity text DEFAULT 'low',
  reviewed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.education_chat_violations TO service_role;
GRANT SELECT ON public.education_chat_violations TO authenticated;
ALTER TABLE public.education_chat_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_viol_admin" ON public.education_chat_violations FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));

CREATE TABLE public.education_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.education_conversations(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  subject text NOT NULL, mode text NOT NULL DEFAULT 'online',
  session_count integer NOT NULL DEFAULT 1,
  duration_min integer NOT NULL DEFAULT 60,
  rate_xof integer NOT NULL, total_xof integer NOT NULL,
  description text, status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz, accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.education_offers TO authenticated;
GRANT ALL ON public.education_offers TO service_role;
ALTER TABLE public.education_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_offers_view" ON public.education_offers FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));
CREATE POLICY "edu_offers_tutor_create" ON public.education_offers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));
CREATE POLICY "edu_offers_update" ON public.education_offers FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TABLE public.education_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.education_offers(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.education_conversations(id) ON DELETE SET NULL,
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL,
  subject text NOT NULL, mode text NOT NULL DEFAULT 'online',
  scheduled_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 60,
  session_count integer NOT NULL DEFAULT 1,
  sessions_done integer NOT NULL DEFAULT 0,
  location_address text, meeting_url text,
  total_xof integer NOT NULL,
  platform_fee_xof integer NOT NULL DEFAULT 0,
  tutor_earnings_xof integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_ref text,
  status text NOT NULL DEFAULT 'awaiting_payment',
  start_otp text, end_otp text,
  started_at timestamptz, ended_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.education_bookings TO authenticated;
GRANT ALL ON public.education_bookings TO service_role;
ALTER TABLE public.education_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_book_participants" ON public.education_bookings FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));
CREATE POLICY "edu_book_student_create" ON public.education_bookings FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "edu_book_admin" ON public.education_bookings FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));

CREATE TABLE public.education_booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.education_bookings(id) ON DELETE CASCADE,
  event_type text NOT NULL, meta jsonb, actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.education_booking_events TO authenticated;
GRANT ALL ON public.education_booking_events TO service_role;
ALTER TABLE public.education_booking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_bevents_view" ON public.education_booking_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_bookings b WHERE b.id = booking_id
    AND (b.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = b.tutor_id AND t.user_id = auth.uid()))));

CREATE TABLE public.education_extra_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.education_bookings(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  label text NOT NULL, amount_xof integer NOT NULL,
  reason text, status text NOT NULL DEFAULT 'pending',
  payment_ref text, paid_at timestamptz, approved_at timestamptz, rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.education_extra_charges TO authenticated;
GRANT ALL ON public.education_extra_charges TO service_role;
ALTER TABLE public.education_extra_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_extra_view" ON public.education_extra_charges FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));
CREATE POLICY "edu_extra_tutor_create" ON public.education_extra_charges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));
CREATE POLICY "edu_extra_update" ON public.education_extra_charges FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TABLE public.education_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.education_bookings(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  reason text NOT NULL, description text,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.education_disputes TO authenticated;
GRANT ALL ON public.education_disputes TO service_role;
ALTER TABLE public.education_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_disputes_view" ON public.education_disputes FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid()) OR
    EXISTS (SELECT 1 FROM public.education_bookings b WHERE b.id = booking_id
      AND (b.student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = b.tutor_id AND t.user_id = auth.uid())))
  );
CREATE POLICY "edu_disputes_open" ON public.education_disputes FOR INSERT TO authenticated WITH CHECK (opened_by = auth.uid());

CREATE TABLE public.education_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.education_bookings(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text, reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);
GRANT SELECT ON public.education_reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.education_reviews TO authenticated;
GRANT ALL ON public.education_reviews TO service_role;
ALTER TABLE public.education_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_reviews_public" ON public.education_reviews FOR SELECT USING (true);
CREATE POLICY "edu_reviews_student_write" ON public.education_reviews FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "edu_reviews_student_edit" ON public.education_reviews FOR UPDATE TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "edu_reviews_tutor_reply" ON public.education_reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TABLE public.education_tutor_stats (
  tutor_id uuid PRIMARY KEY REFERENCES public.education_tutors(id) ON DELETE CASCADE,
  total_earnings_xof bigint DEFAULT 0,
  pending_earnings_xof bigint DEFAULT 0,
  sessions_completed integer DEFAULT 0,
  sessions_cancelled integer DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.education_tutor_stats TO authenticated;
GRANT ALL ON public.education_tutor_stats TO service_role;
ALTER TABLE public.education_tutor_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_stats_owner" ON public.education_tutor_stats FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.education_tutors t WHERE t.id = tutor_id AND t.user_id = auth.uid()));

CREATE TRIGGER update_edu_tutors_updated_at BEFORE UPDATE ON public.education_tutors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_edu_subjects_updated_at BEFORE UPDATE ON public.education_subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_edu_conversations_updated_at BEFORE UPDATE ON public.education_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_edu_offers_updated_at BEFORE UPDATE ON public.education_offers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_edu_bookings_updated_at BEFORE UPDATE ON public.education_bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_edu_extra_charges_updated_at BEFORE UPDATE ON public.education_extra_charges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_edu_disputes_updated_at BEFORE UPDATE ON public.education_disputes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_edu_reviews_updated_at BEFORE UPDATE ON public.education_reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.education_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.education_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.education_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.education_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.education_extra_charges;

CREATE INDEX idx_edu_tutors_slug ON public.education_tutors(slug);
CREATE INDEX idx_edu_tutors_city ON public.education_tutors(city);
CREATE INDEX idx_edu_subjects_tutor ON public.education_subjects(tutor_id);
CREATE INDEX idx_edu_messages_conv ON public.education_messages(conversation_id, created_at DESC);
CREATE INDEX idx_edu_bookings_tutor ON public.education_bookings(tutor_id, scheduled_at DESC);
CREATE INDEX idx_edu_bookings_student ON public.education_bookings(student_id, scheduled_at DESC);
