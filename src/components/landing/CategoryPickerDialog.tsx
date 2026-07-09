import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent, type IntentKind } from '@/lib/intent';
import { MARKET_CATS } from '@/lib/marketplaceCats';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  intent: IntentKind; // 'client' → findRoute, 'provider' → proposeRoute
  title?: string;
  description?: string;
}

export function CategoryPickerDialog({ open, onOpenChange, intent, title, description }: Props) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const go = (route: string) => {
    setIntent(intent, route);
    onOpenChange(false);
    navigate(route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {title ?? (fr
              ? intent === 'client' ? 'Quel service cherchez-vous ?' : 'Que voulez-vous proposer ?'
              : intent === 'client' ? 'What service are you looking for?' : 'What do you want to offer?')}
          </DialogTitle>
          <DialogDescription>
            {description ?? (fr ? 'Choisissez une catégorie pour continuer.' : 'Pick a category to continue.')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {MARKET_CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => go(intent === 'client' ? c.findRoute : c.proposeRoute)}
              className="group text-left rounded-2xl overflow-hidden border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className={`relative aspect-[5/3] bg-gradient-to-br ${c.gradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.28),transparent_60%)]" />
                <div className="absolute bottom-2 left-2 h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md grid place-items-center ring-1 ring-white/30">
                  <c.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="p-2.5">
                <span className="text-xs font-bold">{fr ? c.fr : c.en}</span>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
