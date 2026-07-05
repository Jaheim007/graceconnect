import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle2, Clock, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const STATUS_INFO: Record<string, { label: string; color: string; icon: any }> = {
  ok: { label: 'Compte en règle', color: 'text-green-500', icon: CheckCircle2 },
  warned: { label: 'Avertissement actif', color: 'text-yellow-500', icon: AlertTriangle },
  chat_frozen: { label: 'Chat temporairement bloqué', color: 'text-orange-500', icon: AlertTriangle },
  limited: { label: 'Compte limité', color: 'text-orange-500', icon: AlertTriangle },
  hidden: { label: 'Profil masqué des recherches', color: 'text-orange-500', icon: AlertTriangle },
  suspended: { label: 'Compte suspendu', color: 'text-red-500', icon: AlertTriangle },
  banned: { label: 'Compte banni', color: 'text-red-500', icon: AlertTriangle },
};

export default function AccountTrustPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['my-trust-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('account_trust_profiles')
        .select('*').eq('user_id', user.id).maybeSingle();
      return data || { status: 'ok', trust_score: 100, violations_total: 0 };
    },
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ['my-trust-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('trust_notifications_log')
        .select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
      return data || [];
    },
    enabled: !!user,
  });

  if (!user) {
    return <div className="p-6 text-center text-muted-foreground">Connectez-vous pour voir votre statut.</div>;
  }

  const status = profile?.status || 'ok';
  const info = STATUS_INFO[status] || STATUS_INFO.ok;
  const Icon = info.icon;
  const score = profile?.trust_score ?? 100;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Mon statut de compte</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${info.color}`} />
            <span className={info.color}>{info.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Score de confiance</span>
              <span className="font-bold">{score} / 100</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          {profile?.restricted_until && new Date(profile.restricted_until) > new Date() && (
            <div className="flex items-center gap-2 text-sm p-3 rounded bg-orange-500/10 text-orange-500">
              <Clock className="h-4 w-4" />
              Restriction active jusqu'à {new Date(profile.restricted_until).toLocaleString('fr-FR')}
            </div>
          )}
          {profile?.hidden_until && new Date(profile.hidden_until) > new Date() && (
            <div className="flex items-center gap-2 text-sm p-3 rounded bg-orange-500/10 text-orange-500">
              <Clock className="h-4 w-4" />
              Profil masqué des recherches jusqu'à {new Date(profile.hidden_until).toLocaleString('fr-FR')}
            </div>
          )}
          {profile?.suspended_until && new Date(profile.suspended_until) > new Date() && (
            <div className="flex items-center gap-2 text-sm p-3 rounded bg-red-500/10 text-red-500">
              <Clock className="h-4 w-4" />
              Compte suspendu jusqu'à {new Date(profile.suspended_until).toLocaleString('fr-FR')}
            </div>
          )}
          {profile?.payout_hold && (
            <div className="text-sm p-3 rounded bg-red-500/10 text-red-500">
              💰 Vos paiements sont temporairement retenus pour vérification.
            </div>
          )}

          {status !== 'ok' && (
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href="mailto:support@siteviral.com?subject=Contestation statut compte">
                <Mail className="h-4 w-4 mr-2" /> Contacter le support si vous pensez qu'il s'agit d'une erreur
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!notifications || notifications.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune notification. Votre compte est en règle ✨
            </p>
          )}
          {notifications?.map((n: any) => (
            <div key={n.id} className="p-3 rounded border border-border text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">{n.notification_type}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(n.created_at), { locale: fr, addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{n.message}</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                {n.channel === 'email' ? <Mail className="h-3 w-3" /> : <span>📱</span>}
                <span>{n.channel}</span>
                {n.delivery_status === 'sent' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        <Link to="/acceptable-use" className="underline">Règles d'utilisation SiteViral</Link>
      </p>
    </div>
  );
}
