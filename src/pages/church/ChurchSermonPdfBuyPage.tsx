import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Loader2, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

export default function ChurchSermonPdfBuyPage() {
  const { slug, pdfId } = useParams<{ slug: string; pdfId: string }>();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: pdf, isLoading } = useQuery({
    enabled: !!pdfId,
    queryKey: ['sermon-pdf-public', pdfId],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_sermon_pdfs')
        .select('*, church:church_providers!inner(id, name, slug, logo_url), sermon:church_sermons!inner(title, preacher, series)')
        .eq('id', pdfId!)
        .eq('is_published', true)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!pdf) return <Navigate to={`/church/${slug || 'discover'}`} replace />;

  const isFree = pdf.is_free || Number(pdf.price) <= 0;

  const buy = async () => {
    if (!email.trim()) return toast.error(fr ? 'Email requis' : 'Email required');
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('church-buy-sermon-pdf', {
        body: {
          pdf_id: pdf.id,
          buyer_email: email.trim(),
          buyer_name: name.trim() || null,
          buyer_phone: phone.trim() || null,
          return_origin: window.location.origin,
        },
      });
      if (error) throw new Error(error.message);
      const d = data as any;
      if (d?.error) throw new Error(d.error);
      if (d?.free && d?.redirect_url) {
        window.location.href = d.redirect_url;
        return;
      }
      if (!d?.checkout_url) throw new Error(fr ? 'Erreur de paiement' : 'Payment error');
      window.location.href = d.checkout_url;
    } catch (e: any) {
      toast.error(e?.message || (fr ? 'Erreur' : 'Error'));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to={`/church/${(pdf as any).church.slug}`}><ArrowLeft className="mr-1 h-4 w-4" /> {fr ? 'Retour' : 'Back'}</Link>
        </Button>

        <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{(pdf as any).church.name}</p>
              <h1 className="font-bold text-lg leading-tight">{pdf.title}</h1>
            </div>
          </div>

          {pdf.description && <p className="text-sm text-muted-foreground">{pdf.description}</p>}

          <div className="flex items-center gap-4 text-xs text-muted-foreground border-y border-border py-3">
            <span>{pdf.page_count || 0} {fr ? 'pages' : 'pages'}</span>
            <span>·</span>
            <span>PDF</span>
            <span>·</span>
            <span>{(pdf as any).sermon?.preacher || (pdf as any).sermon?.title}</span>
          </div>

          <div className="text-center">
            {isFree ? (
              <p className="text-3xl font-bold text-emerald-600">{fr ? 'Gratuit' : 'Free'}</p>
            ) : (
              <p className="text-3xl font-bold">{Number(pdf.price).toLocaleString()} <span className="text-lg font-medium text-muted-foreground">{pdf.currency}</span></p>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">{fr ? 'Email (pour recevoir le PDF)' : 'Email (to receive the PDF)'}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{fr ? 'Nom (optionnel)' : 'Name (optional)'}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              {!isFree && (
                <div>
                  <Label className="text-xs">{fr ? 'Téléphone (Mobile Money)' : 'Phone (Mobile Money)'}</Label>
                  <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225…" />
                </div>
              )}
            </div>
          </div>

          <Button onClick={buy} disabled={submitting} size="lg" className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isFree ? <Check className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
            {isFree ? (fr ? 'Obtenir le PDF' : 'Get the PDF') : (fr ? `Payer ${Number(pdf.price).toLocaleString()} ${pdf.currency}` : `Pay ${Number(pdf.price).toLocaleString()} ${pdf.currency}`)}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            {fr ? 'Paiement sécurisé · Carte (Stripe) ou Mobile Money (GeniusPay)' : 'Secure payment · Card (Stripe) or Mobile Money (GeniusPay)'}
          </p>
        </div>
      </div>
    </div>
  );
}
