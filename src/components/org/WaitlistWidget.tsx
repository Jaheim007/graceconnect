import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Mail } from 'lucide-react';
import { useJoinWaitlist } from '@/hooks/useWaitlists';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';

interface WaitlistWidgetProps {
  waitlist: {
    id: string;
    title: string;
    description?: string;
    launch_date?: string;
    waitlist_entries?: { count: number }[];
  };
}

export function WaitlistWidget({ waitlist }: WaitlistWidgetProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const join = useJoinWaitlist();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const count = waitlist.waitlist_entries?.[0]?.count || 0;

  const handleJoin = async () => {
    if (!email.trim()) return;
    try {
      await join.mutateAsync({ waitlist_id: waitlist.id, email: email.trim(), name: name.trim() || undefined });
      setJoined(true);
      toast({ title: isFr ? '🎉 Inscrit à la waitlist !' : '🎉 Joined the waitlist!' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', description: isFr ? 'Impossible de rejoindre.' : 'Unable to join.', variant: 'destructive' });
    }
  };

  if (joined) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center space-y-2">
        <CheckCircle className="h-8 w-8 text-primary mx-auto" />
        <p className="font-semibold text-sm">{isFr ? 'Vous êtes sur la liste !' : "You're on the list!"}</p>
        <p className="text-xs text-muted-foreground">{isFr ? 'Nous vous enverrons un email dès le lancement.' : "We'll send you an email at launch."}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">{waitlist.title}</h3>
        {count > 0 && <Badge variant="secondary" className="text-[10px] ml-auto">{count} {isFr ? `inscrit${count > 1 ? 's' : ''}` : `member${count > 1 ? 's' : ''}`}</Badge>}
      </div>
      {waitlist.description && <p className="text-xs text-muted-foreground">{waitlist.description}</p>}
      {waitlist.launch_date && (
        <p className="text-xs text-muted-foreground">
          🚀 {isFr ? 'Lancement prévu :' : 'Expected launch:'} {new Date(waitlist.launch_date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
      <div className="flex gap-2">
        <Input placeholder={isFr ? 'Votre email' : 'Your email'} type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-9 text-sm flex-1" />
        <Input placeholder={isFr ? 'Nom (optionnel)' : 'Name (optional)'} value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm w-28" />
      </div>
      <Button className="w-full gap-1.5 bg-primary text-primary-foreground text-sm" onClick={handleJoin} disabled={!email.trim() || join.isPending}>
        <Mail className="h-3.5 w-3.5" /> {join.isPending ? (isFr ? 'Inscription...' : 'Joining...') : (isFr ? 'Rejoindre la waitlist' : 'Join the waitlist')}
      </Button>
    </div>
  );
}
