import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, CheckCircle, Circle, Copy, MessageCircle, Rocket, Award, Target, Users, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

export default function QuickStartPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [enrollingOrg, setEnrollingOrg] = useState<string | null>(null);

  // Top 3 products with highest commission
  const { data: topProducts = [], isLoading } = useQuery({
    queryKey: ['quick-start-products'],
    queryFn: async () => {
      const { data } = await db
        .from('digital_products')
        .select('id, title, cover_image_url, price, currency, sales_count, slug, organization_id, organizations(name, slug, logo_url, commission_rate, affiliation_enabled)')
        .eq('is_published', true)
        .gt('price', 0)
        .order('sales_count', { ascending: false })
        .limit(10);
      return (data || []).filter((p: any) => p.organizations?.affiliation_enabled).slice(0, 3);
    },
  });

  // User's affiliate links
  const { data: myLinks = [] } = useQuery({
    queryKey: ['user-affiliate-links', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('affiliate_links').select('organization_id, code, clicks, conversions').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async (orgId: string) => {
      if (!user) throw new Error('Non connecté');
      const { error } = await db.rpc('self_enroll_affiliate', { _org_id: orgId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: '🎉 Tu es ambassadeur !', description: 'Partage maintenant et gagne.' });
      qc.invalidateQueries({ queryKey: ['user-affiliate-links', user?.id] });
      setEnrollingOrg(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      setEnrollingOrg(null);
    },
  });

  const myLinkMap = new Map(myLinks.map((l: any) => [l.organization_id, l]));

  // Checklist
  const hasLink = myLinks.length > 0;
  const hasShared = sharedId !== null || myLinks.some((l: any) => (l.clicks || 0) > 0);
  const checklist = [
    { label: '1er lien généré', done: hasLink },
    { label: '1er partage effectué', done: hasShared },
    { label: 'Inviter 1 ami ambassadeur', done: false },
  ];
  const completedSteps = checklist.filter(s => s.done).length;

  const handleShare = async (orgSlug: string, code: string, title: string) => {
    const url = `${window.location.origin}/org/${orgSlug}?ref=${code}`;
    const text = `🔥 Découvre "${title}" sur Siteviral ! ${url}`;

    // Copy
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(code);
      setTimeout(() => setCopiedId(null), 3000);
    } catch {}

    // Open WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

    // Mark as shared
    setSharedId(code);
    toast({
      title: '✅ Lien prêt à être envoyé !',
      description: 'Ta 1ère vente peut tomber aujourd\'hui 🚀',
    });
  };

  const items = topProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    image: p.cover_image_url,
    price: p.price,
    currency: p.currency || 'XOF',
    orgId: p.organization_id,
    orgName: p.organizations?.name,
    orgSlug: p.organizations?.slug,
    commissionRate: p.organizations?.commission_rate || 10,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Démarrage Rapide — Gagner avec Siteviral" description="Commence à gagner des commissions en partageant." noindex />

      <div className="container max-w-lg px-4 py-6 sm:py-10 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
            <Rocket className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold mb-1">
            Ta mission : <span className="text-accent">1er partage</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Choisis un produit, partage sur WhatsApp, encaisse.
          </p>
        </motion.div>

        {/* Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" /> Progression
            </h2>
            <Badge variant="outline" className="text-xs">{completedSteps}/3</Badge>
          </div>
          <div className="space-y-2">
            {checklist.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                {step.done ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                )}
                <span className={cn('text-sm', step.done ? 'text-foreground font-medium line-through' : 'text-muted-foreground')}>
                  {step.label}
                </span>
                {step.done && i === 1 && (
                  <Badge className="text-[9px] bg-accent/10 text-accent border-accent/20 ml-auto">🏅 1er partage</Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(completedSteps / 3) * 100}%` }} />
          </div>
        </motion.div>

        {/* Motivational counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl p-3"
        >
          <Target className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-foreground">
            <strong>Objectif aujourd'hui :</strong> 10 partages = 1 vente probable 💪
          </p>
        </motion.div>

        {/* Products — MAX 3 */}
        <div className="space-y-3">
          <h2 className="font-bold text-sm">Partage maintenant 👇</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <p>Aucun produit disponible.</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate('/marketplace')}>Explorer la marketplace</Button>
            </div>
          ) : (
            items.map((item: any, i: number) => {
              const myLink = myLinkMap.get(item.orgId) as any;
              const estimatedGain = item.price ? Math.round((item.price * item.commissionRate) / 100) : 0;
              const isShared = sharedId === myLink?.code;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Share2 className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.orgName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatCurrency(item.price, item.currency)}</span>
                        <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-bold">{item.commissionRate}%</span>
                        {estimatedGain > 0 && (
                          <span className="text-xs font-bold text-accent">
                            → +{formatCurrency(estimatedGain, item.currency)}/vente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  {myLink ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-10 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground font-bold"
                          onClick={() => handleShare(item.orgSlug, myLink.code, item.title)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Partager WhatsApp
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 gap-1"
                          onClick={() => {
                            const url = `${window.location.origin}/org/${item.orgSlug}?ref=${myLink.code}`;
                            navigator.clipboard.writeText(url);
                            setCopiedId(myLink.code);
                            setTimeout(() => setCopiedId(null), 2000);
                            toast({ title: 'Lien copié !' });
                          }}
                        >
                          {copiedId === myLink.code ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Share confirmation */}
                      <AnimatePresence>
                        {isShared && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-2.5"
                          >
                            <PartyPopper className="h-4 w-4 text-green-500 shrink-0" />
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              ✅ Lien prêt ! Ta 1ère vente peut tomber aujourd'hui 🎉
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-10"
                      disabled={enrollingOrg === item.orgId}
                      onClick={() => {
                        setEnrollingOrg(item.orgId);
                        enrollMutation.mutate(item.orgId);
                      }}
                    >
                      {enrollingOrg === item.orgId ? 'Activation...' : 'Devenir ambassadeur → Partager'}
                    </Button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Invite friend */}
        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-2">
          <Users className="h-5 w-5 text-primary mx-auto" />
          <p className="text-sm font-bold">Invite un ami ambassadeur</p>
          <p className="text-xs text-muted-foreground">Plus vous partagez ensemble, plus vous gagnez.</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => {
              const url = `${window.location.origin}/auth?mode=signup&intent=ambassador`;
              navigator.clipboard.writeText(url);
              toast({ title: 'Lien d\'invitation copié !' });
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copier le lien d'invitation
          </Button>
        </div>
      </div>
    </div>
  );
}
