import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES, OPTIONAL_MODULE_IDS, ModuleId } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ShieldCheck, CreditCard, Star, MessageSquare, Receipt } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { ALL_WORLDS, WORLDS, resolveWorld, type SiteviralWorld } from '@/lib/siteviral/worlds';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

/**
 * Settings → Modules — the multiverse activation matrix.
 *
 * Two sections:
 *  1. Extras for your current world — toggleable add-on modules
 *     (booking, digital products, giving, AI, events, affiliation…).
 *  2. Add another world — activate a whole other world's sidebar block
 *     alongside your primary one, without creating a new workspace.
 */
export default function ModulesSettings() {
  const { optionalModules, toggle, isLoading, isSaving } = useEnabledModules();
  const { currentOrg, refetchOrgs } = useOrg();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const primaryWorld = currentOrg ? resolveWorld(currentOrg as any) : null;
  const primaryMeta = primaryWorld ? WORLDS[primaryWorld] : null;
  const initialExtra: SiteviralWorld[] = Array.isArray((currentOrg as any)?.extra_worlds)
    ? ((currentOrg as any).extra_worlds as SiteviralWorld[])
    : [];
  const [extraWorlds, setExtraWorlds] = useState<SiteviralWorld[]>(initialExtra);
  const [savingWorld, setSavingWorld] = useState<SiteviralWorld | null>(null);

  const handleToggle = async (id: ModuleId, on: boolean) => {
    try {
      await toggle(id);
      toast.success(
        on
          ? (fr ? `${MODULES[id].labelFr} désactivé` : `${MODULES[id].labelEn} turned off`)
          : (fr ? `${MODULES[id].labelFr} activé` : `${MODULES[id].labelEn} turned on`)
      );
    } catch {
      toast.error(fr ? 'Erreur, réessaie' : 'Failed, try again');
    }
  };

  const toggleWorld = async (world: SiteviralWorld) => {
    if (!currentOrg) return;
    const currently = extraWorlds.includes(world);
    const next = currently ? extraWorlds.filter((w) => w !== world) : [...extraWorlds, world];
    setExtraWorlds(next);
    setSavingWorld(world);
    try {
      const { error } = await (supabase.from('organizations') as any)
        .update({ extra_worlds: next })
        .eq('id', currentOrg.id);
      if (error) throw error;
      refetchOrgs();
      toast.success(currently
        ? (fr ? `${WORLDS[world].labelFr} désactivé` : `${WORLDS[world].labelEn} turned off`)
        : (fr ? `${WORLDS[world].labelFr} activé` : `${WORLDS[world].labelEn} turned on`));
    } catch {
      setExtraWorlds(extraWorlds); // rollback
      toast.error(fr ? 'Erreur, réessaie' : 'Failed, try again');
    } finally {
      setSavingWorld(null);
    }
  };

  const bakedIn = [
    { icon: ShieldCheck, labelFr: 'Vérification KYC', labelEn: 'KYC verification',
      descFr: 'Obligatoire pour tout prestataire.', descEn: 'Required for every provider.' },
    { icon: CreditCard, labelFr: 'Paiements', labelEn: 'Payments',
      descFr: 'Encaissement intégré à ton service.', descEn: 'Built into your service.' },
    { icon: Star, labelFr: 'Avis clients', labelEn: 'Client reviews',
      descFr: 'Les clients notent ton service.', descEn: 'Clients rate your service.' },
    { icon: MessageSquare, labelFr: 'Commentaires', labelEn: 'Comments',
      descFr: 'Sur tes produits et publications.', descEn: 'On your products and posts.' },
    { icon: Receipt, labelFr: 'Commandes & devis', labelEn: 'Orders & quotes',
      descFr: 'Suivi de tes ventes.', descEn: 'Tracks your sales.' },
  ];

  const otherWorlds = ALL_WORLDS.filter((w) => w.id !== primaryWorld);

  return (
    <div className="container max-w-3xl px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        {fr ? 'Mes modules' : 'My modules'}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm max-w-xl">
        {fr
          ? 'Active des extras pour ton monde principal ou ajoute un autre monde entier à ton espace.'
          : 'Turn on extras for your primary world, or add a whole other world to your workspace.'}
      </p>

      {/* Primary world context banner */}
      {primaryMeta && (
        <div className="mt-6 rounded-2xl border bg-primary/5 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
            <primaryMeta.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              {fr ? 'Monde principal' : 'Primary world'}
            </div>
            <div className="font-bold text-sm">{fr ? primaryMeta.labelFr : primaryMeta.labelEn}</div>
          </div>
        </div>
      )}

      {/* Section 1 — extras for the current world */}
      <div className="mt-8">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {fr ? 'Extras pour ton monde' : "Extras for your world"}
        </div>
        <div className="divide-y rounded-2xl border bg-card">
          {OPTIONAL_MODULE_IDS.map((id) => {
            const m = MODULES[id];
            const on = optionalModules.includes(id);
            return (
              <div key={id} className="flex items-center gap-4 p-4">
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${m.color}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{fr ? m.labelFr : m.labelEn}</div>
                  <div className="text-xs text-muted-foreground">{fr ? m.descFr : m.descEn}</div>
                </div>
                <Switch
                  checked={on}
                  disabled={isLoading || isSaving}
                  onCheckedChange={() => handleToggle(id, on)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2 — add another world */}
      <div className="mt-10">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {fr ? 'Ajouter un autre monde' : 'Add another world'}
        </div>
        <p className="text-xs text-muted-foreground mb-3 max-w-xl">
          {fr
            ? "Un seul espace, plusieurs mondes. Active un monde supplémentaire pour ajouter son module dans ton tableau de bord."
            : 'One workspace, multiple worlds. Activate another world to add its block to your dashboard sidebar.'}
        </p>
        <div className="divide-y rounded-2xl border bg-card">
          {otherWorlds.map((w) => {
            const on = extraWorlds.includes(w.id);
            return (
              <div key={w.id} className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0 bg-muted text-muted-foreground">
                  <w.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{fr ? w.labelFr : w.labelEn}</div>
                  <div className="text-xs text-muted-foreground">{fr ? w.descFr : w.descEn}</div>
                </div>
                <Switch
                  checked={on}
                  disabled={savingWorld === w.id || !currentOrg}
                  onCheckedChange={() => toggleWorld(w.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Baked-in — for reference only */}
      <div className="mt-10">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {fr ? 'Inclus avec ton service' : 'Included with your service'}
        </div>
        <div className="divide-y rounded-2xl border bg-muted/20">
          {bakedIn.map((m) => (
            <div key={m.labelEn} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0 bg-primary/10 text-primary">
                <m.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{fr ? m.labelFr : m.labelEn}</div>
                <div className="text-xs text-muted-foreground">{fr ? m.descFr : m.descEn}</div>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {fr ? 'Inclus' : 'Included'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
