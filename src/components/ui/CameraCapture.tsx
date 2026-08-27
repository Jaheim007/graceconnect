import { useRef, useState, useCallback, useEffect } from 'react';
import { docLang } from '@/lib/doc-lang';
import { supabase } from '@/integrations/supabase/client';
import { brandUrl } from '@/lib/storageUrl';
import { Camera, RotateCcw, Check, X, Loader2, SwitchCamera, Smartphone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CaptureMode = 'document' | 'selfie' | 'free';

interface CameraCaptureProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  bucket?: 'org-uploads' | 'private-products' | 'kyc-documents';
  /** Controls the frame overlay shape: 'document' for ID/passport, 'selfie' for face oval, 'free' for no overlay */
  captureMode?: CaptureMode;
}

export function CameraCapture({
  value,
  onChange,
  folder = 'captures',
  label = 'Photo',
  hint,
  bucket = 'org-uploads',
  captureMode = 'free',
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // When video element mounts and we have a pending stream, attach it
  useEffect(() => {
    if (cameraActive && videoRef.current && pendingStreamRef.current) {
      const video = videoRef.current;
      video.srcObject = pendingStreamRef.current;
      video.play().catch(console.error);
      pendingStreamRef.current = null;
    }
  }, [cameraActive]);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setError(null);
    setCameraFailed(false);
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      // CRITICAL: getUserMedia called directly in click handler
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      pendingStreamRef.current = stream;

      // Set camera active AFTER getting the stream — video element will mount,
      // then useEffect will attach the stream
      setCameraActive(true);
      setCapturedImage(null);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraFailed(true);
      const lang = docLang();
      if (err.name === 'NotAllowedError') {
        setError(lang === 'fr' ? "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur." : "Camera access denied. Please allow access in your browser settings.");
      } else if (err.name === 'NotFoundError') {
        setError(lang === 'fr' ? "Aucune caméra détectée sur cet appareil." : "No camera detected on this device.");
      } else {
        setError(lang === 'fr' ? "Impossible d'accéder à la caméra. Essayez sur votre téléphone mobile." : "Cannot access camera. Try on your mobile phone.");
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    pendingStreamRef.current = null;
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

    // Wait for video to have actual dimensions
    const vw = video.videoWidth || video.clientWidth;
    const vh = video.videoHeight || video.clientHeight;
    if (vw === 0 || vh === 0) {
      setError("La caméra n'est pas encore prête. Réessayez.");
      return;
    }

    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0, vw, vh);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    
    // Stop camera FIRST, then show captured image
    stopCamera();
    setCapturedImage(dataUrl);

    // Upload
    setUploading(true);
    setError(null);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      let fileName = `${folder}/${Date.now()}-capture.jpg`;
      if (bucket === 'private-products') {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (!uid) throw new Error('Not authenticated');
        fileName = `${folder}/${uid}/${Date.now()}-capture.jpg`;
      } else if (bucket === 'kyc-documents') {
        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        if (!uid) throw new Error('Not authenticated');
        const sub = folder.replace(/^kyc\//, '').replace(/^\/+|\/+$/g, '');
        fileName = `kyc/${uid}/${sub ? `${sub}/` : ''}${Date.now()}-capture.jpg`;
      }
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      if (bucket === 'private-products' || bucket === 'kyc-documents') {
        const fullUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${fileName}`;
        onChange(fullUrl);
      } else {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        onChange(brandUrl(data.publicUrl));
      }
    } catch (err: any) {
      setError(err.message || 'Échec du téléchargement');
      // Keep the captured image visible even on upload error so user sees what was taken
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
    setCameraFailed(false);
    setError(null);
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
              className="w-full h-[320px] sm:h-[360px] object-cover rounded-xl bg-black"
            />
            {/* Frame overlay */}
            {captureMode === 'document' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Dark overlay with cutout */}
                <div className="absolute inset-0 bg-black/50 rounded-xl" />
                <div
                  className="relative border-2 border-white rounded-lg bg-transparent z-10"
                  style={{
                    width: 'min(85%, 420px)',
                    aspectRatio: '85.6 / 53.98', /* ISO/IEC 7810 ID-1 card ratio */
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Corner markers */}
                  <div className="absolute -top-px -left-px w-5 h-5 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
                  <div className="absolute -top-px -right-px w-5 h-5 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
                  <div className="absolute -bottom-px -left-px w-5 h-5 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
                  <div className="absolute -bottom-px -right-px w-5 h-5 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
                  <p className="absolute -bottom-7 left-0 right-0 text-center text-[11px] text-white/80 font-medium">
                    Cadrez votre document ici
                  </p>
                </div>
              </div>
            )}
            {captureMode === 'selfie' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/50 rounded-xl" />
                <div
                  className="relative border-2 border-white rounded-full bg-transparent z-10"
                  style={{
                    width: 'min(55%, 220px)',
                    aspectRatio: '3 / 4',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  }}
                />
                <p className="absolute bottom-16 left-0 right-0 text-center text-[11px] text-white/80 font-medium z-10">
                  Cadrez votre visage ici
                </p>
              </div>
            )}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 z-20">
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
        {!capturedImage && !cameraActive && value && !cameraFailed && (
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

        {/* Camera failed — show mobile fallback */}
        {!cameraActive && !capturedImage && !value && cameraFailed && (
          <div className="flex flex-col items-center justify-center gap-4 py-8 px-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Caméra indisponible</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {error || "Impossible d'accéder à la caméra sur cet appareil."}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startCamera()}
                className="w-full"
              >
                <Camera className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-muted/30 px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-primary">Utilisez votre téléphone</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Ouvrez ce lien sur votre téléphone mobile pour effectuer la vérification avec la caméra de votre appareil.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-xs text-muted-foreground"
            >
              Annuler
            </Button>
          </div>
        )}

        {/* Empty state — start camera */}
        {!cameraActive && !capturedImage && !value && !cameraFailed && (
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

      {error && !cameraFailed && <p className="text-xs text-destructive">{error}</p>}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
