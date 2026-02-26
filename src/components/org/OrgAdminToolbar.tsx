import { useState, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Settings, Image, FileText, Play, CalendarDays,
  Heart, ShoppingBag, Eye, EyeOff, GripVertical, HandHeart,
  HelpCircle, Camera, Link2, Palette, Check, ChevronDown, ChevronUp, Plus
} from 'lucide-react';
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
  campaigns: { icon: Heart, label_fr: 'Campagnes de collecte', label_en: 'Fundraising Campaigns' },
  offerings: { icon: HandHeart, label_fr: 'Dons', label_en: 'Donations' },
  content: { icon: Play, label_fr: 'Contenu média', label_en: 'Media Content' },
  photos: { icon: Camera, label_fr: 'Photos', label_en: 'Photos' },
  events: { icon: CalendarDays, label_fr: 'Événements', label_en: 'Events' },
};

const PRESET_COLORS = [
  { name: 'Blue', value: '220 80% 50%' },
  { name: 'Indigo', value: '240 70% 55%' },
  { name: 'Purple', value: '270 70% 55%' },
  { name: 'Pink', value: '330 75% 55%' },
  { name: 'Red', value: '0 75% 55%' },
  { name: 'Orange', value: '25 90% 52%' },
  { name: 'Amber', value: '38 92% 50%' },
  { name: 'Green', value: '142 70% 45%' },
  { name: 'Teal', value: '172 66% 40%' },
  { name: 'Cyan', value: '192 80% 45%' },
  { name: 'Slate', value: '215 20% 45%' },
  { name: 'Rose', value: '350 70% 55%' },
];

const ACCENT_COLORS = [
  { name: 'Gold', value: '45 90% 55%' },
  { name: 'Amber', value: '38 92% 50%' },
  { name: 'Lime', value: '82 80% 45%' },
  { name: 'Emerald', value: '160 84% 39%' },
  { name: 'Cyan', value: '192 80% 45%' },
  { name: 'Sky', value: '200 98% 48%' },
  { name: 'Violet', value: '263 70% 55%' },
  { name: 'Pink', value: '330 80% 60%' },
  { name: 'Rose', value: '350 70% 55%' },
  { name: 'Coral', value: '16 85% 60%' },
  { name: 'Silver', value: '220 10% 65%' },
  { name: 'Warm', value: '30 60% 55%' },
];

export function OrgAdminToolbar({
  orgId, orgSlug, isOwner, affiliationEnabled,
  pageSettings, onStartTour, onToggleAffiliation,
}: OrgAdminToolbarProps) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { toast } = useToast();
  const upsert = useUpsertOrgPageSettings();
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [colorsOpen, setColorsOpen] = useState(false);

  const sectionOrder = pageSettings?.section_order || ['products', 'offerings', 'campaigns', 'content', 'photos', 'events'];
  const hiddenSections = pageSettings?.hidden_sections || [];
  const currentPrimary = pageSettings?.theme_primary_color || '220 80% 50%';
  const currentAccent = pageSettings?.theme_accent_color || '45 90% 55%';
  const isFr = locale === 'fr';

  const handleDragStart = (e: DragEvent, section: string) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', section);
  };
  const handleDragOver = (e: DragEvent, section: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (section !== draggedSection) setDragOverSection(section);
  };
  const handleDragLeave = () => setDragOverSection(null);
  const handleDrop = async (e: DragEvent, targetSection: string) => {
    e.preventDefault();
    setDragOverSection(null);
    if (!draggedSection || draggedSection === targetSection) { setDraggedSection(null); return; }
    const arr = [...sectionOrder];
    const fromIdx = arr.indexOf(draggedSection);
    const toIdx = arr.indexOf(targetSection);
    if (fromIdx < 0 || toIdx < 0) return;
    arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, draggedSection);
    setDraggedSection(null);
    await upsert.mutateAsync({ orgId, updates: { section_order: arr } });
    toast({ title: isFr ? 'Ordre mis à jour ✓' : 'Order updated ✓' });
  };
  const handleDragEnd = () => { setDraggedSection(null); setDragOverSection(null); };

  const toggleSectionVisibility = async (section: string) => {
    const hidden = hiddenSections.includes(section)
      ? hiddenSections.filter(s => s !== section)
      : [...hiddenSections, section];
    await upsert.mutateAsync({ orgId, updates: { hidden_sections: hidden } });
  };

  const setThemeColor = async (field: 'theme_primary_color' | 'theme_accent_color', value: string) => {
    await upsert.mutateAsync({ orgId, updates: { [field]: value } });
    toast({ title: isFr ? 'Couleur mise à jour ✓' : 'Color updated ✓' });
  };

  return (
    <div className="space-y-5">
      {/* Gestion complète — TOP */}
      <Button className="w-full gap-2" onClick={() => navigate('/admin')}>
        <Settings className="h-4 w-4" />
        {isFr ? 'Gestion complète' : 'Full management'}
      </Button>

      {/* Quick Actions */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {isFr ? 'Actions rapides' : 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction icon={Image} label={isFr ? 'Modifier bannière' : 'Edit banner'} onClick={() => navigate(`/admin/settings`)} />
          <QuickAction icon={Image} label={isFr ? 'Modifier logo' : 'Edit logo'} onClick={() => navigate(`/admin/settings`)} />
          <QuickAction icon={FileText} label={isFr ? 'Modifier description' : 'Edit description'} onClick={() => navigate(`/admin/settings`)} />
          <QuickAction icon={ShoppingBag} label={isFr ? 'Ajouter produit' : 'Add product'} onClick={() => navigate(`/admin/products/new`)} />
          <QuickAction icon={Play} label={isFr ? 'Ajouter contenu' : 'Add content'} onClick={() => navigate(`/admin/media/new`)} />
          <QuickAction icon={CalendarDays} label={isFr ? 'Ajouter événement' : 'Add event'} onClick={() => navigate(`/admin/events/new`)} />
          <QuickAction icon={Heart} label={isFr ? 'Ajouter campagne' : 'Add campaign'} onClick={() => navigate(`/admin/campaigns/new`)} />
          <QuickAction icon={Camera} label={isFr ? 'Ajouter photos' : 'Add photos'} onClick={() => navigate(`/admin/photos`)} />
        </div>
      </section>

      {/* Section Management */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {isFr ? 'Organiser les sections' : 'Organize sections'}
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          {isFr ? '↕ Glissez-déposez pour réorganiser' : '↕ Drag and drop to reorder'}
        </p>
        <div className="space-y-1.5">
          {sectionOrder.map((section) => {
            const meta = SECTION_META[section];
            if (!meta) return null;
            const Icon = meta.icon;
            const isHidden = hiddenSections.includes(section);
            const isDragging = draggedSection === section;
            const isDragOver = dragOverSection === section;
            return (
              <div
                key={section}
                draggable
                onDragStart={(e) => handleDragStart(e, section)}
                onDragOver={(e) => handleDragOver(e, section)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, section)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing',
                  isHidden ? 'border-border/50 bg-muted/30 opacity-60' : 'border-border bg-card',
                  isDragging && 'opacity-40 scale-95',
                  isDragOver && 'border-primary bg-primary/5 scale-[1.02]'
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 text-sm font-medium truncate">
                  {isFr ? meta.label_fr : meta.label_en}
                </span>
                <button
                  className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  onClick={() => toggleSectionVisibility(section)}
                  title={isHidden ? (isFr ? 'Afficher' : 'Show') : (isFr ? 'Masquer' : 'Hide')}
                >
                  {isHidden ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Affiliation Toggle — visible directly */}
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

      {/* Color Customization — collapsible */}
      <section>
        <button
          onClick={() => setColorsOpen(!colorsOpen)}
          className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            {isFr ? 'Personnaliser les couleurs' : 'Customize colors'}
          </span>
          {colorsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {colorsOpen && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">
                {isFr ? 'Couleur principale' : 'Primary color'}
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setThemeColor('theme_primary_color', color.value)}
                    className={cn(
                      'h-8 w-full rounded-lg border-2 transition-all hover:scale-110 relative',
                      currentPrimary === color.value ? 'border-foreground ring-1 ring-foreground/20' : 'border-transparent'
                    )}
                    style={{ backgroundColor: `hsl(${color.value})` }}
                    title={color.name}
                  >
                    {currentPrimary === color.value && (
                      <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">
                {isFr ? 'Couleur d\'accent' : 'Accent color'}
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setThemeColor('theme_accent_color', color.value)}
                    className={cn(
                      'h-8 w-full rounded-lg border-2 transition-all hover:scale-110 relative',
                      currentAccent === color.value ? 'border-foreground ring-1 ring-foreground/20' : 'border-transparent'
                    )}
                    style={{ backgroundColor: `hsl(${color.value})` }}
                    title={color.name}
                  >
                    {currentAccent === color.value && (
                      <Check className="h-3.5 w-3.5 text-white absolute inset-0 m-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/30">
              <p className="text-[11px] text-muted-foreground mb-2">{isFr ? 'Aperçu' : 'Preview'}</p>
              <div className="flex items-center gap-2">
                <div className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: `hsl(${currentPrimary})` }}>
                  {isFr ? 'Bouton primaire' : 'Primary button'}
                </div>
                <div className="h-8 flex-1 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: `hsl(${currentAccent})`, color: 'hsl(222 47% 8%)' }}>
                  {isFr ? 'Accent' : 'Accent'}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Help button */}
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={onStartTour}>
        <HelpCircle className="h-4 w-4" />
        {isFr ? 'Aide interactive' : 'Interactive help'}
      </Button>
    </div>
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
