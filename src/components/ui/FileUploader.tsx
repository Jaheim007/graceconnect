import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { brandUrl } from '@/lib/storageUrl';
import { Upload, X, File as FileIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FileUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  accept?: string;
  bucket?: 'org-uploads' | 'private-products';
  hideUrlMode?: boolean;
}

export function FileUploader({
  value,
  onChange,
  folder = 'products',
  label = 'File',
  hint,
  accept = '*/*',
  bucket = 'org-uploads',
  hideUrlMode = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>(value && value.startsWith('http') ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(value || '');

  // Allowed MIME types for upload security
  const ALLOWED_MIMES = new Set([
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/aac',
    'video/mp4', 'video/webm', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/zip', 'application/x-zip-compressed',
    'text/plain', 'text/csv',
  ]);

  const handleFile = async (file: File) => {
    if (!file) return;
    const MAX = 50 * 1024 * 1024; // 50 MB — Supabase Storage limit
    if (file.size > MAX) {
      setError('Fichier trop volumineux. Maximum 50 Mo.');
      return;
    }
    // MIME type validation
    if (!ALLOWED_MIMES.has(file.type)) {
      setError(`Type de fichier non autorisé : ${file.type || 'inconnu'}. Formats acceptés : PDF, Word, PowerPoint, Excel, Audio, Vidéo, Images.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileName = `${folder}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      if (bucket === 'private-products') {
        // For private bucket, store the path reference (served via signed URLs)
        const fullUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`;
        onChange(fullUrl);
        setUrlInput(fullUrl);
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        onChange(brandUrl(data.publicUrl));
        setUrlInput(brandUrl(data.publicUrl));
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fileName = value
    ? value.split('/').pop()?.split('?')[0] || 'File uploaded'
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium leading-none">{label}</p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === 'upload' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => setMode('upload')}
          >
            <Upload className="h-3 w-3 mr-1" /> Upload
          </Button>
          {!hideUrlMode && (
            <Button
              type="button"
              variant={mode === 'url' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setMode('url')}
            >
              <LinkIcon className="h-3 w-3 mr-1" /> URL
            </Button>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {mode === 'upload' ? (
        <div
          className={cn(
            'relative w-full rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden transition-colors hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center gap-2 py-6',
            uploading && 'pointer-events-none opacity-70'
          )}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </>
          ) : value ? (
            <>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileIcon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs font-medium text-center px-4 truncate max-w-xs">{fileName}</p>
              <button
                type="button"
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={(e) => { e.stopPropagation(); onChange(''); setUrlInput(''); }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                <Upload className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium">Click to upload file</p>
              <p className="text-[10px] text-muted-foreground">PDF, Word, PowerPoint, Audio, Video · Max 50 Mo</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://drive.google.com/... or direct link"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { onChange(urlInput); }}
            disabled={!urlInput}
          >
            Set
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
