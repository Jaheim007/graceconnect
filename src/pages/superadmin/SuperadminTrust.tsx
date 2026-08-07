import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { AlertTriangle, Shield, User, Mail, CheckCircle2, XCircle, Ban, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SEVERITY_COLOR: Record<string, string> = {
  soft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  hard: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  severe: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const ADMIN_ACTIONS = [
  { key: 'warning', label: 'Avertir', variant: 'outline' as const },
  { key: 'chat_frozen', label: 'Geler chat', variant: 'outline' as const },
  { key: 'chat_unfrozen', label: 'Débloquer chat', variant: 'outline' as const },
  { key: 'provider_hidden', label: 'Masquer profil', variant: 'outline' as const },
  { key: 'provider_unhidden', label: 'Réafficher profil', variant: 'outline' as const },
  { key: 'account_limited', label: 'Limiter compte', variant: 'outline' as const },
  { key: 'suspended_24h', label: 'Suspendre 24h', variant: 'secondary' as const },
  { key: 'suspended_7d', label: 'Suspendre 7j', variant: 'secondary' as const },
  { key: 'suspended_30d', label: 'Suspendre 30j', variant: 'secondary' as const },
  { key: 'banned', label: 'Bannir', variant: 'destructive' as const },
  { key: 'restored', label: 'Restaurer', variant: 'default' as const },
  { key: 'payout_held', label: 'Retenir paiement', variant: 'outline' as const },
  { key: 'payout_released', label: 'Libérer paiement', variant: 'outline' as const },
  { key: 'false_positive', label: 'Faux positif', variant: 'ghost' as const },
];

export default function SuperadminTrust() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [selected, setSelected] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: violations, isLoading } = useQuery({
    queryKey: ['sa-violations', tab],
    queryFn: async () => {
      const q = supabase.from('beauty_chat_violations').select('*')
        .order('created_at', { ascending: false }).limit(200);
      if (tab === 'pending') q.eq('admin_review_required', true);
      const { data } = await q;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: notifLog } = useQuery({
    queryKey: ['sa-violation-notifs', selected],
    queryFn: async () => {
      if (!selected) return [];
      const { data } = await supabase.from('trust_notifications_log')
        .select('*').eq('violation_id', selected).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selected,
  });

  const selectedViolation = violations?.find(v => v.id === selected);

  const { data: trustProfile } = useQuery({
    queryKey: ['sa-trust-profile', selectedViolation?.sender_id],
    queryFn: async () => {
      if (!selectedViolation?.sender_id) return null;
      const { data } = await supabase.from('account_trust_profiles')
        .select('*').eq('user_id', selectedViolation.sender_id).maybeSingle();
      return data;
    },
    enabled: !!selectedViolation?.sender_id,
  });

  const runAction = async (action: string) => {
    if (!selectedViolation) return;
    const { data, error } = await supabase.functions.invoke('trust-admin-action', {
      body: { violation_id: selectedViolation.id, target_user_id: selectedViolation.sender_id, action },
    });
    if (error || (data as any)?.error) {
      toast.error('Action échouée: ' + (error?.message || (data as any)?.error));
    } else {
      toast.success('Action appliquée + utilisateur notifié');
      qc.invalidateQueries({ queryKey: ['sa-violations'] });
      qc.invalidateQueries({ queryKey: ['sa-trust-profile'] });
      qc.invalidateQueries({ queryKey: ['sa-violation-notifs'] });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Trust & Violations</h1>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">
            À examiner {violations && tab === 'pending' && `(${violations.length})`}
          </TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid md:grid-cols-2 gap-4">
        {/* List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Violations récentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[70vh]">
              {isLoading && <p className="p-4 text-sm text-muted-foreground">Chargement…</p>}
              {violations?.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">Rien à examiner</p>
              )}
              {violations?.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors ${
                    selected === v.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {v.severity && (
                      <Badge variant="outline" className={SEVERITY_COLOR[v.severity]}>
                        {v.severity}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">{v.reason}</Badge>
                    {v.admin_review_required && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" /> Review
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.original_body?.slice(0, 80)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(v.created_at), { locale: fr, addSuffix: true })}
                    {v.action_taken && ` • ${v.action_taken}`}
                  </p>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail */}
        <div className="space-y-4">
          {!selectedViolation && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Sélectionnez une violation
              </CardContent>
            </Card>
          )}

          {selectedViolation && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> Utilisateur & score
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="font-mono text-xs">{selectedViolation.sender_id}</div>
                  {trustProfile && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-muted-foreground">Score</div><div className="font-bold text-lg">{trustProfile.trust_score}</div></div>
                      <div><div className="text-muted-foreground">Statut</div><Badge>{trustProfile.status}</Badge></div>
                      <div><div className="text-muted-foreground">Violations</div><div className="font-bold">{trustProfile.violations_total}</div></div>
                      {trustProfile.restricted_until && (<div className="col-span-3 text-orange-500 flex items-center gap-1"><Clock className="h-3 w-3" />Restreint jusqu'au {new Date(trustProfile.restricted_until).toLocaleString('fr-FR')}</div>)}
                      {trustProfile.hidden_until && (<div className="col-span-3 text-orange-500">Masqué jusqu'au {new Date(trustProfile.hidden_until).toLocaleString('fr-FR')}</div>)}
                      {trustProfile.suspended_until && (<div className="col-span-3 text-red-500">Suspendu jusqu'au {new Date(trustProfile.suspended_until).toLocaleString('fr-FR')}</div>)}
                      {trustProfile.payout_hold && (<div className="col-span-3 text-red-500">💰 Paiements retenus</div>)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Message bloqué</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="p-3 rounded bg-muted font-mono text-xs whitespace-pre-wrap">
                    {selectedViolation.original_body}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pattern: <code>{selectedViolation.matched}</code>
                  </div>
                </CardContent>
              </Card>

              {selectedViolation.ai_admin_summary && (
                <Card className="border-primary/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      🤖 Analyse Gemini
                      {selectedViolation.severity && (
                        <Badge variant="outline" className={SEVERITY_COLOR[selectedViolation.severity]}>
                          {selectedViolation.severity}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div><span className="text-muted-foreground">Catégorie:</span> {selectedViolation.ai_category}</div>
                    <div><span className="text-muted-foreground">Confiance:</span> {Math.round((selectedViolation.ai_confidence || 0) * 100)}%</div>
                    <div><span className="text-muted-foreground">Recommandé:</span> <Badge variant="secondary">{selectedViolation.ai_recommended_action}</Badge></div>
                    <div><span className="text-muted-foreground">Appliqué:</span> <Badge>{selectedViolation.action_taken || '—'}</Badge></div>
                    <div className="text-xs italic mt-2">"{selectedViolation.ai_admin_summary}"</div>
                    <div className="text-xs mt-2 p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Message envoyé à l'utilisateur:</span><br/>
                      {selectedViolation.ai_user_message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Score: {selectedViolation.score_before} → {selectedViolation.score_after}
                    </div>
                  </CardContent>
                </Card>
              )}

              {notifLog && notifLog.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Notifications envoyées</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1">
                    {notifLog.map((n: any) => (
                      <div key={n.id} className="flex items-center gap-2">
                        {n.channel === 'email' ? <Mail className="h-3 w-3" /> : <span>📱</span>}
                        <span className="flex-1">{n.notification_type}</span>
                        {n.delivery_status === 'sent' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : n.delivery_status === 'failed' ? (
                          <XCircle className="h-3 w-3 text-red-500" />
                        ) : <Clock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Actions admin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {ADMIN_ACTIONS.map(a => (
                      <Button
                        key={a.key}
                        size="sm"
                        variant={a.variant}
                        onClick={() => runAction(a.key)}
                      >
                        {a.key === 'banned' && <Ban className="h-3 w-3 mr-1" />}
                        {a.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-3">
                    Chaque action déclenche automatiquement une notification in-app + email à l'utilisateur.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
