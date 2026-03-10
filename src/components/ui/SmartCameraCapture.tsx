import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { brandUrl } from '@/lib/storageUrl';
import { Camera, RotateCcw, Check, X, Loader2, SwitchCamera, Smartphone, AlertTriangle, Scan, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CaptureMode = 'document' | 'selfie' | 'free';
type FrameStatus = 'searching' | 'adjusting' | 'ready' | 'captured';

interface SmartCameraCaptureProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  bucket?: 'org-uploads' | 'private-products' | 'kyc-documents';
  captureMode?: CaptureMode;
  /** Enable smart auto-capture when document/face is properly framed */
  smartCapture?: boolean;
}

const FRAME_MESSAGES: Record<FrameStatus, string> = {
  searching: 'Recherche du document…',
  adjusting: 'Ajustez la position du document',
  ready: '✓ Parfait ! Capture en cours…',
  captured: 'Photo capturée !',
};

const SELFIE_MESSAGES: Record<FrameStatus, string> = {
  searching: 'Recherche du visage…',
  adjusting: 'Centrez votre visage dans l\'ovale',
  ready: '✓ Parfait ! Capture en cours…',
  captured: 'Photo capturée !',
};

export function SmartCameraCapture({
  value,
  onChange,
  folder = 'captures',
  label = 'Photo',
  hint,
  bucket = 'org-uploads',
  captureMode = 'free',
  smartCapture = true,
}: SmartCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  const readyCountRef = useRef(0);
  const autoCapturedRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [frameStatus, setFrameStatus] = useState<FrameStatus>('searching');

  const messages = captureMode === 'selfie' ? SELFIE_MESSAGES : FRAME_MESSAGES;

  // Attach pending stream when video element mounts
  useEffect(() => {
    if (cameraActive && videoRef.current && pendingStreamRef.current) {
      const video = videoRef.current;
      video.srcObject = pendingStreamRef.current;
      video.play().catch(console.error);
      pendingStreamRef.current = null;
    }
  }, [cameraActive]);

  // Smart frame analysis
  useEffect(() => {
    if (!cameraActive || !smartCapture || captureMode === 'free') return;

    autoCapturedRef.current = false;
    readyCountRef.current = 0;
    setFrameStatus('searching');

    const analyzeFrame = () => {
      if (!videoRef.current || !analysisCanvasRef.current || autoCapturedRef.current) return;

      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;
      const vw = video.videoWidth || video.clientWidth;
      const vh = video.videoHeight || video.clientHeight;
      if (vw === 0 || vh === 0) return;

      // Downsample for performance
      const scale = 0.25;
      canvas.width = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Analyze frame region (center area matching the overlay)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const regionW = captureMode === 'document' ? canvas.width * 0.8 : canvas.width * 0.5;
      const regionH = captureMode === 'document' ? regionW * (53.98 / 85.6) : regionW * (4 / 3);
      const startX = Math.round(centerX - regionW / 2);
      const startY = Math.round(centerY - regionH / 2);
      const endX = Math.round(centerX + regionW / 2);
      const endY = Math.round(centerY + regionH / 2);

      let totalBrightness = 0;
      let edgeCount = 0;
      let pixelCount = 0;
      let contrastSum = 0;

      for (let y = Math.max(0, startY); y < Math.min(canvas.height, endY); y += 2) {
        for (let x = Math.max(0, startX); x < Math.min(canvas.width, endX); x += 2) {
          const i = (y * canvas.width + x) * 4;
          const gray = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
          totalBrightness += gray;
          pixelCount++;

          // Edge detection (simple Sobel-like)
          if (x > startX && y > startY) {
            const prevX = ((y) * canvas.width + (x - 2)) * 4;
            const prevY = ((y - 2) * canvas.width + (x)) * 4;
            const grayPrevX = pixels[prevX] * 0.299 + pixels[prevX + 1] * 0.587 + pixels[prevX + 2] * 0.114;
            const grayPrevY = pixels[prevY] * 0.299 + pixels[prevY + 1] * 0.587 + pixels[prevY + 2] * 0.114;
            const gradient = Math.abs(gray - grayPrevX) + Math.abs(gray - grayPrevY);
            if (gradient > 30) edgeCount++;
            contrastSum += gradient;
          }
        }
      }

      const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;
      const edgeDensity = pixelCount > 0 ? edgeCount / pixelCount : 0;
      const avgContrast = pixelCount > 0 ? contrastSum / pixelCount : 0;

      // Heuristic scoring
      const brightnessOk = avgBrightness > 60 && avgBrightness < 220;
      const hasContent = captureMode === 'document' 
        ? edgeDensity > 0.05 && avgContrast > 5
        : edgeDensity > 0.03; // Selfie has softer edges
      const isSharp = avgContrast > 3;

      if (!brightnessOk || !hasContent) {
        readyCountRef.current = 0;
        setFrameStatus(hasContent ? 'adjusting' : 'searching');
      } else if (!isSharp) {
        readyCountRef.current = 0;
        setFrameStatus('adjusting');
      } else {
        readyCountRef.current++;
        // Require 5 consecutive "ready" frames (~1.5s at 300ms intervals) before auto-capture
        if (readyCountRef.current >= 5) {
          setFrameStatus('ready');
          autoCapturedRef.current = true;
          // Auto-capture after brief visual feedback
          setTimeout(() => {
            takePhotoInternal();
          }, 400);
        } else if (readyCountRef.current >= 2) {
          setFrameStatus('adjusting'); // Almost ready
        }
      }
    };

    analysisIntervalRef.current = window.setInterval(analyzeFrame, 300);

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    };
  }, [cameraActive, smartCapture, captureMode]);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setError(null);
    setCameraFailed(false);
    autoCapturedRef.current = false;
    readyCountRef.current = 0;
    setFrameStatus('searching');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      pendingStreamRef.current = stream;
      setCameraActive(true);
      setCapturedImage(null);
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraFailed(true);
      if (err.name === 'NotAllowedError') {
        setError("Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur.");
      } else if (err.name === 'NotFoundError') {
        setError("Aucune caméra détectée sur cet appareil.");
      } else {
        setError("Impossible d'accéder à la caméra. Essayez sur votre téléphone mobile.");
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    pendingStreamRef.current = null;
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (cameraActive) startCamera(newFacing);
  }, [facingMode, cameraActive, startCamera]);

  const takePhotoInternal = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
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

    stopCamera();
    setFrameStatus('captured');
    setCapturedImage(dataUrl);

    setUploading(true);
    setError(null);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `${folder}/${Date.now()}-capture.jpg`;
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
    } finally {
      setUploading(false);
    }
  }, [folder, bucket, onChange, stopCamera]);

  const takePhoto = useCallback(() => {
    autoCapturedRef.current = true; // Prevent auto-capture racing
    takePhotoInternal();
  }, [takePhotoInternal]);

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

  const statusColor = frameStatus === 'ready' || frameStatus === 'captured'
    ? 'text-emerald-400'
    : frameStatus === 'adjusting' ? 'text-amber-400' : 'text-white/60';

  const borderColor = frameStatus === 'ready' || frameStatus === 'captured'
    ? 'border-emerald-400'
    : frameStatus === 'adjusting' ? 'border-amber-400' : 'border-white';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium leading-none">{label}</p>
        {smartCapture && captureMode !== 'free' && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Scan className="h-3 w-3" /> Auto-capture
          </span>
        )}
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
            {/* Smart status indicator */}
            {smartCapture && captureMode !== 'free' && (
              <div className={`absolute top-3 left-0 right-0 flex justify-center z-30`}>
                <div className={`px-3 py-1.5 rounded-full bg-black/70 backdrop-blur flex items-center gap-2 ${statusColor}`}>
                  {frameStatus === 'searching' && <Scan className="h-3.5 w-3.5 animate-pulse" />}
                  {frameStatus === 'adjusting' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {frameStatus === 'ready' && <CheckCircle className="h-3.5 w-3.5" />}
                  <span className="text-[11px] font-medium">{messages[frameStatus]}</span>
                </div>
              </div>
            )}
            {/* Frame overlay */}
            {captureMode === 'document' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/50 rounded-xl" />
                <div
                  className={`relative ${borderColor} border-2 rounded-lg bg-transparent z-10 transition-colors duration-300`}
                  style={{
                    width: 'min(85%, 420px)',
                    aspectRatio: '85.6 / 53.98',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className={`absolute -top-px -left-px w-5 h-5 border-t-[3px] border-l-[3px] ${borderColor} rounded-tl-lg transition-colors duration-300`} />
                  <div className={`absolute -top-px -right-px w-5 h-5 border-t-[3px] border-r-[3px] ${borderColor} rounded-tr-lg transition-colors duration-300`} />
                  <div className={`absolute -bottom-px -left-px w-5 h-5 border-b-[3px] border-l-[3px] ${borderColor} rounded-bl-lg transition-colors duration-300`} />
                  <div className={`absolute -bottom-px -right-px w-5 h-5 border-b-[3px] border-r-[3px] ${borderColor} rounded-br-lg transition-colors duration-300`} />
                  <p className={`absolute -bottom-7 left-0 right-0 text-center text-[11px] font-medium ${statusColor} transition-colors duration-300`}>
                    {smartCapture ? messages[frameStatus] : 'Cadrez votre document ici'}
                  </p>
                </div>
              </div>
            )}
            {captureMode === 'selfie' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-black/50 rounded-xl" />
                <div
                  className={`relative ${borderColor} border-2 rounded-full bg-transparent z-10 transition-colors duration-300`}
                  style={{
                    width: 'min(55%, 220px)',
                    aspectRatio: '3 / 4',
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                  }}
                />
                <p className={`absolute bottom-16 left-0 right-0 text-center text-[11px] font-medium z-10 ${statusColor} transition-colors duration-300`}>
                  {smartCapture ? messages[frameStatus] : 'Cadrez votre visage ici'}
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

        {/* Captured image preview */}
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
                <Button type="button" size="sm" variant="secondary" className="bg-background/80 backdrop-blur" onClick={retake}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reprendre
                </Button>
                <Button type="button" size="sm" variant="destructive" className="bg-destructive/80 backdrop-blur" onClick={clear}>
                  <X className="h-3.5 w-3.5 mr-1.5" /> Supprimer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Value from server */}
        {!capturedImage && !cameraActive && value && !cameraFailed && (
          <div className="relative">
            <img src={value} alt="Photo uploadée" className="w-full h-[280px] object-cover rounded-xl" />
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
              <Button type="button" size="sm" variant="secondary" className="bg-background/80 backdrop-blur" onClick={retake}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reprendre
              </Button>
              <Button type="button" size="sm" variant="destructive" className="bg-destructive/80 backdrop-blur" onClick={clear}>
                <X className="h-3.5 w-3.5 mr-1.5" /> Supprimer
              </Button>
            </div>
          </div>
        )}

        {/* Camera failed */}
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
              <Button type="button" variant="outline" size="sm" onClick={() => startCamera()} className="w-full">
                <Camera className="h-4 w-4 mr-2" /> Réessayer
              </Button>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <p className="text-xs font-medium text-primary">Utilisez votre téléphone</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Ouvrez ce lien sur votre téléphone mobile pour effectuer la vérification.
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clear} className="text-xs text-muted-foreground">
              Annuler
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!cameraActive && !capturedImage && !value && !cameraFailed && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-10 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => startCamera()}
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Appuyez pour prendre une photo</p>
              <p className="text-[10px] text-muted-foreground">
                {smartCapture && captureMode !== 'free'
                  ? 'La capture se fera automatiquement quand le cadrage sera bon'
                  : 'La caméra de votre appareil sera activée'}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && !cameraFailed && <p className="text-xs text-destructive">{error}</p>}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={analysisCanvasRef} className="hidden" />
    </div>
  );
}
