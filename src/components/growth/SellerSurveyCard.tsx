import { useEffect, useState } from 'react';
import { ClipboardList, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { toast } from 'sonner';

type Q = {
  key: 'main_goal' | 'content_type' | 'audience_size' | 'biggest_blocker' | 'found_via' | 'price_expectation';
  fr: string;
  en: string;
  options: { value: string; fr: string; en: string }[];
};

const QUESTIONS: Q[] = [
  {
    key: 'main_goal', fr: 'Quel est votre objectif principal ?', en: 'What is your main goal?',
    options: [
      { value: 'sell_content', fr: 'Vendre mon contenu', en: 'Sell my content' },
      { value: 'collect_gifts', fr: 'Recevoir dons / offrandes', en: 'Collect gifts / offerings' },
      { value: 'teach', fr: 'Enseigner / former', en: 'Teach / train' },
      { value: 'earn_affiliate', fr: 'Gagner en vendant pour les autres', en: 'Earn selling for others' },
    ],
  },
  {
    key: 'content_type', fr: 'Quel type de contenu avez-vous ?', en: 'What kind of content do you have?',
    options: [
      { value: 'none_yet', fr: "Rien encore, je veux créer avec l'IA", en: 'Nothing yet, I want to create with AI' },
      { value: 'book', fr: 'Livres / ebooks', en: 'Books / ebooks' },
      { value: 'course', fr: 'Formations / cours', en: 'Courses' },
      { value: 'audio', fr: 'Audio / prédications', en: 'Audio / sermons' },
    ],
  },
  {
    key: 'audience_size', fr: 'Quelle est la taille de votre audience ?', en: 'How big is your audience?',
    options: [
      { value: '0', fr: 'Aucune', en: 'None' },
      { value: '1-100', fr: '1 à 100', en: '1 to 100' },
      { value: '100-1000', fr: '100 à 1 000', en: '100 to 1,000' },
      { value: '1000+', fr: 'Plus de 1 000', en: 'More than 1,000' },
    ],
  },
  {
    key: 'biggest_blocker', fr: "Qu'est-ce qui vous bloque le plus ?", en: 'What blocks you the most?',
    options: [
      { value: 'no_traffic', fr: 'Pas de visiteurs', en: 'No traffic' },
      { value: 'no_sales', fr: 'Des visiteurs mais pas de ventes', en: 'Visitors but no sales' },
      { value: 'creating', fr: 'Créer le contenu', en: 'Creating the content' },
      { value: 'payments', fr: 'Paiements / retraits', en: 'Payments / payouts' },
    ],
  },
  {
    key: 'found_via', fr: 'Comment avez-vous connu SiteViral ?', en: 'How did you find SiteViral?',
    options: [
      { value: 'whatsapp', fr: 'WhatsApp', en: 'WhatsApp' },
      { value: 'facebook', fr: 'Facebook / Instagram', en: 'Facebook / Instagram' },
      { value: 'friend', fr: 'Un ami / une église', en: 'A friend / a church' },
      { value: 'search', fr: 'Recherche Google', en: 'Google search' },
    ],
  },
  {
    key: 'price_expectation', fr: 'Combien pensez-vous vendre votre contenu ?', en: 'How much do you expect to charge?',
    options: [
      { value: 'free', fr: 'Gratuit', en: 'Free' },
      { value: 'under_5k', fr: 'Moins de 5 000 F', en: 'Under 5,000 F' },
      { value: '5k_25k', fr: '5 000 à 25 000 F', en: '5,000 to 25,000 F' },
      { value: 'over_25k', fr: 'Plus de 25 000 F', en: 'Over 25,000 F' },
    ],
  },
];

const DISMISS_KEY = 'sv_seller_survey_dismissed';

export function SellerSurveyCard() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const { currentOrg } = useOrg();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (localStorage.getItem(DISMISS_KEY)) return;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from('seller_surveys')
        .select('id')
        .eq('user_id', auth.user.id)
        .limit(1);
      if (active && (!data || data.length === 0)) setVisible(true);
    })();
    return () => { active = false; };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const submit = async () => {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setSaving(false); return; }
    const { error } = await supabase.from('seller_surveys').insert({
      user_id: auth.user.id,
      organization_id: currentOrg?.id ?? null,
      main_goal: answers.main_goal ?? null,
      content_type: answers.content_type ?? null,
      audience_size: answers.audience_size ?? null,
      biggest_blocker: answers.biggest_blocker ?? null,
      found_via: answers.found_via ?? null,
      price_expectation: answers.price_expectation ?? null,
      note: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(fr ? 'Impossible d\'enregistrer' : 'Could not save');
      return;
    }
    localStorage.setItem(DISMISS_KEY, '1');
    toast.success(fr ? 'Merci, c\'est noté !' : 'Thanks, noted!');
    setVisible(false);
  };

  if (!visible) return null;

  const isLast = step === QUESTIONS.length;
  const q = QUESTIONS[step];

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label={fr ? 'Fermer' : 'Close'}
        className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardList className="h-4 w-4 text-primary" />
        </span>
        <div>
          <h3 className="font-heading text-sm font-bold tracking-tight">
            {fr ? '6 questions pour vous aider à vendre' : '6 questions to help you sell'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {fr ? `Étape ${Math.min(step + 1, QUESTIONS.length + 1)} / ${QUESTIONS.length + 1}` : `Step ${Math.min(step + 1, QUESTIONS.length + 1)} of ${QUESTIONS.length + 1}`}
          </p>
        </div>
      </div>

      {!isLast ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">{fr ? q.fr : q.en}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o) => {
              const selected = answers[q.key] === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setAnswers((a) => ({ ...a, [q.key]: o.value }));
                    setStep((s) => s + 1);
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <span>{fr ? o.fr : o.en}</span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setStep((s) => s - 1)}>
                {fr ? 'Retour' : 'Back'}
              </Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground" onClick={() => setStep((s) => s + 1)}>
              {fr ? 'Passer' : 'Skip'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {fr ? 'Une chose que SiteViral devrait faire pour vous ?' : 'One thing SiteViral should do for you?'}
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="rounded-xl"
            placeholder={fr ? 'Optionnel' : 'Optional'}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" className="rounded-lg" disabled={saving} onClick={submit}>
              {saving ? (fr ? 'Envoi…' : 'Sending…') : (fr ? 'Envoyer' : 'Send')}
            </Button>
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setStep((s) => s - 1)}>
              {fr ? 'Retour' : 'Back'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
