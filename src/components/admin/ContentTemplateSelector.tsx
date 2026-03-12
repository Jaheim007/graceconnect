import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { productTemplates, campaignTemplates, type ProductTemplate, type CampaignTemplate } from '@/lib/contentTemplates';
import { FileText, Heart, Sparkles } from 'lucide-react';

type TemplateType = 'product' | 'campaign';

interface Props {
  type: TemplateType;
  open: boolean;
  onClose: () => void;
  onSelect: (template: ProductTemplate | CampaignTemplate) => void;
}

export function ContentTemplateSelector({ type, open, onClose, onSelect }: Props) {
  const templates = type === 'product' ? productTemplates : campaignTemplates;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {type === 'product' ? 'Choisir un modèle de produit' : 'Choisir un modèle de campagne'}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un modèle pré-rempli, puis personnalisez-le selon vos besoins.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6 pb-6">
          <div className="space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onMouseEnter={() => setHoveredId(tpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => { onSelect(tpl); onClose(); }}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-150 ${
                  hoveredId === tpl.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{tpl.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{tpl.label}</span>
                    {'category' in tpl && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{(tpl as ProductTemplate).category}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                  {'fields' in tpl && 'price' in tpl.fields && (
                    <p className="text-[10px] text-primary font-medium mt-1">
                      {(tpl as ProductTemplate).fields.is_free ? '🎁 Gratuit' : `💰 ${(tpl as ProductTemplate).fields.price.toLocaleString()} ${(tpl as ProductTemplate).fields.currency || 'XOF'}`}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full text-xs">
            {type === 'product' ? <FileText className="h-3.5 w-3.5 mr-1.5" /> : <Heart className="h-3.5 w-3.5 mr-1.5" />}
            Commencer avec une page vierge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
