import { supabase } from '@/integrations/supabase/client';

/**
 * Single client entry point for course certificates.
 *
 * Issuance is server-authoritative: the browser can no longer INSERT into
 * program_certificates (no grant, no INSERT policy). The only path is the
 * SECURITY DEFINER function public.issue_program_certificate(_program_id).
 *
 * Rendering is also consolidated: the `generate-certificate-pdf` edge function
 * is the single output path. The old canvas/PNG renderer has been removed.
 */

export type IssueCertificateResult = {
  ok: boolean;
  already_issued?: boolean;
  certificate_id?: string;
  certificate_number?: string;
  issued_at?: string;
  error?: string;
  completed_slides?: number;
  required_slides?: number;
  progress_percent?: number;
  score_percent?: number;
  passing_score?: number;
  source?: string;
};

const ERRORS: Record<string, { fr: string; en: string }> = {
  not_authenticated: {
    fr: 'Connecte-toi pour obtenir ton certificat.',
    en: 'Sign in to claim your certificate.',
  },
  program_not_found: {
    fr: 'Formation introuvable.',
    en: 'Course not found.',
  },
  program_not_published: {
    fr: "Cette formation n'est pas encore publiée.",
    en: 'This course is not published yet.',
  },
  certificates_disabled: {
    fr: 'Cette formation ne délivre pas de certificat.',
    en: 'This course does not issue certificates.',
  },
  not_enrolled: {
    fr: "Tu n'es pas inscrit à cette formation.",
    en: 'You are not enrolled in this course.',
  },
  slides_incomplete: {
    fr: 'Termine toutes les diapositives pour débloquer ton certificat.',
    en: 'Complete every slide to unlock your certificate.',
  },
  assessment_not_taken: {
    fr: "Passe l'évaluation finale pour obtenir ton certificat.",
    en: 'Take the final assessment to get your certificate.',
  },
  assessment_not_passed: {
    fr: "Ton score à l'évaluation finale est en dessous du seuil requis.",
    en: 'Your final assessment score is below the required threshold.',
  },
};

export function certificateErrorMessage(code: string | undefined, isFr: boolean): string {
  const entry = code ? ERRORS[code] : undefined;
  if (entry) return isFr ? entry.fr : entry.en;
  return isFr ? "Impossible d'émettre le certificat." : 'Could not issue the certificate.';
}

/** Ask the server to issue (or return) the caller's certificate for a course. */
export async function issueProgramCertificate(programId: string): Promise<IssueCertificateResult> {
  const { data, error } = await supabase.rpc('issue_program_certificate', {
    _program_id: programId,
  });
  if (error) throw error;
  return (data ?? { ok: false, error: 'unknown' }) as unknown as IssueCertificateResult;
}

/** Download the certificate PDF — the single certificate renderer. */
export async function downloadCertificatePdf(opts: {
  certificateId: string;
  filename?: string;
}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate-pdf`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ certificateId: opts.certificateId }),
    }
  );
  if (!res.ok) throw new Error('Failed to generate certificate PDF');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opts.filename || 'certificate.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

export function certificateFilename(courseTitle: string, certNumber?: string): string {
  const slug = courseTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'certificate';
  return certNumber ? `certificat-${slug}-${certNumber}.pdf` : `certificat-${slug}.pdf`;
}
