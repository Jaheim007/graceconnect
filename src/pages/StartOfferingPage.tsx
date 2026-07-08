import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Check, Sparkles, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUserKind } from '@/hooks/useUserKind';
import { inferSiteviralConfig, type StartGoalId } from '@/lib/siteviral/inferFromGoals';
import { activateFeature } from '@/lib/siteviral/activation';
import { setIntent } from '@/lib/intent';
import { AddOrNewWorkspaceDialog } from '@/components/start/AddOrNewWorkspaceDialog';

interface GoalOption {
  id: StartGoalId;
  emoji: string;
  fr: string;
  en: string;
}

const GOALS: GoalOption[] = [
  { id: 'sell_digital',        emoji: '🛒', fr: 'Vendre des produits digitaux',        en: 'Sell digital products' },
  { id: 'receive_appointments',emoji: '📅', fr: 'Recevoir des rendez-vous',            en: 'Receive appointments' },
  { id: 'offer_beauty',        emoji: '💅', fr: 'Proposer des services beauté',        en: 'Offer beauty services' },
  { id: 'offer_home',          emoji: '🛠️', fr: 'Proposer des services à domicile',   en: 'Offer home / artisan services' },
  { id: 'offer_tutoring',      emoji: '🎓', fr: 'Proposer des cours / tutorat',        en: 'Offer tutoring / teaching' },
  { id: 'offer_music',         emoji: '🎼', fr: 'Proposer des services musicien / instrumentiste', en: 'Offer music / instrumentist services' },
  { id: 'offer_influencer',    emoji: '📣', fr: 'Proposer des collaborations influenceur', en: 'Offer influencer collaborations' },
  { id: 'offer_sport',         emoji: '🏋️', fr: 'Proposer coaching / sport',           en: 'Offer sport / coaching' },
  { id: 'offer_general_service', emoji: '💼', fr: 'Proposer un service général',       en: 'Offer a general service' },
  { id: 'receive_donations',   emoji: '💝', fr: 'Recevoir des dons / offrandes',       en: 'Receive donations / gifts' },
  { id: 'custom_orders',       emoji: '📝', fr: 'Créer des commandes sur mesure',      en: 'Create custom orders' },
  { id: 'accept_payments',     emoji: '💳', fr: 'Accepter des paiements',              en: 'Accept payments' },
  { id: 'create_events',       emoji: '🎉', fr: 'Créer des événements',                en: 'Create events' },
  { id: 'ai_books',            emoji: '📚', fr: 'Créer des livres avec l\'IA',         en: 'Create books with AI' },
  { id: 'ai_formations',       emoji: '🎬', fr: 'Créer des formations avec l\'IA',     en: 'Create formations with AI' },
  { id: 'show_location',       emoji: '📍', fr: 'Afficher ma localisation',            en: 'Show my location' },
  { id: 'receive_reviews',     emoji: '⭐', fr: 'Recevoir des avis',                   en: 'Receive reviews' },
  { id: 'use_affiliation',     emoji: '🔗', fr: 'Utiliser l\'affiliation',             en: 'Use affiliation' },
];

const CONFIG_KEY = 'sv_start_config';

export default function StartOfferingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const context = (params.get('context') ?? 'create') as 'create' | 'add-feature' | 'new-workspace';
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { kind } = useUserKind();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const [selected, setSelected] = useState<Set<StartGoalId>>(new Set());
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: StartGoalId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const inferred = useMemo(() => inferSiteviralConfig(Array.from(selected)), [selected]);

  const persistAndGoCreate = () => {
    try {
      sessionStorage.setItem(CONFIG_KEY, JSON.stringify({
        goals: Array.from(selected),
        ...inferred,
      }));
    } catch {}
    navigate('/create-org');
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error(fr ? 'Choisissez au moins une activité' : 'Pick at least one activity');
      return;
    }

    // Not authenticated → save intent + config, send to auth
    if (!user) {
      setIntent('provider', '/start' + (context !== 'create' ? `?context=${context}` : ''));
      try {
        sessionStorage.setItem(CONFIG_KEY, JSON.stringify({
          goals: Array.from(selected), ...inferred,
        }));
      } catch {}
      navigate('/auth?mode=signup');
      return;
    }

    // Add-feature path for existing providers → show chooser
    if (context === 'add-feature' && kind === 'provider' && currentOrg) {
      setDialogOpen(true);
      return;
    }

    // New workspace path or brand-new user → org creation flow prefilled
    persistAndGoCreate();
  };

  const applyToCurrent = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      const existing = new Set(currentOrg.enabled_features ?? []);
      // Merge features only. Never change siteviral_type.
      for (const f of inferred.enabled_features) {
        if (!existing.has(f)) {
          await activateFeature(currentOrg.id, f, 'user');
        }
      }
      await qc.invalidateQueries({ queryKey: ['user-orgs'] });
      toast.success(fr ? 'Fonctionnalités ajoutées à votre espace' : 'Features added to your workspace');
      navigate('/admin');
    } catch (e: any) {
      toast.error(e?.message ?? 'Error');
    } finally {
      setSaving(false);
      setDialogOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <SEOHead
        title={fr ? 'Que voulez-vous proposer ? — SiteViral' : 'What do you want to offer? — SiteViral'}
        description={fr ? 'Choisissez vos activités, nous préparons les bons outils.' : 'Pick your activities, we set up the right tools.'}
        noindex
      />

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {fr ? 'Créer votre espace' : 'Create your workspace'}
        </div>
        <h1 className="text-2xl font-bold">
          {fr ? 'Que voulez-vous proposer ou vendre ?' : 'What do you want to offer or sell?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {fr
            ? 'Choisissez une ou plusieurs activités. Nous préparerons les bons outils pour vous — sans jargon.'
            : 'Pick one or more activities. We\'ll prepare the right tools for you — no jargon.'}
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        {GOALS.map((g) => {
          const isSel = selected.has(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                isSel ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'hover:border-muted-foreground/30'
              }`}
            >
              <div className="text-xl leading-none">{g.emoji}</div>
              <div className="flex-1 text-sm font-medium">{fr ? g.fr : g.en}</div>
              {isSel && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>

      {selected.size > 0 && (
        <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
          {fr ? 'Nous préparerons votre espace avec les bons outils.' : 'We\'ll prepare your workspace with the right tools.'}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          {fr ? 'Retour' : 'Back'}
        </Button>
        <Button onClick={handleSubmit} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {fr ? 'Continuer' : 'Continue'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <AddOrNewWorkspaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentOrgName={currentOrg?.name}
        onAddToCurrent={applyToCurrent}
        onCreateNew={persistAndGoCreate}
        loading={saving}
      />
    </div>
  );
}
