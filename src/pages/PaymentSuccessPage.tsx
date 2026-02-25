import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, Download, BookOpen, ArrowRight, ShieldCheck,
  Store, User, Package, CreditCard, Calendar, Hash, Loader2, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

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

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
  const gateway = searchParams.get('gateway') || 'paystack';
  const [tx, setTx] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setError('Aucune référence de transaction trouvée.');
      setLoading(false);
      return;
    }
    fetchTransaction();
  }, [reference]);

  async function fetchTransaction() {
    try {
      // Try product purchase first
      const { data: purchase } = await db
        .from('product_purchases')
        .select('*, digital_products(id, title, product_type, file_url, external_link, cover_image_url, organization_id, organizations(name, logo_url, leader_name, leader_title))')
        .eq('paystack_reference', reference)
        .limit(1)
        .maybeSingle();

      if (purchase) {
        const product = purchase.digital_products;
        const org = product?.organizations;
        setTx({
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
        });
        setLoading(false);
        return;
      }

      // Try donation
      const { data: donation } = await db
        .from('donations')
        .select('*, donation_campaigns(title), organizations(name, logo_url, leader_name, leader_title)')
        .eq('paystack_reference', reference)
        .limit(1)
        .maybeSingle();

      if (donation) {
        const org = donation.organizations;
        setTx({
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
        });
        setLoading(false);
        return;
      }

      setError('Transaction non trouvée. Elle peut être en cours de traitement.');
      setLoading(false);
    } catch (err) {
      console.error('[PaymentSuccess] fetch error:', err);
      setError('Erreur lors de la récupération des détails.');
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
      const { data: { session } } = await db.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watermark-download`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          file_url: tx.file_url,
          product_id: tx.product_id,
          product_title: tx.product_title || 'Document',
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Download failed');
      }
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${tx.product_title || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('[PaymentSuccess] download error:', err);
      alert('Erreur lors du téléchargement. Veuillez réessayer depuis "Mes Ressources".');
    } finally {
      setDownloading(false);
    }
  };

  const handleRead = async () => {
    if (!tx?.product_id || !tx?.file_url) return;
    setReading(true);
    try {
      const { data: { session } } = await db.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watermark-download`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          file_url: tx.file_url,
          product_id: tx.product_id,
          product_title: tx.product_title || 'Document',
          inline: true,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Read failed');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('[PaymentSuccess] read error:', err);
      alert('Erreur lors de l\'ouverture. Veuillez réessayer depuis "Mes Ressources".');
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
          <p className="text-muted-foreground">Chargement des détails…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Transaction introuvable</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-xs text-muted-foreground">Référence : {reference}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>Accueil</Button>
            {user && <Button onClick={() => navigate('/dashboard')}>Mon espace</Button>}
          </div>
        </motion.div>
      </div>
    );
  }

  const isProduct = tx.type === 'product';
  const isBook = tx.product_type === 'ebook' || tx.product_type === 'pdf' || tx.file_url?.toLowerCase().includes('.pdf');
  const isCompleted = tx.status === 'completed';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
            <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isProduct ? 'Achat confirmé !' : 'Don confirmé !'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isProduct
              ? 'Votre produit numérique est prêt.'
              : 'Merci pour votre générosité 🙏'}
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
                onClick={() => navigate('/dashboard')}
              >
                Mon espace <ArrowRight className="h-3 w-3" />
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
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-center">Partagez votre expérience</p>
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const text = isProduct
                      ? `Je viens d'acheter "${tx.product_title}" sur ${tx.org_name} via Siteviral ! 🎉`
                      : `Je viens de soutenir "${tx.campaign_title || tx.org_name}" via Siteviral ! 🙏`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const text = isProduct
                      ? `Je viens d'acheter "${tx.product_title}" sur ${tx.org_name} ! 🎉`
                      : `Je viens de soutenir "${tx.campaign_title || tx.org_name}" ! 🙏`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  X / Twitter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Lien copié !');
                  }}
                >
                  Copier le lien
                </Button>
              </div>
            </div>
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
