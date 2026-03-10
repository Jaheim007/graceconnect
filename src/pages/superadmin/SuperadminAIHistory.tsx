import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Brain, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function SuperadminAIHistory() {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'low'>('all');

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['sa-ai-history'],
    queryFn: async () => {
      const { data } = await db
        .from('kyc_submissions')
        .select('id, organization_id, ai_confidence_score, ai_ocr_data, ai_face_match, ai_fraud_detection, ai_summary, ai_recommendations, ai_analyzed_at, ai_quality_assessment, status, submitted_at, organizations!left(name, slug)')
        .not('ai_analyzed_at', 'is', null)
        .order('ai_analyzed_at', { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const filtered = analyses.filter((a: any) => {
    if (search) {
      const org = a.organizations as any;
      const name = org?.name?.toLowerCase() || '';
      const ocrName = a.ai_ocr_data?.full_name?.toLowerCase() || '';
      if (!name.includes(search.toLowerCase()) && !ocrName.includes(search.toLowerCase())) return false;
    }
    if (riskFilter === 'high') return (a.ai_confidence_score || 100) < 60;
    if (riskFilter === 'low') return (a.ai_confidence_score || 0) >= 80;
    return true;
  });

  const scoreColor = (score: number) =>
    score >= 80 ? 'bg-primary/10 text-primary' :
    score >= 50 ? 'bg-amber-500/10 text-amber-600' :
    'bg-destructive/10 text-destructive';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> Historique analyses IA
        </h1>
        <Badge variant="secondary" className="text-xs">{filtered.length} analyse(s)</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par org ou nom…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {([
            { key: 'all', label: '📋 Tous' },
            { key: 'high', label: '🔴 Risque élevé' },
            { key: 'low', label: '🟢 Score élevé' },
          ] as const).map(f => (
            <Button key={f.key} size="sm" variant={riskFilter === f.key ? 'default' : 'outline'} onClick={() => setRiskFilter(f.key)} className="text-xs h-8">
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? <SkeletonRow count={5} /> : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">Aucune analyse IA trouvée</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => {
            const org = a.organizations as any;
            const score = a.ai_confidence_score || 0;
            const fraud = a.ai_fraud_detection;
            const ocr = a.ai_ocr_data;
            const faceMatch = a.ai_face_match;

            return (
              <div key={a.id} className="p-4 rounded-2xl border border-border bg-card space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold">{org?.name || 'Organisation inconnue'}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Analysé le {new Date(a.ai_analyzed_at).toLocaleString('fr-FR')}
                      {' · '}Statut : {a.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor(score)}`}>
                      {score}%
                    </span>
                    {fraud?.risk_level && fraud.risk_level !== 'none' && (
                      <Badge variant="destructive" className="text-[10px]">
                        ⚠️ {fraud.risk_level}
                      </Badge>
                    )}
                  </div>
                </div>

                {a.ai_summary && (
                  <p className="text-[11px] text-muted-foreground">{a.ai_summary}</p>
                )}

                <div className="flex flex-wrap gap-3 text-[10px]">
                  {ocr?.full_name && (
                    <span className="px-2 py-0.5 rounded bg-muted">👤 {ocr.full_name}</span>
                  )}
                  {ocr?.document_number && (
                    <span className="px-2 py-0.5 rounded bg-muted">📄 {ocr.document_number}</span>
                  )}
                  {faceMatch?.id_vs_selfie && faceMatch.id_vs_selfie !== 'not_available' && (
                    <span className={`px-2 py-0.5 rounded ${
                      faceMatch.id_vs_selfie === 'match' ? 'bg-primary/10 text-primary' :
                      faceMatch.id_vs_selfie === 'likely_match' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {faceMatch.id_vs_selfie === 'match' ? '✅' : faceMatch.id_vs_selfie === 'likely_match' ? '🟡' : '⚠️'} Visage
                    </span>
                  )}
                  {fraud?.is_screenshot && <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">📱 Screenshot</span>}
                  {fraud?.is_photocopy && <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">📄 Photocopie</span>}
                  {fraud?.is_expired && <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">⏰ Expiré</span>}
                  {fraud?.tampering_detected && <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive">🔧 Falsification</span>}
                </div>

                {a.ai_recommendations?.length > 0 && (
                  <div className="text-[10px] text-muted-foreground">
                    {a.ai_recommendations.map((r: string, i: number) => (
                      <span key={i} className="inline-block mr-2">→ {r}</span>
                    ))}
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
