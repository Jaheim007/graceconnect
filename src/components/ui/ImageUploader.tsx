import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageCropDialog } from '@/components/ui/ImageCropDialog';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'free';
  disableCrop?: boolean;
}

const ASPECT_MAP = { square: 1, video: 16 / 9, banner: 3 / 1, free: undefined } as const;

export function ImageUploader({
  value,
  onChange,
  folder = 'misc',
  label = 'Image',
  hint,
  aspectRatio = 'video',
  disableCrop = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
    free: 'aspect-video',
  }[aspectRatio];

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }
    setError(null);

    if (disableCrop) {
      // Upload directly without cropping
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
      // Open crop dialog
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

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium leading-none">{label}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
                <p className="text-xs font-medium">Click to upload</p>
                <p className="text-[10px]">JPG, PNG, WEBP · Max 10MB</p>
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
