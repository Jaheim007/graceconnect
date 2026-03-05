import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle, Download, BookOpen, ArrowRight, ShieldCheck,
  Store, User, Package, CreditCard, Calendar, Hash, Loader2, AlertCircle,
  PartyPopper, Share2, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { fetchWatermarkedFile, isPdfLikeFile, openFileInline, triggerBrowserDownload } from '@/lib/secureDownload';
import { verifyStripePayment } from '@/lib/api';

interface TransactionDetails {
  type: 'product' | 'donation';
  reference: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  product_title?: string;
  product_type?: string;
  product_id?: string;
  file_url?: string | null;
  external_link?: string | null;
  cover_image_url?: string | null;
  org_name: string;
  org_logo?: string | null;
  leader_name?: string | null;
  leader_title?: string | null;
  campaign_title?: string;
}

/** Small helper: wait ms */
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const rawReference = searchParams.get('reference') || searchParams.get('trxref') || '';
  const gateway = searchParams.get('gateway') || 'paystack';
  const sessionId = searchParams.get('session_id') || '';
  const urlType = searchParams.get('type') as 'donation' | 'product' | null;
  const urlOrgId = searchParams.get('organization_id') || '';
  const urlCampaignId = searchParams.get('campaign_id') || '';
  const urlProductId = searchParams.get('product_id') || '';

  const [tx, setTx] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Mutable reference that can be updated by stripe-verify
  const referenceRef = useRef(rawReference);
  const reference = rawReference;

  // Use refs to avoid stale closure issues in the polling loop
  const abortRef = useRef(false);
  const MAX_RETRIES = 8;

  /** Try to find the transaction in the DB by reference or user_id. */
  const lookupTransaction = useCallback(async (ref?: string): Promise<TransactionDetails | null> => {
    const searchRef = ref || referenceRef.current;
    
    // Strategy 1: Lookup by reference
    if (searchRef) {
      const { data: purchase } = await db
        .from('product_purchases')
        .select('*, digital_products(id, title, product_type, file_url, external_link, cover_image_url, organization_id, organizations(name, logo_url, leader_name, leader_title))')
        .eq('paystack_reference', searchRef)
        .limit(1)
        .maybeSingle();

      if (purchase) {
        const product = purchase.digital_products;
        const org = product?.organizations;
        return {
          type: 'product',
          reference: purchase.paystack_reference,
          amount: purchase.amount,
          currency: purchase.currency || 'XOF',
          status: purchase.status,
          created_at: purchase.completed_at || purchase.created_at,
          product_title: product?.title,
          product_type: product?.product_type,
          product_id: product?.id,
          file_url: product?.file_url,
          external_link: product?.external_link,
          cover_image_url: product?.cover_image_url,
          org_name: org?.name || 'Organisation',
          org_logo: org?.logo_url,
          leader_name: org?.leader_name,
          leader_title: org?.leader_title,
        };
      }

      const { data: donation } = await db
        .from('donations')
        .select('*, donation_campaigns(title), organizations(name, logo_url, leader_name, leader_title)')
        .eq('paystack_reference', searchRef)
        .limit(1)
        .maybeSingle();

      if (donation) {
        const org = donation.organizations;
        return {
          type: 'donation',
          reference: donation.paystack_reference,
          amount: donation.amount,
          currency: donation.currency || 'XOF',
          status: donation.status,
          created_at: donation.completed_at || donation.created_at,
          campaign_title: donation.donation_campaigns?.title,
          org_name: org?.name || 'Organisation',
          org_logo: org?.logo_url,
          leader_name: org?.leader_name,
          leader_title: org?.leader_title,
        };
      }
    }

    // Strategy 2: Fallback — lookup most recent completed purchase by user (last 5 min)
    if (user?.id) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentPurchase } = await db
        .from('product_purchases')
        .select('*, digital_products(id, title, product_type, file_url, external_link, cover_image_url, organization_id, organizations(name, logo_url, leader_name, leader_title))')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', fiveMinAgo)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentPurchase) {
        const product = recentPurchase.digital_products;
        const org = product?.organizations;
        referenceRef.current = recentPurchase.paystack_reference;
        return {
          type: 'product',
          reference: recentPurchase.paystack_reference,
          amount: recentPurchase.amount,
          currency: recentPurchase.currency || 'XOF',
          status: recentPurchase.status,
          created_at: recentPurchase.completed_at || recentPurchase.created_at,
          product_title: product?.title,
          product_type: product?.product_type,
          product_id: product?.id,
          file_url: product?.file_url,
          external_link: product?.external_link,
          cover_image_url: product?.cover_image_url,
          org_name: org?.name || 'Organisation',
          org_logo: org?.logo_url,
          leader_name: org?.leader_name,
          leader_title: org?.leader_title,
        };
      }

      const { data: recentDonation } = await db
        .from('donations')
        .select('*, donation_campaigns(title), organizations(name, logo_url, leader_name, leader_title)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', fiveMinAgo)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentDonation) {
        const org = recentDonation.organizations;
        referenceRef.current = recentDonation.paystack_reference;
        return {
          type: 'donation',
          reference: recentDonation.paystack_reference,
          amount: recentDonation.amount,
          currency: recentDonation.currency || 'XOF',
          status: recentDonation.status,
          created_at: recentDonation.completed_at || recentDonation.created_at,
          campaign_title: recentDonation.donation_campaigns?.title,
          org_name: org?.name || 'Organisation',
          org_logo: org?.logo_url,
          leader_name: org?.leader_name,
          leader_title: org?.leader_title,
        };
      }
    }

    return null;
  }, [reference, user?.id]);

  useEffect(() => {
    // Allow proceeding with session_id alone for Stripe
    if (!reference && !sessionId) {
      setError('Aucune référence de transaction trouvée.');
      setLoading(false);
      return;
    }
    abortRef.current = false;
    runVerificationLoop();
    return () => { abortRef.current = true; };
  }, [reference]);

  /**
   * Main verification loop — runs sequentially with proper retry logic.
   * 1. Check DB
   * 2. If not found & Stripe: call stripe-verify (which creates the record)
   * 3. If not found & Paystack: call verify-payment (which creates the record)
   * 4. Poll DB with increasing delays
   */
  async function runVerificationLoop() {
    let attempt = 0;
    let verifierCalled = false;

    while (attempt <= MAX_RETRIES && !abortRef.current) {
      setRetryCount(attempt);

      try {
        // ── Step A: Look up in DB ──
        const found = await lookupTransaction();
        if (found) {
          // Invalidate purchases cache so /resources shows the new item immediately
          await queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
          setTx(found);
          setLoading(false);
          return;
        }

        // ── Step B: Call the appropriate verifier (only once) ──
        if (!verifierCalled) {
          verifierCalled = true;

          if ((gateway === 'stripe' || sessionId) && sessionId) {
            try {
              const result = await verifyStripePayment(referenceRef.current || '', sessionId);
              // Update reference if resolved from Stripe
              if (result?.reference && !referenceRef.current) {
                referenceRef.current = result.reference;
              }
              if (result?.ok) {
                await wait(1500);
                const found2 = await lookupTransaction(referenceRef.current);
                if (found2) {
                  await queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
                  setTx(found2);
                  setLoading(false);
                  return;
                }
              }
            } catch (verifyErr) {
              console.error('[PaymentSuccess] stripe-verify error:', verifyErr);
            }
          } else if (referenceRef.current.startsWith('SV-')) {
            try {
              const { verifyPayment } = await import('@/lib/api');
              const result = await verifyPayment({
                reference: referenceRef.current,
                type: urlType || undefined,
                organization_id: urlOrgId || undefined,
                campaign_id: urlCampaignId || undefined,
                product_id: urlProductId || undefined,
              });
              if (result?.ok) {
                await wait(1500);
                const found2 = await lookupTransaction();
                if (found2) {
                  await queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
                  setTx(found2);
                  setLoading(false);
                  return;
                }
              }
            } catch (verifyErr) {
              console.error('[PaymentSuccess] paystack verify fallback error:', verifyErr);
            }
          }
        }

        // ── Step C: Wait before next poll ──
        attempt++;
        if (attempt <= MAX_RETRIES) {
          const delay = Math.min(2000 * attempt, 8000); // 2s, 4s, 6s, 8s, 8s, 8s
          await wait(delay);
        }
      } catch (err) {
        console.error('[PaymentSuccess] poll error:', err);
        attempt++;
        if (attempt <= MAX_RETRIES) {
          await wait(3000);
        }
      }
    }

    // All retries exhausted
    if (!abortRef.current) {
      setError(
        'Votre paiement a bien été traité. La confirmation peut prendre quelques instants. ' +
        'Vous pouvez vérifier dans "Mes Ressources" ou rafraîchir cette page.'
      );
      setLoading(false);
    }
  }
  const fmt = (n: number, cur: string) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ` ${cur}`;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const [downloading, setDownloading] = useState(false);
  const [reading, setReading] = useState(false);

  const handleDownload = async () => {
    if (!tx?.product_id || !tx?.file_url) return;
    setDownloading(true);
    try {
      const file = await fetchWatermarkedFile({
        fileUrl: tx.file_url,
        productId: tx.product_id,
        productTitle: tx.product_title || 'Document',
      });
      triggerBrowserDownload(file);
    } catch (err) {
      console.error('[PaymentSuccess] download error:', err);
      alert('Erreur lors du téléchargement sécurisé. Veuillez réessayer depuis "Mes Ressources".');
    } finally {
      setDownloading(false);
    }
  };

  const handleRead = async () => {
    if (!tx?.product_id || !tx?.file_url) return;
    setReading(true);
    try {
      const file = await fetchWatermarkedFile({
        fileUrl: tx.file_url,
        productId: tx.product_id,
        productTitle: tx.product_title || 'Document',
        inline: true,
      });
      openFileInline(file);
    } catch (err) {
      console.error('[PaymentSuccess] read error:', err);
      alert('Erreur lors de l\'ouverture. La lecture directe est disponible uniquement pour les PDF.');
    } finally {
      setReading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {retryCount > 0 ? `Vérification du paiement… (tentative ${retryCount}/${MAX_RETRIES})` : 'Chargement des détails…'}
          </p>
          <p className="text-xs text-muted-foreground">Ne fermez pas cette page.</p>
        </div>
      </div>
    );
  }

  // Error state — friendlier messaging (payment may have succeeded)
  if (error || !tx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="relative inline-flex mb-2">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">Paiement en cours de traitement</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-xs text-muted-foreground">Référence : {reference}</p>
          <div className="flex flex-col gap-2 items-center">
            <Button onClick={() => { setLoading(true); setError(''); abortRef.current = false; runVerificationLoop(); }} variant="outline" className="gap-2">
              <Loader2 className="h-4 w-4" /> Vérifier à nouveau
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Accueil</Button>
              {user && <Button size="sm" onClick={() => navigate('/resources')}>Mes achats</Button>}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isProduct = tx.type === 'product';
  const isBook = isPdfLikeFile(tx.file_url, tx.product_type);
  const isCompleted = tx.status === 'completed';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEOHead title="Paiement réussi — Siteviral" noindex />

      {/* Confetti burst */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {Array.from({ length: 50 }).map((_, i) => {
          const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFA07A', '#DDA0DD', '#FFD700', '#87CEEB'];
          const color = colors[i % colors.length];
          const size = 6 + Math.random() * 8;
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: -10,
                width: size,
                height: size,
                backgroundColor: color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: [0, 400 + Math.random() * 300],
                x: [0, (Math.random() - 0.5) * 150],
                opacity: [1, 1, 0],
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 2.5 + Math.random(),
                delay: i * 0.04,
                ease: 'easeOut',
              }}
            />
          );
        })}
      </div>

      {/* Watermark Background */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden opacity-[0.03]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute text-foreground font-bold whitespace-nowrap"
            style={{
              fontSize: '2.5rem',
              transform: 'rotate(-30deg)',
              top: `${15 + i * 18}%`,
              left: '-5%',
              width: '120%',
              letterSpacing: '0.1em',
            }}
          >
            {tx.leader_name || tx.org_name} • {tx.product_title || tx.campaign_title || 'Siteviral'} • {tx.org_name}
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 sm:py-16">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-8"
        >
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isProduct ? '🎉 Achat confirmé !' : '🙏 Don confirmé !'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isProduct
              ? 'Votre produit numérique est prêt.'
              : 'Merci pour votre générosité !'}
          </p>
        </motion.div>

        {/* Transaction Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
        >
          {/* Organization header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex items-center gap-3">
            {tx.org_logo ? (
              <img src={tx.org_logo} alt={tx.org_name} className="w-12 h-12 rounded-xl object-cover border border-border" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{tx.org_name}</p>
              {tx.leader_name && (
                <p className="text-xs text-muted-foreground truncate">
                  {tx.leader_title ? `${tx.leader_title} — ` : ''}{tx.leader_name}
                </p>
              )}
            </div>
            <Badge
              variant={isCompleted ? 'default' : 'secondary'}
              className={`ml-auto shrink-0 text-[10px] ${isCompleted ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}`}
            >
              {isCompleted ? 'Confirmé' : 'En cours'}
            </Badge>
          </div>

          {/* Product/Campaign Image */}
          {isProduct && tx.cover_image_url && (
            <div className="px-4 pt-4">
              <img
                src={tx.cover_image_url}
                alt={tx.product_title}
                className="w-full h-40 object-cover rounded-xl"
              />
            </div>
          )}

          {/* Details */}
          <div className="p-4 space-y-3">
            {/* Product/Campaign Title */}
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {isProduct ? 'Produit numérique' : 'Campagne'}
                </p>
                <p className="font-semibold text-foreground">
                  {tx.product_title || tx.campaign_title || '—'}
                </p>
                {tx.product_type && (
                  <Badge variant="outline" className="text-[10px] mt-1 capitalize">{tx.product_type}</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Transaction details grid */}
            <div className="grid grid-cols-2 gap-3">
              <DetailRow icon={CreditCard} label="Montant" value={fmt(tx.amount, tx.currency)} highlight />
              <DetailRow icon={Hash} label="Référence" value={tx.reference.length > 18 ? tx.reference.slice(0, 18) + '…' : tx.reference} />
              <DetailRow icon={Calendar} label="Date" value={fmtDate(tx.created_at)} />
              <DetailRow icon={ShieldCheck} label="Sécurité" value={gateway === 'stripe' ? 'Stripe ✓' : 'Paystack ✓'} />
            </div>

            {/* Leader / Org Watermark Banner */}
            <div className="mt-3 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/10 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Acheté auprès de</p>
              <p className="font-bold text-foreground text-sm">{tx.leader_name || tx.org_name}</p>
              {tx.leader_name && tx.leader_title && (
                <p className="text-xs text-muted-foreground">{tx.leader_title}</p>
              )}
              <p className="text-xs text-primary font-medium mt-0.5">{tx.org_name}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {isProduct && isCompleted && (
            <div className="p-4 pt-0 space-y-2">
              <Separator className="mb-3" />
              {tx.file_url && (
                <>
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full gap-2 bg-primary text-primary-foreground"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {downloading ? 'Téléchargement…' : 'Télécharger'}
                  </Button>
                  {isBook && (
                    <Button
                      onClick={handleRead}
                      disabled={reading}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                      {reading ? 'Ouverture…' : 'Lire maintenant'}
                    </Button>
                  )}
                </>
              )}
              {tx.external_link && (
                <a href={tx.external_link} target="_blank" rel="noreferrer" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Accéder au contenu
                  </Button>
                </a>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="bg-muted/30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Paiement sécurisé — Siteviral
            </div>
            {user && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1 text-primary"
                onClick={() => navigate('/resources')}
              >
                Mes achats <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Bottom actions */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          {/* Share section */}
          {isCompleted && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-center">Partagez votre expérience 🔥</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    const text = isProduct
                      ? `Je viens d'acheter "${tx.product_title}" sur ${tx.org_name} via Siteviral ! 🎉`
                      : `Je viens de soutenir "${tx.campaign_title || tx.org_name}" via Siteviral ! 🙏`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\nhttps://siteviral.com`)}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
                >
                  <span className="text-lg">💬</span>
                  <span className="text-[10px] font-medium text-muted-foreground">WhatsApp</span>
                </button>
                <button
                  onClick={() => {
                    const text = isProduct
                      ? `Je viens d'acheter "${tx.product_title}" sur ${tx.org_name} ! 🎉`
                      : `Je viens de soutenir "${tx.campaign_title || tx.org_name}" ! 🙏`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-sky-500/5 hover:bg-sky-500/10 transition-colors"
                >
                  <span className="text-lg">𝕏</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Twitter</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Lien copié !');
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
                >
                  <span className="text-lg">🔗</span>
                  <span className="text-[10px] font-medium text-muted-foreground">Copier</span>
                </button>
              </div>
            </div>
          )}

          {/* Ambassador CTA */}
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-all"
              onClick={() => navigate('/discover')}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">💰 Gagnez en partageant</p>
                <p className="text-xs text-muted-foreground">Devenez ambassadeur et touchez des commissions sur chaque vente</p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
            </motion.div>
          )}

          {user && (
            <Button
              onClick={() => navigate('/resources')}
              variant="outline"
              className="w-full gap-2"
            >
              <Package className="h-4 w-4" />
              Accéder à mes achats
            </Button>
          )}
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Retour à l'accueil
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className={`text-sm truncate ${highlight ? 'font-bold text-primary' : 'text-foreground'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
