import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { formatCurrency, DEFAULT_CURRENCY } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';

export default function MyDonationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const fmt = (n: number, currency?: string | null) => formatCurrency(n, currency || DEFAULT_CURRENCY, locale);

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['all-my-donations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db.from('donations')
        .select('id, amount, currency, created_at, completed_at, status, donor_name, campaign_id, donation_campaigns(title, image_url), organizations(name)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const total = donations.reduce((s: number, d: any) => s + (d.amount || 0), 0);

  return (
    <div className="container max-w-2xl px-4 py-5 sm:py-6 space-y-5">
      <SEOHead title={isFr ? "Mes dons — Siteviral" : "My Donations — Siteviral"} noindex />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" /> {isFr ? 'Mes dons' : 'My Donations'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {donations.length > 0
              ? `${donations.length} ${isFr ? 'don(s)' : 'donation(s)'} · Total : ${fmt(total)}`
              : (isFr ? 'Historique de tes dons et contributions' : 'History of your donations and contributions')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground mb-4">{isFr ? "Tu n'as pas encore fait de don" : "You haven't made any donations yet"}</p>
          <Button onClick={() => navigate('/marketplace?tab=campaigns')} className="gap-2">
            <Heart className="h-4 w-4" /> {isFr ? 'Voir les campagnes actives' : 'View active campaigns'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {donations.map((don: any) => (
            <div key={don.id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
              <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {don.donation_campaigns?.title || don.organizations?.name || (isFr ? 'Don' : 'Donation')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(don.completed_at || don.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="text-sm font-bold text-rose-500">{fmt(don.amount, don.currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
