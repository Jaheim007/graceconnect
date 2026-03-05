import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Image as ImageIcon, Loader2, Palette, Upload as UploadIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageCropDialog } from '@/components/ui/ImageCropDialog';
import { compressImage } from '@/hooks/useImageOptimizer';
import { useCanvaAuth } from '@/hooks/useCanvaAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'free' | 'book';
  disableCrop?: boolean;
  showCanva?: boolean;
}

const ASPECT_MAP = { square: 1, video: 16 / 9, banner: 3 / 1, book: 2 / 3, free: undefined } as const;

const DIMENSION_HINTS: Record<string, string> = {
  square: 'Recommandé : 500×500 px',
  video: 'Recommandé : 1280×720 px',
  banner: 'Recommandé : 1200×400 px',
  book: 'Recommandé : 600×900 px',
  free: 'Max 10 Mo · JPG, PNG, WEBP',
};

const CANVA_DIMENSIONS: Record<string, { width: number; height: number }> = {
  square: { width: 1000, height: 1000 },
  video: { width: 1280, height: 720 },
  banner: { width: 1200, height: 400 },
  book: { width: 600, height: 900 },
  free: { width: 1280, height: 720 },
};

export function ImageUploader({
  value,
  onChange,
  folder = 'misc',
  label = 'Image',
  hint,
  aspectRatio = 'video',
  disableCrop = false,
  showCanva = true,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvaDesigning, setCanvaDesigning] = useState(false);
  const { toast } = useToast();

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Canva
  const { isConnected: canvaConnected, startAuth: canvaStartAuth, getValidToken: getCanvaToken, loading: canvaLoading } = useCanvaAuth();

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
    book: 'aspect-[2/3]',
    free: 'aspect-video',
  }[aspectRatio];

  const handleFileSelected = async (rawFile: File) => {
    if (!rawFile) return;
    if (rawFile.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }
    if (!rawFile.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }
    setError(null);

    const file = await compressImage(rawFile);

    if (disableCrop) {
      setUploading(true);
      try {
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop() || 'jpg'}`;
        const { error: uploadError } = await supabase.storage
          .from('org-uploads')
          .upload(fileName, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('org-uploads').getPublicUrl(fileName);
        onChange(data.publicUrl);
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    } else {
      const url = URL.createObjectURL(file);
      setCropSrc(url);
    }
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    try {
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('org-uploads')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('org-uploads').getPublicUrl(fileName);
      onChange(data.publicUrl);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Canva: create design ──
  const openCanvaDesign = useCallback(async () => {
    sessionStorage.setItem('canva_return_to', window.location.pathname);

    if (!canvaConnected) {
      try {
        await canvaStartAuth();
      } catch (e: any) {
        toast({ title: 'Erreur Canva', description: e.message, variant: 'destructive' });
      }
      return;
    }

    setCanvaDesigning(true);
    try {
      const token = await getCanvaToken();
      if (!token) {
        toast({ title: 'Session Canva expirée', description: 'Reconnectez-vous à Canva.', variant: 'destructive' });
        return;
      }

      const dims = CANVA_DIMENSIONS[aspectRatio] || CANVA_DIMENSIONS.free;
      const { data, error } = await supabase.functions.invoke('canva-design', {
        body: {
          action: 'create',
          canva_token: token,
          title: `Design — ${label}`,
          width: dims.width,
          height: dims.height,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Échec création design Canva');

      if (data.edit_url) {
        window.open(data.edit_url, '_blank');
        // Store design_id keyed by folder to allow multiple contexts
        const canvaKey = `canva_design_${folder}_${Date.now()}`;
        sessionStorage.setItem('canva_active_design', canvaKey);
        sessionStorage.setItem(canvaKey, data.design_id);
        toast({
          title: '🎨 Design Canva créé',
          description: 'Éditez votre design dans Canva, puis cliquez "Importer depuis Canva" ici.',
        });
      }
    } catch (e: any) {
      toast({ title: 'Erreur Canva', description: e.message, variant: 'destructive' });
    } finally {
      setCanvaDesigning(false);
    }
  }, [canvaConnected, canvaStartAuth, getCanvaToken, aspectRatio, folder, label, toast]);

  // ── Canva: export and import design ──
  const exportCanvaDesign = useCallback(async () => {
    const activeKey = sessionStorage.getItem('canva_active_design');
    const designId = activeKey ? sessionStorage.getItem(activeKey) : null;
    if (!designId) {
      toast({ title: 'Aucun design Canva', description: 'Créez d\'abord un design avec Canva.', variant: 'destructive' });
      return;
    }

    setCanvaDesigning(true);
    try {
      const token = await getCanvaToken();
      if (!token) {
        toast({ title: 'Session Canva expirée', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('canva-design', {
        body: { action: 'export', canva_token: token, design_id: designId },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Export échoué');

      onChange(data.cover_url);
      if (activeKey) {
        sessionStorage.removeItem(activeKey);
        sessionStorage.removeItem('canva_active_design');
      }
      toast({ title: '✅ Design Canva importé !' });
    } catch (e: any) {
      toast({ title: 'Erreur export', description: e.message, variant: 'destructive' });
    } finally {
      setCanvaDesigning(false);
    }
  }, [getCanvaToken, onChange, toast]);

  const hasActiveDesign = !!sessionStorage.getItem('canva_active_design');

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium leading-none">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {!hint && <p className="text-xs text-muted-foreground">{DIMENSION_HINTS[aspectRatio] || DIMENSION_HINTS.free}</p>}
      <div
        className={cn(
          'relative w-full rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden transition-colors hover:border-primary/50 cursor-pointer',
          aspectClass
        )}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium">Cliquez pour importer</p>
                <p className="text-[10px]">JPG, PNG, WEBP · Max 10 Mo</p>
              </>
            )}
          </div>
        )}
        {uploading && value && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Canva buttons */}
      {showCanva && (
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-7 gap-1"
            onClick={(e) => { e.preventDefault(); openCanvaDesign(); }}
            disabled={canvaDesigning || canvaLoading}
          >
            {canvaDesigning && !hasActiveDesign ? <Loader2 className="h-3 w-3 animate-spin" /> : <Palette className="h-3 w-3" />}
            {canvaConnected ? 'Créer avec Canva' : 'Connecter Canva'}
          </Button>
          {hasActiveDesign && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-7 gap-1 border-primary/30 text-primary"
              onClick={(e) => { e.preventDefault(); exportCanvaDesign(); }}
              disabled={canvaDesigning}
            >
              {canvaDesigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <UploadIcon className="h-3 w-3" />}
              Importer depuis Canva
            </Button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); e.target.value = ''; }}
      />
      {value && !value.startsWith('blob:') && (
        <p className="text-[10px] text-muted-foreground truncate">📎 {value}</p>
      )}

      {/* Crop Dialog */}
      {cropSrc && (
        <ImageCropDialog
          open={!!cropSrc}
          imageSrc={cropSrc}
          aspect={ASPECT_MAP[aspectRatio]}
          onClose={() => setCropSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
