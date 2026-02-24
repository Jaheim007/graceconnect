import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export function useMyCertificates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('program_certificates')
        .select('*, programs(title, cover_image_url), organizations(name, slug, logo_url)')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });
}

export function useProgramCertificate(programId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['program-certificate', programId, user?.id],
    queryFn: async () => {
      if (!user || !programId) return null;
      const { data } = await db
        .from('program_certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!programId,
  });
}

export function useIssueCertificate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, orgId }: { programId: string; orgId: string }) => {
      if (!user) throw new Error('Not authenticated');
      // Check if already issued
      const { data: existing } = await db
        .from('program_certificates')
        .select('id')
        .eq('user_id', user.id)
        .eq('program_id', programId)
        .maybeSingle();
      if (existing) return existing;

      const certNumber = `SV-CERT-${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await db
        .from('program_certificates')
        .insert({
          user_id: user.id,
          program_id: programId,
          organization_id: orgId,
          certificate_number: certNumber,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['program-certificate', vars.programId] });
      qc.invalidateQueries({ queryKey: ['my-certificates'] });
    },
  });
}
