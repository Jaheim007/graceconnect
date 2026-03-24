import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, BookOpen, ArrowRight, ShieldCheck,
  Loader2, PartyPopper, Users, Check, Rocket, X,
  Package, Star,
} from 'lucide-react';
import { UpsellSection } from '@/components/payment/UpsellSection';
import { ContextualFeedback } from '@/components/feedback/ContextualFeedback';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { fetchWatermarkedFile, isPdfLikeFile, openFileInline, triggerBrowserDownload } from '@/lib/secureDownload';
import { verifyStripePayment } from '@/lib/api';
import { trackEvent } from '@/hooks/useClientAnalytics';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';

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
  organization_id?: string;
  file_url?: string | null;
  external_link?: string | null;
  cover_image_url?: string | null;
  org_name: string;
  org_slug?: string;
  org_logo?: string | null;
  leader_name?: string | null;
  leader_title?: string | null;
  campaign_title?: string;
  commission_rate?: number;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt: fmtCurrency } = useDisplayCurrency();

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

  // Ambassador state
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  const referenceRef = useRef(rawReference);
  const reference = rawReference;
  const abortRef = useRef(false);
  const MAX_RETRIES = 8;

  const [downloading, setDownloading] = useState(false);
  const [reading, setReading] = useState(false);

  const lookupTransaction = useCallback(async (ref?: string): Promise<TransactionDetails | null> => {
    const searchRef = ref || referenceRef.current;

    if (searchRef) {
      const { data: purchase } = await db
        .from('product_purchases')
        .select('*, digital_products(id, title, product_type, file_url, external_link, cover_image_url, organization_id, organizations(name, slug, logo_url, leader_name, leader_title))')
        .eq('paystack_reference', searchRef)
        .limit(1)
        .maybeSingle();

      if (purchase) {
        const product = purchase.digital_products;
        const org = product?.organizations;
        return {
          type: 'product', reference: purchase.paystack_reference, amount: purchase.amount,
          currency: purchase.currency || 'XOF', status: purchase.status,
          created_at: purchase.completed_at || purchase.created_at, product_title: product?.title,
          product_type: product?.product_type, product_id: product?.id,
          organization_id: product?.organization_id, file_url: product?.file_url,
          external_link: product?.external_link, cover_image_url: product?.cover_image_url,
          org_name: org?.name || (isFr ? 'Organisation' : 'Organization'), org_slug: org?.slug,
          org_logo: org?.logo_url, leader_name: org?.leader_name, leader_title: org?.leader_title,
          commission_rate: 10,
        };
      }

      const { data: donation } = await db
        .from('donations')
        .select('*, donation_campaigns(title), organizations(name, slug, logo_url, leader_name, leader_title)')
        .eq('paystack_reference', searchRef)
        .limit(1)
        .maybeSingle();

      if (donation) {
        const org = donation.organizations;
        return {
          type: 'donation', reference: donation.paystack_reference, amount: donation.amount,
          currency: donation.currency || 'XOF', status: donation.status,
          created_at: donation.completed_at || donation.created_at,
          campaign_title: donation.donation_campaigns?.title,
          org_name: org?.name || (isFr ? 'Organisation' : 'Organization'), org_slug: org?.slug,
          org_logo: org?.logo_url, leader_name: org?.leader_name, leader_title: org?.leader_title,
        };
      }
    }

    if (user?.id) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentPurchase } = await db
        .from('product_purchases')
        .select('*, digital_products(id, title, product_type, file_url, external_link, cover_image_url, organization_id, organizations(name, slug, logo_url, leader_name, leader_title))')
        .eq('user_id', user.id).eq('status', 'completed').gte('completed_at', fiveMinAgo)
        .order('completed_at', { ascending: false }).limit(1).maybeSingle();

      if (recentPurchase) {
        const product = recentPurchase.digital_products;
        const org = product?.organizations;
        referenceRef.current = recentPurchase.paystack_reference;
        return {
          type: 'product', reference: recentPurchase.paystack_reference, amount: recentPurchase.amount,
          currency: recentPurchase.currency || 'XOF', status: recentPurchase.status,
          created_at: recentPurchase.completed_at || recentPurchase.created_at, product_title: product?.title,
          product_type: product?.product_type, product_id: product?.id,
          file_url: product?.file_url, external_link: product?.external_link,
          cover_image_url: product?.cover_image_url, organization_id: product?.organization_id,
          org_name: org?.name || (isFr ? 'Organisation' : 'Organization'), org_slug: org?.slug,
          org_logo: org?.logo_url, leader_name: org?.leader_name, leader_title: org?.leader_title,
          commission_rate: 10,
        };
      }

      const { data: recentDonation } = await db
        .from('donations')
        .select('*, donation_campaigns(title), organizations(name, slug, logo_url, leader_name, leader_title)')
        .eq('user_id', user.id).eq('status', 'completed').gte('completed_at', fiveMinAgo)
        .order('completed_at', { ascending: false }).limit(1).maybeSingle();

      if (recentDonation) {
        const org = recentDonation.organizations;
        referenceRef.current = recentDonation.paystack_reference;
        return {
          type: 'donation', reference: recentDonation.paystack_reference, amount: recentDonation.amount,
          currency: recentDonation.currency || 'XOF', status: recentDonation.status,
          created_at: recentDonation.completed_at || recentDonation.created_at,
          campaign_title: recentDonation.donation_campaigns?.title,
          org_name: org?.name || (isFr ? 'Organisation' : 'Organization'), org_slug: org?.slug,
          org_logo: org?.logo_url, leader_name: org?.leader_name, leader_title: org?.leader_title,
        };
      }
    }

    return null;
  }, [reference, user?.id, isFr]);

  useEffect(() => {
    if (!reference && !sessionId) {
      setError(isFr ? 'Aucune référence de transaction trouvée.' : 'No transaction reference found.');
      setLoading(false);
      return;
    }
    abortRef.current = false;
    runVerificationLoop();
    return () => { abortRef.current = true; };
  }, [reference]);

  async function runVerificationLoop() {
    let attempt = 0;
    let verifierCalled = false;

    while (attempt <= MAX_RETRIES && !abortRef.current) {
      setRetryCount(attempt);
      try {
        const found = await lookupTransaction();
        if (found) {
          await queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
          try {
            const sessionSeed = sessionStorage.getItem('sv_exp_seed');
            if (sessionSeed) {
              trackEvent('experiment_conversion', { product_id: found.product_id, source: 'purchase' }, user?.id);
            }
          } catch {}
          setTx(found); setLoading(false); return;
        }

        if (!verifierCalled) {
          verifierCalled = true;
          if ((gateway === 'stripe' || sessionId) && sessionId) {
            try {
              const result = await verifyStripePayment(referenceRef.current || '', sessionId);
              if (result?.reference && !referenceRef.current) referenceRef.current = result.reference;
              if (result?.ok) {
                await wait(1500);
                const found2 = await lookupTransaction(referenceRef.current);
                if (found2) { await queryClient.invalidateQueries({ queryKey: ['my-purchases'] }); setTx(found2); setLoading(false); return; }
              }
            } catch (verifyErr) { console.error('[PaymentSuccess] stripe-verify error:', verifyErr); }
          } else if (referenceRef.current.startsWith('SV-')) {
            try {
              const { verifyPayment } = await import('@/lib/api');
              const result = await verifyPayment({ reference: referenceRef.current, type: urlType || undefined, organization_id: urlOrgId || undefined, campaign_id: urlCampaignId || undefined, product_id: urlProductId || undefined });
              if (result?.ok) {
                await wait(1500);
                const found2 = await lookupTransaction();
                if (found2) { await queryClient.invalidateQueries({ queryKey: ['my-purchases'] }); setTx(found2); setLoading(false); return; }
              }
            } catch (verifyErr) { console.error('[PaymentSuccess] paystack verify fallback error:', verifyErr); }
          }
        }

        attempt++;
        if (attempt <= MAX_RETRIES) { const delay = Math.min(2000 * attempt, 8000); await wait(delay); }
      } catch (err) {
        console.error('[PaymentSuccess] poll error:', err);
        attempt++;
        if (attempt <= MAX_RETRIES) await wait(3000);
      }
    }

    if (!abortRef.current) {
      setError(isFr
        ? 'Votre paiement a bien été traité. La confirmation peut prendre quelques instants. Vous pouvez vérifier dans "Mes Ressources" ou rafraîchir cette page.'
        : 'Your payment has been processed. Confirmation may take a moment. You can check "My Resources" or refresh this page.');
      setLoading(false);
    }
  }

  const handleDownload = async () => {
    if (!tx?.product_id || !tx?.file_url) return;
    setDownloading(true);
    try {
      const file = await fetchWatermarkedFile({ fileUrl: tx.file_url, productId: tx.product_id, productTitle: tx.product_title || 'Document' });
      triggerBrowserDownload(file);
    } catch (err) {
      console.error('[PaymentSuccess] download error:', err);
      alert(isFr ? 'Erreur lors du téléchargement. Veuillez réessayer depuis "Mes Ressources".' : 'Download error. Please retry from "My Resources".');
    } finally { setDownloading(false); }
  };

  const handleRead = async () => {
    if (!tx?.product_id || !tx?.file_url) return;
    setReading(true);
    try {
      const file = await fetchWatermarkedFile({ fileUrl: tx.file_url, productId: tx.product_id, productTitle: tx.product_title || 'Document', inline: true });
      openFileInline(file);
    } catch (err) {
      console.error('[PaymentSuccess] read error:', err);
      alert(isFr ? 'Erreur lors de l\'ouverture. La lecture directe est disponible uniquement pour les PDF.' : 'Error opening file. Direct reading is only available for PDFs.');
    } finally { setReading(false); }
  };

  const commissionPercent = tx?.commission_rate ?? 10;
  const potentialEarning = tx ? Math.round((tx.amount * commissionPercent) / 100) : 0;
  const fmt = (n: number) => tx ? formatCurrency(n, tx.currency) : `${n}`;

  const shareUrl = tx?.org_slug
    ? `${window.location.origin}/org/${tx.org_slug}${affiliateCode ? `?ref=${affiliateCode}` : ''}`
    : window.location.origin;

  const enrollAsAmbassador = async () => {
    if (!user || enrolling || !tx?.org_slug) return;
    setEnrolling(true);
    try {
      const { data: orgData } = await db.from('organizations').select('id').eq('slug', tx.org_slug).single();
      if (!orgData) throw new Error('Org not found');
      const { error } = await db.rpc('self_enroll_affiliate', { _org_id: orgData.id });
      if (error) throw error;
      const { data: linkData } = await db.from('affiliate_links').select('code').eq('user_id', user.id).eq('organization_id', orgData.id).maybeSingle();
      if (linkData?.code) {
        setAffiliateCode(linkData.code);
        setEnrolled(true);
        toast.success(isFr ? '🎉 Tu es maintenant ambassadeur !' : '🎉 You are now an ambassador!');
      }
    } catch (err: any) {
      const { data: existing } = await db.from('affiliate_links').select('code').eq('user_id', user!.id).limit(1).maybeSingle();
      if (existing?.code) {
        setAffiliateCode(existing.code);
        setEnrolled(true);
      } else {
        toast.error(isFr ? "Erreur lors de l'inscription" : 'Error during enrollment');
      }
    } finally { setEnrolling(false); }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {retryCount > 0
              ? (isFr ? `Vérification du paiement… (tentative ${retryCount}/${MAX_RETRIES})` : `Verifying payment… (attempt ${retryCount}/${MAX_RETRIES})`)
              : (isFr ? 'Chargement des détails…' : 'Loading details…')}
          </p>
          <p className="text-xs text-muted-foreground">{isFr ? 'Ne fermez pas cette page.' : 'Do not close this page.'}</p>
        </div>
      </div>
    );
  }

  // ── Error / pending state ──
  if (error || !tx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center space-y-6">
          <div className="relative inline-flex mb-2">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">{isFr ? 'Paiement en cours de traitement' : 'Payment being processed'}</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-xs text-muted-foreground">{isFr ? 'Référence' : 'Reference'} : {reference}</p>
          <div className="flex flex-col gap-2 items-center">
            <Button onClick={() => { setLoading(true); setError(''); abortRef.current = false; runVerificationLoop(); }} variant="outline" className="gap-2">
              <Loader2 className="h-4 w-4" /> {isFr ? 'Vérifier à nouveau' : 'Check again'}
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>{isFr ? 'Accueil' : 'Home'}</Button>
              {user && <Button size="sm" onClick={() => navigate('/resources')}>{isFr ? 'Mes achats' : 'My purchases'}</Button>}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main celebration page (unified for Paystack & Stripe) ──
  const isProduct = tx.type === 'product';
  const isBook = isPdfLikeFile(tx.file_url, tx.product_type);
  const isCompleted = tx.status === 'completed';
  const showAmbassador = isProduct && isCompleted && tx.amount > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-y-auto">
      <SEOHead title={isFr ? 'Paiement réussi — Siteviral' : 'Payment successful — Siteviral'} noindex />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-md bg-card border-2 border-primary/20 rounded-3xl overflow-hidden relative"
      >
        {/* Confetti burst */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          {Array.from({ length: 40 }).map((_, i) => {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#FFA07A', '#DDA0DD', '#FFD700', '#87CEEB'];
            const color = colors[i % colors.length];
            const size = 6 + Math.random() * 6;
            return (
              <motion.div key={i} className="absolute pointer-events-none"
                style={{ left: `${Math.random() * 100}%`, top: -10, width: size, height: size, backgroundColor: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px' }}
                initial={{ y: -20, opacity: 1, rotate: 0 }}
                animate={{ y: [0, 300 + Math.random() * 200], x: [0, (Math.random() - 0.5) * 120], opacity: [1, 1, 0], rotate: Math.random() * 720 }}
                transition={{ duration: 2 + Math.random(), delay: i * 0.05, ease: 'easeOut' }}
              />
            );
          })}
        </div>

        {/* Celebration header */}
        <div className="bg-gradient-to-br from-primary/10 via-emerald-500/10 to-amber-500/10 p-6 text-center relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            className="text-5xl mb-3"
          >
            🎉
          </motion.div>

          {isProduct && tx.cover_image_url && (
            <div className="w-20 h-28 mx-auto mb-3 rounded-lg overflow-hidden shadow-lg border border-border">
              <img src={tx.cover_image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <h2 className="text-xl font-black text-foreground">
            {isProduct
              ? (isFr ? "Bravo, c'est à toi !" : "Congrats, it's yours!")
              : (isFr ? 'Merci pour ta générosité ! 🙏' : 'Thank you for your generosity! 🙏')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isProduct
              ? (isFr
                ? `« ${tx.product_title} » est dans ta bibliothèque 📚`
                : `"${tx.product_title}" is in your library 📚`)
              : (isFr
                ? `Ton don pour « ${tx.campaign_title || tx.org_name} » est confirmé`
                : `Your donation to "${tx.campaign_title || tx.org_name}" is confirmed`)}
          </p>
        </div>

        {/* Content section */}
        <AnimatePresence mode="wait">
          {!enrolled ? (
            <motion.div key="main" exit={{ opacity: 0, y: -10 }} className="p-6 space-y-5 relative z-10">
              {/* Action buttons for products */}
              {isProduct && isCompleted && (
                <div className="space-y-2">
                  {tx.file_url && (
                    <>
                      <Button onClick={handleDownload} disabled={downloading} className="w-full gap-2 h-11 font-semibold">
                        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {downloading ? (isFr ? 'Téléchargement…' : 'Downloading…') : (isFr ? 'Télécharger' : 'Download')}
                      </Button>
                      {isBook && (
                        <Button onClick={handleRead} disabled={reading} variant="outline" className="w-full gap-2 h-11">
                          {reading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                          {reading ? (isFr ? 'Ouverture…' : 'Opening…') : (isFr ? 'Lire maintenant' : 'Read now')}
                        </Button>
                      )}
                    </>
                  )}
                  {tx.external_link && (
                    <a href={tx.external_link} target="_blank" rel="noreferrer" className="block">
                      <Button variant="outline" className="w-full gap-2 h-11">
                        <ArrowRight className="h-4 w-4" /> {isFr ? 'Accéder au contenu' : 'Access content'}
                      </Button>
                    </a>
                  )}
                </div>
              )}

              {/* Ambassador earning section */}
              {showAmbassador && (
                <>
                  <div className="text-center">
                    <h3 className="text-lg font-extrabold">
                      {isFr ? '💰 Gagne en partageant' : '💰 Earn by sharing'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isFr ? (
                        <>Tu as aimé <strong>{tx.product_title}</strong> ?<br />Partage et gagne <span className="font-bold text-emerald-500">{commissionPercent}%</span> sur chaque vente.</>
                      ) : (
                        <>Loved <strong>{tx.product_title}</strong>?<br />Share and earn <span className="font-bold text-emerald-500">{commissionPercent}%</span> on every sale.</>
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isFr ? 'Par vente' : 'Per sale'}</p>
                        <p className="text-2xl font-black text-emerald-500">{fmt(potentialEarning)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isFr ? '10 amis achètent' : '10 friends buy'}</p>
                        <p className="text-2xl font-black text-foreground">{fmt(potentialEarning * 10)}</p>
                      </div>
                    </div>
                    <div className="border-t border-emerald-500/20 mt-4 pt-3 text-center">
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {isFr
                          ? <>Simulation : 10 amis achètent = <strong className="text-foreground">{fmt(potentialEarning * 10)}</strong> pour toi</>
                          : <>Simulation: 10 friends buy = <strong className="text-foreground">{fmt(potentialEarning * 10)}</strong> for you</>
                        }
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={enrollAsAmbassador}
                    disabled={enrolling || !tx.org_slug}
                    size="lg"
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-13 text-base font-bold rounded-xl"
                  >
                    {enrolling ? (
                      <span className="animate-pulse">{isFr ? 'Inscription…' : 'Enrolling…'}</span>
                    ) : (
                      <>
                        <Rocket className="h-5 w-5" />
                        {isFr ? 'Oui, je veux gagner !' : 'Yes, I want to earn!'}
                      </>
                    )}
                  </Button>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {isFr ? 'Non merci, peut-être plus tard' : 'No thanks, maybe later'}
                  </button>
                </>
              )}

              {/* For donations or free products — show share & navigation */}
              {(!showAmbassador) && (
                <div className="space-y-3">
                  {isCompleted && (
                    <SocialShareKit
                      url={shareUrl}
                      title={tx.product_title || tx.campaign_title || tx.org_name}
                      context="post-purchase"
                    />
                  )}
                  {user && (
                    <Button onClick={() => navigate('/resources')} variant="outline" className="w-full gap-2">
                      <Package className="h-4 w-4" /> {isFr ? 'Mes achats' : 'My purchases'}
                    </Button>
                  )}
                  <Button onClick={() => navigate('/')} variant="ghost" className="w-full text-muted-foreground">
                    {isFr ? "Retour à l'accueil" : 'Back to home'}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Ambassador enrolled — show share tools */
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-5 relative z-10"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3"
                >
                  <Check className="h-6 w-6 text-white" />
                </motion.div>
                <h3 className="text-lg font-extrabold">{isFr ? 'Tu es ambassadeur ! 🎉' : "You're an ambassador! 🎉"}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isFr ? 'Partage maintenant pour commencer à gagner' : 'Share now to start earning'}
                </p>
              </div>

              <SocialShareKit
                url={shareUrl}
                title={tx.product_title || tx.org_name}
                context="ambassador"
                price={tx.amount}
                commissionRate={commissionPercent}
              />

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate('/gagner')}
              >
                {isFr ? 'Voir mes gains' : 'View my earnings'} <ArrowRight className="h-4 w-4" />
              </Button>

              {user && (
                <Button onClick={() => navigate('/resources')} variant="ghost" className="w-full gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" /> {isFr ? 'Mes achats' : 'My purchases'}
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer disclaimer */}
        <div className="px-6 pb-4 relative z-10">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground mb-2">
            <ShieldCheck className="h-3 w-3" />
            {isFr ? 'Paiement sécurisé — Siteviral' : 'Secure payment — Siteviral'}
          </div>
          {showAmbassador && !enrolled && (
            <p className="text-[10px] text-muted-foreground text-center">
              {isFr
                ? "Aucun investissement. Tu gagnes uniquement quand quelqu'un achète via ton lien."
                : 'No investment. You only earn when someone buys through your link.'}
            </p>
          )}
        </div>
      </motion.div>

      {/* Upsell below the card */}
      {isCompleted && isProduct && tx.organization_id && (
        <div className="w-full max-w-md mt-4">
          <UpsellSection productId={tx.product_id} orgId={tx.organization_id} currentProductId={tx.product_id} />
        </div>
      )}
    </div>
  );
}
