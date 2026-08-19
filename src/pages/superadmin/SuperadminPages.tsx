import { useQuery } from '@tanstack/react-query';
import { getOrgCategoryLabel } from '@/lib/categoryLabels';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, DollarSign, BarChart3, Activity, ShoppingBag, Heart, Filter, Download, Search, CalendarIcon, Shield, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useMemo } from 'react';
import { downloadCSV } from '@/lib/csvExport';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, subDays, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { askConfirm } from '@/components/ui/confirm-dialog';

export function SuperadminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: async () => {
      const { data } = await db.rpc('get_platform_totals');
      const t = (data || {}) as any;
      return {
        orgs: t.total_orgs || 0,
        pendingKyc: t.pending_kyc || 0,
        gmv: t.gmv || 0,
        pendingPayouts: t.pending_payouts || 0,
      };
    },
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['sa-platform-metrics'],
    queryFn: async () => {
      const { data } = await db.from('platform_metrics_daily').select('*')
        .order('metric_date', { ascending: true }).limit(30);
      return data || [];
    },
  });

  const cards = [
    { label: 'Total Organisations', value: stats?.orgs ?? '—', icon: Users, color: 'text-blue-500' },
    { label: 'GMV Total (XOF)', value: stats?.gmv ? stats.gmv.toLocaleString() : '—', icon: DollarSign, color: 'text-primary' },
    { label: 'Vérifications en attente', value: stats?.pendingKyc ?? '—', icon: Activity, color: 'text-amber-500' },
    { label: 'Payouts en attente', value: stats?.pendingPayouts ?? '—', icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">🛡️ Superadmin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {metrics.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> GMV quotidien</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="metric_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function SuperadminOrgs() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['sa-orgs'],
    queryFn: async () => { const { data } = await db.from('organizations').select('*').order('created_at', { ascending: false }); return data || []; },
  });
  const { toast } = useToast();
  const suspend = async (orgId: string, suspend: boolean) => {
    await db.from('organizations').update({ is_suspended: suspend, suspension_reason: suspend ? 'Admin decision' : null }).eq('id', orgId);
    toast({ title: suspend ? 'Organisation suspendue' : 'Suspension levée' });
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Organizations</h1>
      {isLoading ? <SkeletonRow count={5} /> : (
        <div className="space-y-2">
          {orgs.map((o: any) => (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{o.name}</p>
                <p className="text-xs text-muted-foreground">{o.slug} · {o.country} · {getOrgCategoryLabel(o.category)}</p>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize">{o.plan_type}</Badge>
              <Badge className={`text-[10px] border-0 ${o.kyc_status === 'level1' ? 'bg-green-500/15 text-green-600' : o.kyc_status === 'level2' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-yellow-500/15 text-yellow-600'}`}>
                {o.kyc_status === 'none' ? 'Non vérifié' : o.kyc_status === 'level1' ? 'Vérifié Niv.1' : o.kyc_status === 'level2' ? 'Vérifié Niv.2' : o.kyc_status || 'Non vérifié'}
              </Badge>
              {o.is_suspended ? (
                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => suspend(o.id, false)}>Unsuspend</Button>
              ) : (
                <Button size="sm" variant="outline" className="h-6 text-[10px] text-destructive border-destructive/30" onClick={() => suspend(o.id, true)}>Suspend</Button>
              )}
              <Badge variant={o.is_active ? 'secondary' : 'destructive'} className="text-[10px]">{o.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SuperadminKYC() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState<Record<string, boolean>>({});
  const [rejectTarget, setRejectTarget] = useState<{ id: string; orgId: string; name: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['sa-kyc', filter],
    queryFn: async () => {
      let q = db.from('kyc_submissions').select('*, organizations!left(name, category, slug), beauty_providers!left(business_name, slug)').order('submitted_at', { ascending: false });
      if (filter !== 'all') q = q.eq('status', filter);
      const { data } = await q.limit(100);
      return data || [];
    },
  });

  // Get signed URL for a document
  const getSignedUrl = async (url: string, orgId: string, docType: string) => {
    const cacheKey = `${orgId}-${docType}`;
    if (signedUrls[cacheKey]) {
      window.open(signedUrls[cacheKey], '_blank');
      return;
    }
    setLoadingUrls(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const { data, error } = await db.functions.invoke('kyc-signed-url', {
        body: { url, org_id: orgId, document_type: docType },
      });
      if (error) throw error;
      if (data?.signedUrl) {
        setSignedUrls(prev => ({ ...prev, [cacheKey]: data.signedUrl }));
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message || 'Impossible de générer l\'URL sécurisée', variant: 'destructive' });
    } finally {
      setLoadingUrls(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  const approve = async (id: string, orgId: string) => {
    const sub = submissions.find((s: any) => s.id === id);
    const isBeauty = !!sub?.beauty_provider_id;
    if (isBeauty) {
      const { error } = await db.rpc('review_beauty_kyc', { _submission_id: id, _action: 'approve' });
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await db.rpc('review_org_kyc', { _org_id: orgId, _action: 'approve' });
      if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      const orgName = sub?.organizations?.name || 'Organisation';
      import('@/lib/notifications').then(m => m.onKycStatusChanged(orgId, orgName, 'approved'));
    }
    toast({ title: 'Vérification approuvée ✅' }); refetch();
  };

  const reject = (id: string, orgId: string) => {
    const sub = submissions.find((s: any) => s.id === id);
    setRejectTarget({ id, orgId, name: sub?.organizations?.name || sub?.beauty_providers?.business_name || 'Organisation' });
  };

  const confirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    const { id, orgId, name } = rejectTarget;
    setRejecting(true);
    try {
      const sub = submissions.find((s: any) => s.id === id);
      const isBeauty = !!sub?.beauty_provider_id;
      if (isBeauty) {
        const { error } = await db.rpc('review_beauty_kyc', { _submission_id: id, _action: 'reject', _reason: reason });
        if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
      } else {
        const { error } = await db.rpc('review_org_kyc', { _org_id: orgId, _action: 'reject', _reason: reason });
        if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
        import('@/lib/notifications').then(m => m.onKycStatusChanged(orgId, name, 'rejected', reason));
      }
      setRejectTarget(null);
      toast({ title: 'Vérification refusée', description: 'Le motif détaillé a été envoyé par e-mail.' });
      refetch();
    } finally {
      setRejecting(false);
    }
  };

  const triggerLevel2 = async (orgId: string) => {
    if (!(await askConfirm("Déclencher la vérification externe (Niveau 2) pour cette organisation ? L'utilisateur sera redirigé vers Stripe/Paystack pour une vérification approfondie."))) return;
    await db.from('organizations').update({ kyc_status: 'level2_required' as any }).eq('id', orgId);
    toast({ title: 'Vérification externe déclenchée' }); refetch();
  };

  const pendingCount = submissions.filter((s: any) => s.status === 'pending').length;

  // Secure document viewer button
  const SecureDocButton = ({ url, orgId, docType, label, isRound }: { url: string; orgId: string; docType: string; label: string; isRound?: boolean }) => {
    const cacheKey = `${orgId}-${docType}`;
    const isLoading = loadingUrls[cacheKey];
    return (
      <button
        onClick={() => getSignedUrl(url, orgId, docType)}
        disabled={isLoading}
        className="block text-left w-full group"
      >
        <div className={`h-24 w-full rounded-lg border bg-muted/50 flex items-center justify-center group-hover:border-primary/50 transition-colors ${isRound ? 'w-24 mx-auto rounded-full' : ''}`}>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="text-center">
              <Shield className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-[9px] text-muted-foreground">🔒 Cliquer pour voir</p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-0.5">{label}</p>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">
          Vérifications de compte
          {filter === 'pending' && pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
          )}
        </h1>
        <div className="flex gap-1">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="text-xs h-8">
              {f === 'pending' ? '⏳ En attente' : f === 'approved' ? '✅ Approuvées' : f === 'rejected' ? '❌ Refusées' : '📋 Toutes'}
            </Button>
          ))}
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border">
        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground">
          🔒 Les documents sont stockés dans un bucket privé chiffré. Chaque consultation génère une URL temporaire (5 min) et est enregistrée dans le journal d'audit.
          Rétention : <strong>5 ans</strong> conformément aux réglementations BCEAO/CENTIF.
        </p>
      </div>

      {isLoading ? <SkeletonRow count={3} /> : submissions.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          {filter === 'pending' ? 'Aucune vérification en attente 🎉' : 'Aucun résultat'}
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s: any) => {
            const org = s.organizations;
            const beauty = s.beauty_providers;
            const displayName = org?.name || beauty?.business_name || s.organization_id?.slice(0, 8) || s.beauty_provider_id?.slice(0, 8);
            const displaySlug = org?.slug ? `/${org.slug}` : beauty?.slug ? `/beauty/p/${beauty.slug}` : '';
            return (
              <div key={s.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {displayName}
                      {org?.category && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">{org.category}</Badge>
                      )}
                      {beauty && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Beauty</Badge>
                      )}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                       {displaySlug} · Soumis le {new Date(s.submitted_at).toLocaleDateString()}
                       {s.document_expires_at && (
                         <span> · Expire le {new Date(s.document_expires_at).toLocaleDateString()}</span>
                       )}
                    </p>
                  </div>
                  <Badge variant={s.status === 'pending' ? 'default' : s.status === 'approved' ? 'secondary' : 'destructive'}>
                    {s.status === 'pending' ? '⏳ En attente' : s.status === 'approved' ? '✅ Approuvé' : '❌ Refusé'}
                  </Badge>
                </div>

                {/* Identity documents (KYC) — secured */}
                <div>
                  <p className="text-xs font-semibold mb-1.5">👤 Identité du responsable</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {s.id_document_url && (
                      <SecureDocButton url={s.id_document_url} orgId={s.organization_id} docType="id_front" label="ID Recto" />
                    )}
                    {s.id_document_back_url && (
                      <SecureDocButton url={s.id_document_back_url} orgId={s.organization_id} docType="id_back" label="ID Verso" />
                    )}
                    {s.selfie_url && (
                      <SecureDocButton url={s.selfie_url} orgId={s.organization_id} docType="selfie" label="Selfie" isRound />
                    )}
                    {s.selfie_with_doc_url && (
                      <SecureDocButton url={s.selfie_with_doc_url} orgId={s.organization_id} docType="selfie_with_doc" label="Selfie + Doc" />
                    )}
                  </div>
                </div>

                {/* Organization documents (KYB) — secured */}
                {(s.org_document_url || s.org_document_type) && (
                  <div>
                    <p className="text-xs font-semibold mb-1.5">🏢 Documents organisation</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {s.org_document_url && (
                        <SecureDocButton url={s.org_document_url} orgId={s.organization_id} docType="org_document" label={s.org_document_type || 'Document org'} />
                      )}
                    </div>
                  </div>
                )}

                {/* AI Analysis Report */}
                {s.ai_analyzed_at && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">🤖 Rapport IA</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        (s.ai_confidence_score || 0) >= 80 ? 'bg-primary/10 text-primary' :
                        (s.ai_confidence_score || 0) >= 50 ? 'bg-accent text-accent-foreground' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        Score : {s.ai_confidence_score || 0}%
                      </span>
                    </div>
                    
                    {s.ai_summary && (
                      <p className="text-[11px] text-muted-foreground">{s.ai_summary}</p>
                    )}

                    {/* OCR Data */}
                    {s.ai_ocr_data && Object.keys(s.ai_ocr_data).length > 0 && s.ai_ocr_data.full_name && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">📋 Données OCR extraites :</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                          {s.ai_ocr_data.full_name && <p><span className="text-muted-foreground">Nom :</span> <strong>{s.ai_ocr_data.full_name}</strong></p>}
                          {s.ai_ocr_data.date_of_birth && <p><span className="text-muted-foreground">Né(e) le :</span> {s.ai_ocr_data.date_of_birth}</p>}
                          {s.ai_ocr_data.document_number && <p><span className="text-muted-foreground">N° doc :</span> {s.ai_ocr_data.document_number}</p>}
                          {s.ai_ocr_data.expiry_date && <p><span className="text-muted-foreground">Expire :</span> {s.ai_ocr_data.expiry_date}</p>}
                          {s.ai_ocr_data.nationality && <p><span className="text-muted-foreground">Nationalité :</span> {s.ai_ocr_data.nationality}</p>}
                          {s.ai_ocr_data.gender && <p><span className="text-muted-foreground">Genre :</span> {s.ai_ocr_data.gender}</p>}
                        </div>
                      </div>
                    )}

                    {/* Face Match */}
                    {s.ai_face_match && s.ai_face_match.id_vs_selfie && s.ai_face_match.id_vs_selfie !== 'not_available' && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <span>{s.ai_face_match.id_vs_selfie === 'match' ? '✅' : s.ai_face_match.id_vs_selfie === 'likely_match' ? '🟡' : '⚠️'}</span>
                        <span>Correspondance visage : <strong>{
                          s.ai_face_match.id_vs_selfie === 'match' ? 'Confirmée' :
                          s.ai_face_match.id_vs_selfie === 'likely_match' ? 'Probable' :
                          s.ai_face_match.id_vs_selfie === 'uncertain' ? 'Incertaine' : 'Non concordante'
                        }</strong></span>
                        {s.ai_face_match.notes && <span className="text-muted-foreground ml-1">— {s.ai_face_match.notes}</span>}
                      </div>
                    )}

                    {/* Fraud Detection */}
                    {s.ai_fraud_detection && s.ai_fraud_detection.risk_level && s.ai_fraud_detection.risk_level !== 'none' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            s.ai_fraud_detection.risk_level === 'critical' || s.ai_fraud_detection.risk_level === 'high' 
                              ? 'bg-destructive/10 text-destructive' 
                              : s.ai_fraud_detection.risk_level === 'medium' ? 'bg-accent text-accent-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            ⚠️ Risque : {s.ai_fraud_detection.risk_level.toUpperCase()}
                          </span>
                          {s.ai_fraud_detection.is_screenshot && <span className="text-destructive">📱 Capture d'écran</span>}
                          {s.ai_fraud_detection.is_photocopy && <span className="text-destructive">📄 Photocopie</span>}
                          {s.ai_fraud_detection.is_expired && <span className="text-destructive">⏰ Expiré</span>}
                          {s.ai_fraud_detection.tampering_detected && <span className="text-destructive">🔧 Falsification</span>}
                        </div>
                        {s.ai_fraud_detection.flags?.length > 0 && (
                          <ul className="text-[9px] text-muted-foreground space-y-0.5 ml-2">
                            {s.ai_fraud_detection.flags.map((f: string, i: number) => <li key={i}>• {f}</li>)}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Quality Assessment Issues */}
                    {s.ai_quality_assessment?.issues?.length > 0 && (
                      <div className="text-[9px] text-muted-foreground">
                        <p className="font-semibold mb-0.5">📸 Problèmes de qualité :</p>
                        {s.ai_quality_assessment.issues.map((issue: string, i: number) => (
                          <p key={i}>• {issue}</p>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {s.ai_recommendations && (
                      <div className="text-[9px]">
                        <p className="font-semibold text-muted-foreground mb-0.5">💡 Recommandations :</p>
                        {(Array.isArray(s.ai_recommendations) ? s.ai_recommendations : [s.ai_recommendations]).map((r: string, i: number) => (
                          <p key={i} className="text-muted-foreground">→ {r}</p>
                        ))}
                      </div>
                    )}

                    <p className="text-[8px] text-muted-foreground text-right">
                      Analysé le {new Date(s.ai_analyzed_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Re-analyze button for pending submissions without AI analysis */}
                {s.status === 'pending' && !s.ai_analyzed_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={async () => {
                      try {
                        toast({ title: '🤖 Analyse IA lancée...' });
                        await db.functions.invoke('kyc-analyze-document', {
                          body: {
                            submission_id: s.id,
                            doc_front_url: s.id_document_url,
                            doc_back_url: s.id_document_back_url || null,
                            selfie_url: s.selfie_url || null,
                            selfie_with_doc_url: s.selfie_with_doc_url || null,
                            doc_type: s.id_document_type,
                          },
                        });
                        toast({ title: '✅ Analyse IA terminée' });
                        refetch();
                      } catch (err: any) {
                        toast({ title: 'Erreur IA', description: err.message, variant: 'destructive' });
                      }
                    }}
                  >
                    🤖 Lancer l'analyse IA
                  </Button>
                )}

                {/* Details */}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {s.id_document_type && <p>📄 Type ID : {s.id_document_type}</p>}
                  {s.bank_name && <p>🏦 Banque : {s.bank_name} · {s.bank_account_name} · {s.bank_account_number}</p>}
                  {s.payout_method && <p>💳 Paiement : {s.payout_method} {s.payout_phone ? `· ${s.payout_phone}` : ''} {s.payout_provider ? `· ${s.payout_provider}` : ''}</p>}
                  {s.rejection_reason && <p className="text-destructive">❌ Motif : {s.rejection_reason}</p>}
                </div>

                {/* Actions */}
                {s.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => approve(s.id, s.organization_id)}>✅ Approuver</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => reject(s.id, s.organization_id)}>❌ Rejeter</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs ml-auto" onClick={() => triggerLevel2(s.organization_id)}>
                      🔗 Déclencher vérification externe
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// SuperadminTransactions moved to ./SuperadminTransactions.tsx

export function SuperadminReports() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ['sa-reports'],
    queryFn: async () => {
      const { data } = await db
        .from('content_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (!data) return [];

      const reporterIds = [...new Set(data.map((r: any) => r.reporter_user_id))];
      const contentProductIds = data.filter((r: any) => r.content_type === 'product').map((r: any) => r.content_id);

      const [profilesRes, productsRes] = await Promise.all([
        reporterIds.length > 0
          ? db.from('profiles').select('id, display_name, avatar_url').in('id', reporterIds)
          : Promise.resolve({ data: [] }),
        contentProductIds.length > 0
          ? db.from('digital_products').select('id, title, cover_image_url, price, currency, organization_id, slug, organizations(name)').in('id', contentProductIds)
          : Promise.resolve({ data: [] }),
      ]);

      // Resolve emails for reporters without display_name
      const blankReporterIds = (profilesRes.data || []).filter((p: any) => !p.display_name || !p.display_name.trim()).map((p: any) => p.id);
      const emailMap: Record<string, string> = {};
      if (blankReporterIds.length > 0) {
        const [pe, de] = await Promise.all([
          db.from('product_purchases').select('user_id, buyer_email').in('user_id', blankReporterIds).limit(50),
          db.from('donations').select('user_id, donor_email').in('user_id', blankReporterIds).limit(50),
        ]);
        (pe.data || []).forEach((r: any) => { if (r.buyer_email && r.user_id) emailMap[r.user_id] = r.buyer_email; });
        (de.data || []).forEach((r: any) => { if (r.donor_email && r.user_id) emailMap[r.user_id] = r.donor_email; });
      }

      const deriveName = (email: string) => email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

      const profilesMap = Object.fromEntries((profilesRes.data || []).map((p: any) => [p.id, {
        ...p,
        display_name: (p.display_name && p.display_name.trim()) ? p.display_name : emailMap[p.id] ? deriveName(emailMap[p.id]) : null,
        _email: emailMap[p.id] || null,
      }]));
      const productsMap = Object.fromEntries((productsRes.data || []).map((p: any) => [p.id, p]));

      return data.map((r: any) => ({
        ...r,
        reporter: profilesMap[r.reporter_user_id] || null,
        product: r.content_type === 'product' ? productsMap[r.content_id] || null : null,
      }));
    },
  });

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await db.from('content_reports').update({ status: newStatus as any }).eq('id', id);
    if (error) {
      toast({ title: 'Erreur', variant: 'destructive' });
    } else {
      toast({ title: `Statut mis à jour : ${newStatus}` });
      refetch();
    }
  };

  const deleteReport = async (id: string) => {
    const { error } = await db.from('content_reports').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur lors de la suppression', variant: 'destructive' });
    } else {
      toast({ title: 'Signalement supprimé' });
      refetch();
    }
  };

  const filteredData = data.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.content_type !== typeFilter) return false;
    return true;
  });

  const statusCounts = {
    all: data.length,
    pending: data.filter((r: any) => r.status === 'pending').length,
    reviewed: data.filter((r: any) => r.status === 'reviewed').length,
    resolved: data.filter((r: any) => r.status === 'resolved').length,
    dismissed: data.filter((r: any) => r.status === 'dismissed').length,
  };

  const contentTypes = [...new Set(data.map((r: any) => r.content_type))];

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    reviewed: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    resolved: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    dismissed: 'bg-muted text-muted-foreground border-border',
  };

  const statusIcons: Record<string, string> = {
    pending: '⏳',
    reviewed: '🔍',
    resolved: '✅',
    dismissed: '✕',
  };

  const tabConfig: Record<string, { label: string; tone: string }> = {
    all:       { label: 'Tous',      tone: 'text-foreground bg-muted ring-border' },
    pending:   { label: 'À traiter', tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 ring-amber-500/25' },
    reviewed:  { label: 'Examinés',  tone: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 ring-blue-500/25' },
    resolved:  { label: 'Résolus',   tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/25' },
    dismissed: { label: 'Rejetés',   tone: 'text-muted-foreground bg-muted/50 ring-border' },
  };

  return (
    <div className="space-y-5 tabular-nums">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center shadow-sm ring-1 ring-destructive/25">
            <Shield className="h-5 w-5 text-destructive-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Signalements</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.length.toLocaleString()} signalement{data.length !== 1 ? 's' : ''} au total ·
              <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">{statusCounts.pending} à traiter</span>
            </p>
          </div>
        </div>
        {statusCounts.pending > 0 && (
          <Badge className="text-[10px] h-5 px-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25 border-0">
            Action requise
          </Badge>
        )}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-2 flex flex-wrap items-center gap-1.5">
        {(['all', 'pending', 'reviewed', 'resolved', 'dismissed'] as const).map((s) => {
          const cfg = tabConfig[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                active
                  ? cn(cfg.tone, 'ring-1')
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {cfg.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-md font-semibold',
                active ? 'bg-background/60' : 'bg-muted text-muted-foreground'
              )}>
                {statusCounts[s].toLocaleString()}
              </span>
            </button>
          );
        })}
        {contentTypes.length > 1 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="ml-auto px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted transition-colors"
          >
            <option value="all">Tous les types</option>
            {contentTypes.map((t: string) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? <SkeletonRow count={4} /> : filteredData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-14 text-center">
          <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">
            {data.length === 0 ? '🎉 Aucun signalement' : 'Aucun signalement pour ce filtre'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.length === 0 ? 'La plateforme est saine.' : 'Essayez un autre statut.'}
          </p>
          {data.length > 0 && statusFilter !== 'all' && (
            <Button variant="outline" size="sm" className="mt-4 text-xs" onClick={() => setStatusFilter('all')}>
              Voir tous
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredData.map((r: any) => {
            const isExpanded = expandedId === r.id;
            return (
              <div
                key={r.id}
                className={cn(
                  'rounded-2xl border bg-card transition-all',
                  r.status === 'pending' ? 'border-amber-500/30 shadow-[0_0_0_1px_rgba(245,158,11,0.06)]' : 'border-border/60',
                  isExpanded && 'ring-1 ring-primary/20 shadow-sm'
                )}
              >
                {/* Main row — clickable to expand */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.reporter?.avatar_url ? (
                      <img src={r.reporter.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.reporter?.display_name || r.reporter_user_id?.slice(0, 8)}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.reporter?._email || r.reporter_user_id?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] capitalize">{r.content_type}</Badge>
                    <Badge className={cn('text-[10px] border', statusColors[r.status] || statusColors.pending)}>
                      {statusIcons[r.status] || ''} {r.status}
                    </Badge>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                    {/* Reported content */}
                    {r.product && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        {r.product.cover_image_url ? (
                          <img src={r.product.cover_image_url} alt="" className="h-14 w-11 rounded object-cover shrink-0" />
                        ) : (
                          <div className="h-14 w-11 rounded bg-muted flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">{r.product.title}</p>
                          <p className="text-[11px] text-muted-foreground">{r.product.organizations?.name || '—'}</p>
                          {r.product.price != null && (
                            <p className="text-xs font-medium mt-0.5">{r.product.price?.toLocaleString()} {r.product.currency || 'XOF'}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reason */}
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <p className="text-xs font-medium text-destructive mb-1">Motif du signalement</p>
                      <p className="text-sm">{r.reason}</p>
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-muted-foreground mb-0.5">ID Signalement</p>
                        <p className="font-mono text-[11px] truncate">{r.id?.slice(0, 12)}...</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-muted-foreground mb-0.5">ID Contenu</p>
                        <p className="font-mono text-[11px] truncate">{r.content_id?.slice(0, 12)}...</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-muted-foreground mb-0.5">ID Rapporteur</p>
                        <p className="font-mono text-[11px] truncate">{r.reporter_user_id?.slice(0, 12)}...</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-muted-foreground mb-0.5">Date</p>
                        <p className="font-medium">{r.created_at ? new Date(r.created_at).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-2">
                        {(r.status === 'pending' || r.status === 'reviewed') && (
                          <>
                            {r.status === 'pending' && (
                              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => updateStatus(r.id, 'reviewed')}>
                                🔍 Examiner
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => updateStatus(r.id, 'resolved')}>
                              ✅ Résolu
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => updateStatus(r.id, 'dismissed')}>
                              Rejeter
                            </Button>
                          </>
                        )}
                      </div>
                      {r.status === 'dismissed' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs gap-1.5"
                          onClick={async () => {
                            if ((await askConfirm('Supprimer définitivement ce signalement ?'))) {
                              deleteReport(r.id);
                            }
                          }}
                        >
                          🗑 Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SuperadminMetrics() {
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['sa-platform-metrics-full'],
    queryFn: async () => {
      const { data } = await db.from('platform_metrics_daily').select('*')
        .order('metric_date', { ascending: false }).limit(60);
      return (data || []).reverse();
    },
  });

  // Use RPC for accurate 30-day totals (not limited by daily metrics table)
  const { data: rpcStats } = useQuery({
    queryKey: ['sa-metrics-rpc-totals'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      const [txRes, totalsRes] = await Promise.all([
        db.rpc('get_transaction_stats', { _from: thirtyDaysAgo.toISOString(), _to: now.toISOString() }),
        db.rpc('get_platform_totals'),
      ]);
      return {
        gmv30: (txRes.data as any)?.gmv || 0,
        fees30: (txRes.data as any)?.platform_fees || 0,
        tx30: (txRes.data as any)?.total_count || 0,
        activeOrgs: (totalsRes.data as any)?.active_orgs || 0,
        newUsers7d: (totalsRes.data as any)?.new_users_7d || 0,
      };
    },
  });

  const totalGMV = rpcStats?.gmv30 || 0;
  const totalFees = rpcStats?.fees30 || 0;
  const totalTx = rpcStats?.tx30 || 0;
  const activeOrgs = rpcStats?.activeOrgs || 0;
  const newUsers30d = rpcStats?.newUsers7d || 0;
  const takeRate = totalGMV > 0 ? ((totalFees / totalGMV) * 100).toFixed(1) : '0';

  const summaryCards = [
    { label: 'GMV 30j (XOF)', value: totalGMV.toLocaleString() },
    { label: 'Platform Fees 30j', value: totalFees.toLocaleString() },
    { label: 'Take Rate', value: `${takeRate}%` },
    { label: 'Transactions 30j', value: totalTx.toLocaleString() },
    { label: 'Orgs actives', value: activeOrgs },
    { label: 'Nouveaux users 30j', value: newUsers30d },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">📈 Platform Metrics (VC-Ready)</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {summaryCards.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {metrics.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">Évolution GMV & Fees</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="gmvG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="metric_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvG)" strokeWidth={2} name="GMV" />
              <Line type="monotone" dataKey="platform_fees" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={false} name="Fees" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && metrics.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Aucune donnée métrique encore.</p>
          <p className="text-xs text-muted-foreground">Configurez le cron job <code>aggregate-metrics</code> pour alimenter cette vue.</p>
        </div>
      )}
    </div>
  );
}
