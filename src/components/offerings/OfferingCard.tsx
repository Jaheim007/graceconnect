import { useNavigate } from '@/lib/router-compat';
import { stripHtml } from '@/lib/formatText';
import { Offering } from '@/hooks/useOfferings';
import { Button } from '@/components/ui/button';
import { HandHeart } from 'lucide-react';
import { useLocalCurrency } from '@/hooks/useLocalCurrency';
import { useI18n } from '@/i18n/I18nContext';

interface OfferingCardProps {
  offering: Offering;
  onSelect: (offering: Offering) => void;
}

export function OfferingCard({ offering, onSelect }: OfferingCardProps) {
  const navigate = useNavigate();
  const { formatLocal, needsConversion } = useLocalCurrency();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const presets = offering.preset_amounts || [1000, 2500, 5000, 10000];
  const currency = offering.currency || 'XOF';
  const showLocal = needsConversion(currency);

  const fmt = (n: number) =>
    new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US', { maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-shadow cursor-pointer"
      onClick={() => navigate(`/offering/${offering.id}`)}
    >
      {offering.image_url && (
        <div className="h-32 overflow-hidden">
          <img src={offering.image_url} alt={offering.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <HandHeart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{offering.title}</h3>
            {offering.is_recurring_allowed && (
              <span className="text-[10px] text-muted-foreground">{isFr ? 'Ponctuel ou récurrent' : 'One-time or recurring'}</span>
            )}
          </div>
        </div>

        {offering.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{stripHtml(offering.description)}</p>
        )}

        <div className="flex flex-wrap gap-1">
          {presets.slice(0, 4).map((p) => (
            <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {fmt(p)} {currency}
              {showLocal && <span className="block text-[9px] opacity-70">{formatLocal(p, currency)}</span>}
            </span>
          ))}
        </div>

        <Button
          onClick={(e) => { e.stopPropagation(); onSelect(offering); }}
          className="w-full bg-primary text-primary-foreground"
          size="sm"
        >
          <HandHeart className="h-3.5 w-3.5 mr-1.5" />
          {isFr ? 'Faire un don' : 'Donate'}
        </Button>
      </div>
    </div>
  );
}
