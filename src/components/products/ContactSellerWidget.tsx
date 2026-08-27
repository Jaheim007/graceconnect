import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Send, Clock } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nContext';
import { useNavigate } from '@/lib/router-compat';
import { cn } from '@/lib/utils';

interface ContactSellerWidgetProps {
  organizationId: string;
  orgName?: string;
  orgLogoUrl?: string | null;
  productId: string;
  productTitle: string;
}

const messageSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(5, 'Message trop court').max(2000),
});

export function ContactSellerWidget({
  organizationId, orgName, orgLogoUrl, productId, productTitle,
}: ContactSellerWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Fetch seller (org owner) profile for avatar + online status
  const { data: seller } = useQuery({
    queryKey: ['seller-profile', organizationId],
    enabled: !!organizationId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: member } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organizationId)
        .in('role', ['owner', 'admin'])
        .order('role', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!member?.user_id) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, updated_at')
        .eq('id', member.user_id)
        .maybeSingle();
      return profile;
    },
  });

  // Buyer's own profile (for "complete profile" prompt)
  const { data: myProfile } = useQuery({
    queryKey: ['my-profile-mini', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  const isOnline = useMemo(() => {
    if (!seller?.updated_at) return false;
    return Date.now() - new Date(seller.updated_at).getTime() < 5 * 60_000;
  }, [seller?.updated_at]);

  const sellerName = seller?.display_name || orgName || 'Seller';
  const sellerAvatar = seller?.avatar_url || orgLogoUrl || undefined;
  const initials = sellerName.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  const handleOpen = () => {
    if (!user) {
      navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // Prefill from user's profile
    setName(myProfile?.display_name || user.user_metadata?.full_name || '');
    setEmail(user.email || '');
    setMessage('');
    setOpen(true);
  };

  const profileIncomplete = !myProfile?.display_name;

  const handleSend = async () => {
    const parsed = messageSchema.safeParse({ name, email, message });
    if (!parsed.success) {
      toast({
        title: isFr ? 'Vérifiez le formulaire' : 'Check the form',
        description: parsed.error.issues[0]?.message,
        variant: 'destructive',
      });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('contacts').insert({
        organization_id: organizationId,
        email: parsed.data.email,
        name: parsed.data.name,
        source: 'product_inquiry',
        is_subscribed: false,
        metadata: {
          message: parsed.data.message,
          product_id: productId,
          product_title: productTitle,
          buyer_id: user?.id,
        },
      });
      if (error) throw error;
      toast({
        title: isFr ? 'Message envoyé' : 'Message sent',
        description: isFr
          ? `${sellerName} vous répondra bientôt.`
          : `${sellerName} will reply soon.`,
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: isFr ? "Échec de l'envoi" : 'Failed to send',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const suggestions = isFr
    ? [
        `👋 Bonjour ${sellerName}, pouvez-vous m'aider avec…`,
        `Serait-il possible d'avoir une offre personnalisée pour…`,
        `Pensez-vous pouvoir livrer d'ici…`,
      ]
    : [
        `👋 Hey ${sellerName}, can you help me with…`,
        `Would it be possible to get a custom offer for…`,
        `Do you think you can deliver an order by…`,
      ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl border border-border bg-card shadow-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-11 w-11">
              <AvatarImage src={sellerAvatar} alt={sellerName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40',
              )}
              aria-label={isOnline ? 'Online' : 'Offline'}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {isFr ? `Contacter ${sellerName}` : `Message ${sellerName}`}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isOnline ? (
                <>
                  <span className="text-emerald-600 font-medium">
                    {isFr ? 'En ligne' : 'Online'}
                  </span>
                  <span>·</span>
                </>
              ) : null}
              <Clock className="h-3 w-3" />
              {isFr ? 'Répond sous ~1 h' : 'Avg. response time: 1 hour'}
            </p>
          </div>
        </div>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2" onClick={handleOpen}>
            <MessageCircle className="h-4 w-4" />
            {isFr ? 'Contactez-moi' : 'Contact me'}
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={sellerAvatar} alt={sellerName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                  isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                )}
              />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isFr ? `Message à ${sellerName}` : `Message ${sellerName}`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isOnline
                  ? isFr ? 'En ligne · Répond sous ~1 h' : 'Online · Avg. response time: 1 hour'
                  : isFr ? 'Hors ligne · Répond généralement sous ~1 h' : 'Offline · Usually replies within 1 hour'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {profileIncomplete && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              {isFr ? 'Complétez votre profil' : 'Complete your profile'}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {isFr
                ? 'Un profil complet aide les vendeurs à mieux vous répondre.'
                : 'A complete profile helps sellers respond better.'}
            </p>
            <button
              className="mt-1.5 text-primary hover:underline font-medium"
              onClick={() => navigate('/settings/profile')}
            >
              {isFr ? 'Compléter →' : 'Complete →'}
            </button>
          </div>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">{isFr ? 'Votre nom' : 'Your name'}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMessage(s)}
                className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <div>
            <Textarea
              placeholder={isFr
                ? `Posez une question ou partagez les détails du projet (délais, budget, etc.) — à propos de « ${productTitle} »`
                : `Ask a question or share project details (timeline, budget, etc.) — about "${productTitle}"`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground text-right mt-1">
              {message.length}/2000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {isFr ? 'Annuler' : 'Cancel'}
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="h-4 w-4" />
            {sending ? (isFr ? 'Envoi...' : 'Sending...') : (isFr ? 'Envoyer le message' : 'Send message')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
