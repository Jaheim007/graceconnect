import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Plus, Image, FileText, Play, CalendarDays,
  Heart, ShoppingBag, Palette, Eye, EyeOff, GripVertical,
  HelpCircle, X, ChevronUp, ChevronDown, Camera, Link2
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { OrgPageSettings, useUpsertOrgPageSettings } from '@/hooks/useOrgPageSettings';
import { useToast } from '@/hooks/use-toast';

interface OrgAdminToolbarProps {
  orgId: string;
  orgSlug: string;
  isOwner: boolean;
  affiliationEnabled: boolean;
  pageSettings: OrgPageSettings | null;
  onStartTour: () => void;
  onToggleAffiliation: () => void;
}

const SECTION_META: Record<string, { icon: any; label_fr: string; label_en: string }> = {
  products: { icon: ShoppingBag, label_fr: 'Produits numériques', label_en: 'Digital Products' },
  campaigns: { icon: Heart, label_fr: 'Campagnes de dons', label_en: 'Donation Campaigns' },
  content: { icon: Play, label_fr: 'Contenu média', label_en: 'Media Content' },
  photos: { icon: Camera, label_fr: 'Photos', label_en: 'Photos' },
  events: { icon: CalendarDays, label_fr: 'Événements', label_en: 'Events' },
};

export function OrgAdminToolbar({
  orgId, orgSlug, isOwner, affiliationEnabled,
  pageSettings, onStartTour, onToggleAffiliation,
}: OrgAdminToolbarProps) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { toast } = useToast();
  const upsert = useUpsertOrgPageSettings();
  const [sectionPanelOpen, setSectionPanelOpen] = useState(false);

  const sectionOrder = pageSettings?.section_order || ['products', 'campaigns', 'content', 'photos', 'events'];
  const hiddenSections = pageSettings?.hidden_sections || [];

  const moveSection = async (section: string, direction: 'up' | 'down') => {
    const arr = [...sectionOrder];
    const idx = arr.indexOf(section);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    await upsert.mutateAsync({ orgId, updates: { section_order: arr } });
  };

  const toggleSectionVisibility = async (section: string) => {
    const hidden = hiddenSections.includes(section)
      ? hiddenSections.filter(s => s !== section)
      : [...hiddenSections, section];
    await upsert.mutateAsync({ orgId, updates: { hidden_sections: hidden } });
  };

  const isFr = locale === 'fr';

  return (
    <>
      {/* Floating toolbar */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex flex-col gap-2 items-end">
        {/* Help button */}
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 rounded-full shadow-elevated bg-card border-border"
          onClick={onStartTour}
          title={isFr ? "Aide interactive" : "Interactive help"}
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Main admin panel trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-elevated gap-2 h-12 px-5 bg-primary text-primary-foreground"
            >
              <Settings className="h-4 w-4" />
              {isFr ? 'Gérer ma page' : 'Manage page'}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-lg">{isFr ? '⚙️ Gérer ma page' : '⚙️ Manage my page'}</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 mt-6">
              {/* Quick Actions */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {isFr ? 'Actions rapides' : 'Quick Actions'}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <QuickAction
                    icon={Image}
                    label={isFr ? 'Modifier bannière' : 'Edit banner'}
                    onClick={() => navigate(`/admin/settings`)}
                  />
                  <QuickAction
                    icon={Image}
                    label={isFr ? 'Modifier logo' : 'Edit logo'}
                    onClick={() => navigate(`/admin/settings`)}
                  />
                  <QuickAction
                    icon={FileText}
                    label={isFr ? 'Modifier description' : 'Edit description'}
                    onClick={() => navigate(`/admin/settings`)}
                  />
                  <QuickAction
                    icon={ShoppingBag}
                    label={isFr ? 'Ajouter produit' : 'Add product'}
                    onClick={() => navigate(`/admin/products/new`)}
                  />
                  <QuickAction
                    icon={Play}
                    label={isFr ? 'Ajouter contenu' : 'Add content'}
                    onClick={() => navigate(`/admin/media/new`)}
                  />
                  <QuickAction
                    icon={CalendarDays}
                    label={isFr ? 'Ajouter événement' : 'Add event'}
                    onClick={() => navigate(`/admin/events/new`)}
                  />
                  <QuickAction
                    icon={Heart}
                    label={isFr ? 'Ajouter campagne' : 'Add campaign'}
                    onClick={() => navigate(`/admin/campaigns/new`)}
                  />
                  <QuickAction
                    icon={Camera}
                    label={isFr ? 'Ajouter photos' : 'Add photos'}
                    onClick={() => navigate(`/admin/photos`)}
                  />
                </div>
              </section>

              {/* Section Management */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {isFr ? 'Organiser les sections' : 'Organize sections'}
                </h3>
                <div className="space-y-1.5">
                  {sectionOrder.map((section, idx) => {
                    const meta = SECTION_META[section];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const isHidden = hiddenSections.includes(section);
                    return (
                      <div
                        key={section}
                        className={cn(
                          'flex items-center gap-2 p-2.5 rounded-xl border transition-colors',
                          isHidden ? 'border-border/50 bg-muted/30 opacity-60' : 'border-border bg-card'
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="flex-1 text-sm font-medium truncate">
                          {isFr ? meta.label_fr : meta.label_en}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30"
                            disabled={idx === 0}
                            onClick={() => moveSection(section, 'up')}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30"
                            disabled={idx === sectionOrder.length - 1}
                            onClick={() => moveSection(section, 'down')}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted"
                            onClick={() => toggleSectionVisibility(section)}
                            title={isHidden ? (isFr ? 'Afficher' : 'Show') : (isFr ? 'Masquer' : 'Hide')}
                          >
                            {isHidden ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Affiliation Toggle */}
              {isOwner && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {isFr ? 'Programme d\'affiliation' : 'Affiliate Program'}
                  </h3>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {isFr ? 'Affiliation activée' : 'Affiliation enabled'}
                      </span>
                    </div>
                    <Switch checked={affiliationEnabled} onCheckedChange={onToggleAffiliation} />
                  </div>
                </section>
              )}

              {/* Go to full admin */}
              <section>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="h-4 w-4" />
                  {isFr ? 'Gestion complète' : 'Full management'}
                </Button>
              </section>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
    >
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </button>
  );
}
