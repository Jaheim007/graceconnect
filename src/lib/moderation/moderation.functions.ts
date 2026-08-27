import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import {
  assertSuperadmin,
  runTrustAdminAction,
  createKycSignedUrl,
  notifyContentReport,
} from './moderation.server';

export const trustAdminAction = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    violation_id?: string | null;
    target_user_id: string;
    action: string;
    custom_message?: string;
    notes?: string;
  }) => input)
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase, context.userId);
    return runTrustAdminAction({
      actorId: context.userId,
      violationId: data.violation_id ?? null,
      targetUserId: data.target_user_id,
      action: data.action,
      customMessage: data.custom_message,
      notes: data.notes,
    });
  });

export const kycSignedUrl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { url: string; org_id: string; document_type?: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase, context.userId);
    return createKycSignedUrl({
      actorId: context.userId,
      url: data.url,
      orgId: data.org_id,
      documentType: data.document_type,
    });
  });

export const notifyReport = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    content_id: string;
    content_type?: string;
    content_title?: string;
    reason: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const { data: userRes } = await context.supabase.auth.getUser();
    return notifyContentReport({
      contentId: data.content_id,
      contentType: data.content_type,
      contentTitle: data.content_title,
      reason: data.reason,
      reporterEmail: userRes?.user?.email ?? undefined,
      reporterId: context.userId,
    });
  });
