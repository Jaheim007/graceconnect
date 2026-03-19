import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Globe } from 'lucide-react';

interface ProductSEOSettingsProps {
  seoTitle: string;
  seoDescription: string;
  slug?: string;
  productTitle: string;
  onChange: (field: 'seo_title' | 'seo_description', value: string) => void;
}

export function ProductSEOSettings({ seoTitle, seoDescription, slug, productTitle, onChange }: ProductSEOSettingsProps) {
  const titleLen = (seoTitle || '').length;
  const descLen = (seoDescription || '').length;
  const previewTitle = seoTitle || productTitle || 'Titre du produit';
  const previewUrl = `siteviral.com/p/${slug || 'mon-produit'}`;
  const previewDesc = seoDescription || 'Description de votre produit digital...';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Search className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">SEO & Référencement</h3>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Titre SEO</Label>
        <Input
          value={seoTitle}
          onChange={e => onChange('seo_title', e.target.value)}
          placeholder={productTitle || 'Titre optimisé pour Google'}
          className="h-8 text-xs"
          maxLength={70}
        />
        <div className="flex justify-between">
          <p className="text-[10px] text-muted-foreground">Idéalement 50-60 caractères</p>
          <Badge variant="outline" className={`text-[10px] border-0 ${titleLen > 60 ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {titleLen}/60
          </Badge>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description SEO</Label>
        <Textarea
          value={seoDescription}
          onChange={e => onChange('seo_description', e.target.value)}
          placeholder="Décrivez votre produit pour les moteurs de recherche..."
          className="text-xs min-h-[60px]"
          maxLength={170}
        />
        <div className="flex justify-between">
          <p className="text-[10px] text-muted-foreground">Idéalement 120-160 caractères</p>
          <Badge variant="outline" className={`text-[10px] border-0 ${descLen > 160 ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {descLen}/160
          </Badge>
        </div>
      </div>

      {/* Google Preview */}
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> Aperçu Google</Label>
        <div className="bg-background border border-border rounded-lg p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground truncate">{previewUrl}</p>
          <p className="text-sm text-blue-600 font-medium truncate">{previewTitle}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{previewDesc}</p>
        </div>
      </div>
    </div>
  );
}
