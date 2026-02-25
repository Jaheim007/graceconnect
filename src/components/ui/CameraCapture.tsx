import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera, RotateCcw, Check, X, Loader2, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  bucket?: 'org-uploads' | 'private-products';
}

export function CameraCapture({
  value,
  onChange,
  folder = 'captures',
  label = 'Photo',
  hint,
  bucket = 'org-uploads',
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setError(null);
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setCapturedImage(null);
    } catch (err: any) {
      console.error('Camera error:', err);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (cameraActive) {
      startCamera(newFacing);
    }
  }, [facingMode, cameraActive, startCamera]);

  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();

    // Upload immediately
    setUploading(true);
    setError(null);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `${folder}/${Date.now()}-capture.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      if (bucket === 'private-products') {
        const fullUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`;
        onChange(fullUrl);
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        onChange(data.publicUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Échec du téléchargement');
      setCapturedImage(null);
    } finally {
      setUploading(false);
    }
  }, [folder, bucket, onChange, stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    onChange('');
    startCamera();
  }, [onChange, startCamera]);

  const clear = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onChange('');
  }, [stopCamera, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium leading-none">{label}</p>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div className="relative w-full rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden">
        {/* Camera active */}
        {cameraActive && !capturedImage && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-[280px] object-cover rounded-xl"
            />
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-background/80 backdrop-blur"
                onClick={switchCamera}
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
                onClick={takePhoto}
              >
                <Camera className="h-6 w-6 text-primary-foreground" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-background/80 backdrop-blur"
                onClick={stopCamera}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Captured / uploaded image preview */}
        {capturedImage && !cameraActive && (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Photo capturée"
              className="w-full h-[280px] object-cover rounded-xl"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {!uploading && (
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="bg-background/80 backdrop-blur"
                  onClick={retake}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reprendre
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="bg-destructive/80 backdrop-blur"
                  onClick={clear}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Value from server (already uploaded) but no local capture */}
        {!capturedImage && !cameraActive && value && (
          <div className="relative">
            <img
              src={value}
              alt="Photo uploadée"
              className="w-full h-[280px] object-cover rounded-xl"
            />
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="bg-background/80 backdrop-blur"
                onClick={retake}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Reprendre
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="bg-destructive/80 backdrop-blur"
                onClick={clear}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {/* Empty state — start camera */}
        {!cameraActive && !capturedImage && !value && (
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-3 py-10 cursor-pointer hover:border-primary/50 transition-colors'
            )}
            onClick={() => startCamera()}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Appuyez pour prendre une photo</p>
              <p className="text-[10px] text-muted-foreground">La caméra de votre appareil sera activée</p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
