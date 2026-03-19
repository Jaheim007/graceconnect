import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical, Trash2, ChevronUp, ChevronDown, Type, Image, Star, MessageSquare, Shield, List, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type SectionType = 'hero' | 'features' | 'testimonials' | 'faq' | 'guarantee' | 'video' | 'text' | 'image_gallery';

interface Section {
  id: string;
  type: SectionType;
  data: Record<string, any>;
}

const SECTION_TYPES = [
  { value: 'hero' as const, label: 'Hero / En-tête', icon: Type, desc: 'Titre principal + sous-titre + CTA' },
  { value: 'features' as const, label: 'Caractéristiques', icon: List, desc: 'Liste de fonctionnalités ou avantages' },
  { value: 'testimonials' as const, label: 'Témoignages', icon: MessageSquare, desc: 'Avis et retours clients' },
  { value: 'faq' as const, label: 'FAQ', icon: Star, desc: 'Questions fréquentes' },
  { value: 'guarantee' as const, label: 'Garantie', icon: Shield, desc: 'Garantie et réassurance' },
  { value: 'video' as const, label: 'Vidéo', icon: Video, desc: "Vidéo d'introduction ou démo" },
  { value: 'text' as const, label: 'Texte libre', icon: Type, desc: 'Paragraphe ou bloc de texte' },
  { value: 'image_gallery' as const, label: 'Galerie images', icon: Image, desc: 'Carrousel ou grille de visuels' },
];

interface SalesPageBuilderProps {
  sections: Section[];
  onChange: (sections: Section[]) => void;
}

function SectionEditor({ section, onChange, onRemove }: { section: Section; onChange: (data: Record<string, any>) => void; onRemove: () => void }) {
  const d = section.data;

  const updateField = (key: string, value: any) => {
    onChange({ ...d, [key]: value });
  };

  return (
    <div className="space-y-3">
      {section.type === 'hero' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Titre principal</Label>
            <Input value={d.headline || ''} onChange={e => updateField('headline', e.target.value)} placeholder="Transformez votre vie avec..." className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sous-titre</Label>
            <Textarea value={d.subheadline || ''} onChange={e => updateField('subheadline', e.target.value)} placeholder="Une courte accroche..." className="text-xs min-h-[50px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Texte du bouton CTA</Label>
            <Input value={d.cta_text || ''} onChange={e => updateField('cta_text', e.target.value)} placeholder="Acheter maintenant →" className="h-8 text-xs" />
          </div>
        </>
      )}
      {section.type === 'features' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Caractéristiques (une par ligne)</Label>
          <Textarea
            value={d.features || ''}
            onChange={e => updateField('features', e.target.value)}
            placeholder={"✅ Accès à vie\n✅ 50+ pages de contenu\n✅ Bonus exclusifs"}
            className="text-xs min-h-[80px] font-mono"
          />
        </div>
      )}
      {section.type === 'testimonials' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Témoignages (JSON simplifié)</Label>
          <Textarea
            value={d.items || ''}
            onChange={e => updateField('items', e.target.value)}
            placeholder={'Nom: Jean D. | Texte: Excellent produit !\nNom: Marie K. | Texte: Je recommande à 100%'}
            className="text-xs min-h-[80px] font-mono"
          />
        </div>
      )}
      {section.type === 'faq' && (
        <div className="space-y-1.5">
          <Label className="text-xs">FAQ (Question? Réponse. Une paire par ligne)</Label>
          <Textarea
            value={d.items || ''}
            onChange={e => updateField('items', e.target.value)}
            placeholder={"Est-ce remboursable? Oui, 30 jours.\nComment accéder? Lien envoyé par email."}
            className="text-xs min-h-[80px] font-mono"
          />
        </div>
      )}
      {section.type === 'guarantee' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Texte de garantie</Label>
          <Textarea value={d.text || ''} onChange={e => updateField('text', e.target.value)} placeholder="Garantie satisfait ou remboursé 30 jours..." className="text-xs min-h-[60px]" />
        </div>
      )}
      {section.type === 'video' && (
        <div className="space-y-1.5">
          <Label className="text-xs">URL de la vidéo (YouTube/Vimeo)</Label>
          <Input value={d.video_url || ''} onChange={e => updateField('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." className="h-8 text-xs" />
        </div>
      )}
      {section.type === 'text' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Contenu texte</Label>
          <Textarea value={d.content || ''} onChange={e => updateField('content', e.target.value)} placeholder="Votre texte ici..." className="text-xs min-h-[80px]" />
        </div>
      )}
      {section.type === 'image_gallery' && (
        <div className="space-y-1.5">
          <Label className="text-xs">URLs des images (une par ligne)</Label>
          <Textarea value={d.images || ''} onChange={e => updateField('images', e.target.value)} placeholder="https://example.com/img1.jpg" className="text-xs min-h-[60px] font-mono" />
        </div>
      )}
    </div>
  );
}

export function SalesPageBuilder({ sections, onChange }: SalesPageBuilderProps) {
  const [addingType, setAddingType] = useState<SectionType | null>(null);

  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      data: {},
    };
    onChange([...sections, newSection]);
    setAddingType(null);
  };

  const removeSection = (id: string) => {
    onChange(sections.filter(s => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    onChange(newSections);
  };

  const updateSectionData = (id: string, data: Record<string, any>) => {
    onChange(sections.map(s => s.id === id ? { ...s, data } : s));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Builder de page de vente</h3>
      </div>

      <AnimatePresence>
        {sections.map((section, i) => {
          const typeInfo = SECTION_TYPES.find(t => t.value === section.type);
          const Icon = typeInfo?.icon || Type;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold flex-1">{typeInfo?.label}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSection(i, 'up')} disabled={i === 0}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSection(i, 'down')} disabled={i === sections.length - 1}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSection(section.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <SectionEditor section={section} onChange={data => updateSectionData(section.id, data)} onRemove={() => removeSection(section.id)} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add section */}
      {addingType === null ? (
        <Button variant="outline" size="sm" className="w-full border-dashed gap-1.5" onClick={() => setAddingType('hero')}>
          <Plus className="h-3.5 w-3.5" /> Ajouter une section
        </Button>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Label className="text-xs">Choisir le type de section</Label>
          <div className="grid grid-cols-2 gap-2">
            {SECTION_TYPES.map(st => (
              <button
                key={st.value}
                onClick={() => addSection(st.value)}
                className="p-3 rounded-lg border border-border bg-background hover:bg-muted text-left transition-all space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <st.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">{st.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{st.desc}</p>
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAddingType(null)}>Annuler</Button>
        </div>
      )}

      {sections.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Ajoutez des sections pour construire votre page de vente personnalisée.
        </p>
      )}
    </div>
  );
}
