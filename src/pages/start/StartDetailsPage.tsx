import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { StartShell } from '@/components/start/StartShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { resolveActivity } from '@/lib/siteviral/moduleToFeatures';
import { CHURCH_DENOMINATIONS } from '@/lib/churchDenominations';
import { detectCurrencyFromTimezone } from '@/lib/countryDetect';
import { setIntent } from '@/lib/intent';
import { SpaceReadyDialog } from '@/components/start/SpaceReadyDialog';
import { toast } from 'sonner';

const CONFIG_KEY = 'sv_start_config';

export default function StartDetailsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  // Prefer explicit ?activity, else read from session
  const [config] = useState(() => {
    try {
      const raw = sessionStorage.getItem(CONFIG_KEY);
      const stored = raw ? JSON.parse(raw) : null;
      const activity = params.get('activity') || stored?.activity || 'general';
      return { activity, stored: stored ?? {} };
    } catch {
      return { activity: params.get('activity') || 'general', stored: {} };
    }
  });

  const resolved = resolveActivity(config.activity);
  const [name, setName] = useState<string>(config.stored?.name ?? '');
  const [city, setCity] = useState<string>(config.stored?.city ?? '');
  const [denomination, setDenomination] = useState<string>(config.stored?.denomination ?? 'pentecostal');
  const isChurch = resolved.activityKey === 'church';
  const [readyOpen, setReadyOpen] = useState(false);

  useEffect(() => {
    if (!config.activity) { navigate('/start', { replace: true }); return; }
    if (resolved.activityKey === 'digital') { navigate('/create-org', { replace: true }); }
  }, [config.activity, resolved.activityKey, navigate]);

  const label = fr ? resolved.labelFr : resolved.labelEn;

  const submit = () => {
    if (name.trim().length < 2) {
      toast.error(fr ? 'Entrez un nom' : 'Enter a name');
      return;
    }
    const payload = {
      activity: resolved.activityKey,
      siteviral_type: resolved.siteviral_type,
      enabled_features: resolved.enabled_features,
      name: name.trim(),
      city: city.trim(),
      denomination: isChurch ? denomination : null,
      currency: detectCurrencyFromTimezone(),
    };
    try { sessionStorage.setItem(CONFIG_KEY, JSON.stringify(payload)); } catch {}

    if (!user) {
      setIntent('provider', '/start/finish');
      navigate('/auth?mode=signup&returnTo=/start/finish');
      return;
    }
    navigate('/start/finish');
  };

  return (
    <StartShell step={2}>
      <SEOHead
        title={fr ? 'Vos détails — Siteviral' : 'Your details — Siteviral'}
        description={fr ? 'Nom et zone de votre activité.' : 'Name and area for your activity.'}
        noindex
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
            {label}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Parlez-nous de votre activité' : 'Tell us about your activity'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {fr
              ? 'Deux infos, et votre espace est prêt.'
              : 'Two details, and your space is ready.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              {fr ? 'Nom de votre activité' : 'Activity name'}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                isChurch
                  ? fr ? 'Ex. Église Grâce & Vie' : 'e.g. Grace & Life Church'
                  : fr ? 'Ex. Salon Belle & Chic' : 'e.g. Belle & Chic Studio'
              }
              className="h-12 text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-semibold">
              {fr ? 'Ville ou zone' : 'City or area'}
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={fr ? 'Ex. Abidjan, Cocody' : 'e.g. Abidjan, Cocody'}
              className="h-12 text-base"
            />
            <p className="text-[11px] text-muted-foreground">
              {fr ? 'Aide vos clients à vous trouver.' : 'Helps clients find you.'}
            </p>
          </div>

          {isChurch && (
            <div className="space-y-1.5">
              <Label htmlFor="denom" className="text-xs font-semibold">
                {fr ? 'Dénomination' : 'Denomination'}
              </Label>
              <select
                id="denom"
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base"
              >
                {CHURCH_DENOMINATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{fr ? d.fr : d.en}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <Button onClick={submit} className="w-full h-12 gap-2 text-base font-bold">
          {fr ? 'Continuer' : 'Continue'} <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-center text-[11px] text-muted-foreground">
          {fr
            ? 'En continuant, vous acceptez nos conditions.'
            : 'By continuing, you accept our terms.'}
        </p>
      </div>
    </StartShell>
  );
}
