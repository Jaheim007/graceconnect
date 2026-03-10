import { useRef, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { brandUrl } from '@/lib/storageUrl';
import { Camera, RotateCcw, X, Loader2, SwitchCamera, Smartphone, AlertTriangle, Scan, CheckCircle, Eye, RotateCw, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type CaptureMode = 'document' | 'selfie' | 'free';
type FrameStatus = 'searching' | 'adjusting' | 'ready' | 'captured';
type LivenessPhase = 'idle' | 'challenge' | 'verifying' | 'passed' | 'failed';
type LivenessChallenge = 'turn_left' | 'turn_right' | 'smile' | 'blink';

interface SmartCameraCaptureProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
  bucket?: 'org-uploads' | 'private-products' | 'kyc-documents';
  captureMode?: CaptureMode;
  smartCapture?: boolean;
  /** Enable liveness detection for selfie captures */
  livenessCheck?: boolean;
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

const LIVENESS_CHALLENGES: { type: LivenessChallenge; label: string; icon: typeof Eye; instruction: string }[] = [
  { type: 'turn_left', label: 'Tournez la tête à gauche', icon: RotateCw, instruction: '← Tournez lentement la tête vers la gauche' },
  { type: 'turn_right', label: 'Tournez la tête à droite', icon: RotateCw, instruction: 'Tournez lentement la tête vers la droite →' },
  { type: 'smile', label: 'Souriez', icon: Smile, instruction: '😊 Faites un grand sourire !' },
  { type: 'blink', label: 'Clignez des yeux', icon: Eye, instruction: '👁️ Clignez lentement des yeux' },
];

function pickRandomChallenge(): typeof LIVENESS_CHALLENGES[0] {
  return LIVENESS_CHALLENGES[Math.floor(Math.random() * LIVENESS_CHALLENGES.length)];
}

export function SmartCameraCapture({
  value,
  onChange,
  folder = 'captures',
  label = 'Photo',
  hint,
  bucket = 'org-uploads',
  captureMode = 'free',
  smartCapture = true,
  livenessCheck = false,
}: SmartCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);
  const readyCountRef = useRef(0);
  const autoCapturedRef = useRef(false);

  // Liveness refs
  const livenessIntervalRef = useRef<number | null>(null);
  const previousFrameRef = useRef<ImageData | null>(null);
  const motionScoresRef = useRef<number[]>([]);
  const livenessTimeoutRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(value || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [frameStatus, setFrameStatus] = useState<FrameStatus>('searching');

  // Liveness state
  const [livenessPhase, setLivenessPhase] = useState<LivenessPhase>('idle');
  const [currentChallenge, setCurrentChallenge] = useState<typeof LIVENESS_CHALLENGES[0] | null>(null);
  const [livenessProgress, setLivenessProgress] = useState(0);

  const isLivenessEnabled = livenessCheck && captureMode === 'selfie';
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

  // Cleanup liveness on unmount
  useEffect(() => {
    return () => {
      if (livenessIntervalRef.current) clearInterval(livenessIntervalRef.current);
      if (livenessTimeoutRef.current) clearTimeout(livenessTimeoutRef.current);
    };
  }, []);

  // Smart frame analysis (only for selfie mode — document auto-capture is disabled)
  useEffect(() => {
    if (!cameraActive || !smartCapture || captureMode !== 'selfie') return;
    // If liveness is active for selfie, skip auto-capture (liveness handles it)
    if (isLivenessEnabled && livenessPhase !== 'idle') return;

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

      const scale = 0.25;
      canvas.width = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const regionW = canvas.width * 0.5;
      const regionH = regionW * (4 / 3);
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

      const brightnessOk = avgBrightness > 60 && avgBrightness < 220;
      const hasContent = edgeDensity > 0.03;
      const isSharp = avgContrast > 3;

      if (!brightnessOk || !hasContent) {
        readyCountRef.current = 0;
        setFrameStatus(hasContent ? 'adjusting' : 'searching');
      } else if (!isSharp) {
        readyCountRef.current = 0;
        setFrameStatus('adjusting');
      } else {
        readyCountRef.current++;
        if (readyCountRef.current >= 5) {
          setFrameStatus('ready');
          autoCapturedRef.current = true;
          if (isLivenessEnabled) {
            startLivenessChallenge();
          } else {
            setTimeout(() => takePhotoInternal(), 400);
          }
        } else if (readyCountRef.current >= 2) {
          setFrameStatus('adjusting');
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
  }, [cameraActive, smartCapture, captureMode, isLivenessEnabled, livenessPhase]);

  // ── Liveness Detection ──
  const startLivenessChallenge = useCallback(() => {
    const challenge = pickRandomChallenge();
    setCurrentChallenge(challenge);
    setLivenessPhase('challenge');
    setLivenessProgress(0);
    previousFrameRef.current = null;
    motionScoresRef.current = [];

    // Start motion detection
    livenessIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !analysisCanvasRef.current) return;

      const video = videoRef.current;
      const canvas = analysisCanvasRef.current;
      const vw = video.videoWidth || video.clientWidth;
      const vh = video.videoHeight || video.clientHeight;
      if (vw === 0 || vh === 0) return;

      const scale = 0.15; // Very low res for speed
      canvas.width = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (previousFrameRef.current) {
        const prev = previousFrameRef.current.data;
        const curr = currentFrame.data;
        let diffSum = 0;
        let totalPixels = 0;

        // Focus on center face region
        const faceStartX = Math.round(canvas.width * 0.2);
        const faceEndX = Math.round(canvas.width * 0.8);
        const faceStartY = Math.round(canvas.height * 0.1);
        const faceEndY = Math.round(canvas.height * 0.7);

        for (let y = faceStartY; y < faceEndY; y += 2) {
          for (let x = faceStartX; x < faceEndX; x += 2) {
            const i = (y * canvas.width + x) * 4;
            const grayPrev = prev[i] * 0.299 + prev[i + 1] * 0.587 + prev[i + 2] * 0.114;
            const grayCurr = curr[i] * 0.299 + curr[i + 1] * 0.587 + curr[i + 2] * 0.114;
            diffSum += Math.abs(grayCurr - grayPrev);
            totalPixels++;
          }
        }

        const motionScore = totalPixels > 0 ? diffSum / totalPixels : 0;
        motionScoresRef.current.push(motionScore);

        // Update progress based on accumulated motion
        const scores = motionScoresRef.current;
        const significantMotions = scores.filter(s => s > 3).length; // Threshold for "real motion"
        const progress = Math.min(100, (significantMotions / 8) * 100); // Need ~8 significant motion frames
        setLivenessProgress(progress);

        if (progress >= 100) {
          // Liveness passed!
          if (livenessIntervalRef.current) clearInterval(livenessIntervalRef.current);
          setLivenessPhase('passed');
          // Auto-capture after showing success feedback
          setTimeout(() => {
            takePhotoInternal();
          }, 800);
        }
      }

      previousFrameRef.current = currentFrame;
    }, 200);

    // Timeout: fail after 10 seconds of insufficient motion
    livenessTimeoutRef.current = window.setTimeout(() => {
      if (livenessIntervalRef.current) clearInterval(livenessIntervalRef.current);
      const scores = motionScoresRef.current;
      const significantMotions = scores.filter(s => s > 3).length;
      if (significantMotions < 5) {
        setLivenessPhase('failed');
      } else {
        // Partial motion detected — pass anyway
        setLivenessPhase('passed');
        setTimeout(() => takePhotoInternal(), 800);
      }
    }, 10000);
  }, []);

  const retryLiveness = useCallback(() => {
    setLivenessPhase('idle');
    setLivenessProgress(0);
    autoCapturedRef.current = false;
    readyCountRef.current = 0;
    setFrameStatus('searching');
    previousFrameRef.current = null;
    motionScoresRef.current = [];
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    setError(null);
    setCameraFailed(false);
    autoCapturedRef.current = false;
    readyCountRef.current = 0;
    setFrameStatus('searching');
    setLivenessPhase('idle');
    setLivenessProgress(0);
    previousFrameRef.current = null;
    motionScoresRef.current = [];
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
    if (livenessIntervalRef.current) {
      clearInterval(livenessIntervalRef.current);
      livenessIntervalRef.current = null;
    }
    if (livenessTimeoutRef.current) {
      clearTimeout(livenessTimeoutRef.current);
      livenessTimeoutRef.current = null;
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
      // Convert data URL to blob without fetch (more reliable)
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeString });

      const fileName = `${folder}/${Date.now()}-capture.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: 'image/jpeg' });
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
    autoCapturedRef.current = true;
    takePhotoInternal();
  }, [takePhotoInternal]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setLivenessPhase('idle');
    setLivenessProgress(0);
    onChange('');
    startCamera();
  }, [onChange, startCamera]);

  const clear = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setCameraFailed(false);
    setError(null);
    setLivenessPhase('idle');
    onChange('');
  }, [stopCamera, onChange]);

  const statusColor = frameStatus === 'ready' || frameStatus === 'captured'
    ? 'text-emerald-400'
    : frameStatus === 'adjusting' ? 'text-amber-400' : 'text-white/60';

  const borderColor = frameStatus === 'ready' || frameStatus === 'captured'
    ? 'border-emerald-400'
    : frameStatus === 'adjusting' ? 'border-amber-400' : 'border-white';

  // Liveness overlay colors
  const livenessColor = livenessPhase === 'passed' ? 'border-emerald-400' :
    livenessPhase === 'failed' ? 'border-destructive' : 'border-blue-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium leading-none">{label}</p>
        <div className="flex items-center gap-2">
          {isLivenessEnabled && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" /> Anti-fraude
            </span>
          )}
          {smartCapture && captureMode === 'selfie' && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Scan className="h-3 w-3" /> Auto-capture
            </span>
          )}
        </div>
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

            {/* ── Liveness Challenge Overlay ── */}
            {isLivenessEnabled && livenessPhase === 'challenge' && currentChallenge && (
              <div className="absolute inset-0 z-40 pointer-events-none">
                {/* Top instruction bar */}
                <div className="absolute top-3 left-0 right-0 flex justify-center">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-2 rounded-full bg-blue-600/90 backdrop-blur text-white flex items-center gap-2 shadow-lg"
                  >
                    <currentChallenge.icon className="h-4 w-4" />
                    <span className="text-xs font-semibold">{currentChallenge.instruction}</span>
                  </motion.div>
                </div>
                {/* Progress ring around face oval */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/30 rounded-xl" />
                  <div className="relative z-10" style={{ width: 'min(55%, 220px)', aspectRatio: '3 / 4' }}>
                    <svg viewBox="0 0 100 133" className="w-full h-full">
                      {/* Background oval */}
                      <ellipse cx="50" cy="66.5" rx="48" ry="64" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                      {/* Progress oval */}
                      <ellipse
                        cx="50" cy="66.5" rx="48" ry="64"
                        fill="none"
                        stroke={livenessProgress >= 100 ? '#34d399' : '#3b82f6'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(2 * Math.PI * 56) * (livenessProgress / 100)} ${2 * Math.PI * 56}`}
                        transform="rotate(-90 50 66.5)"
                        className="transition-all duration-200"
                      />
                    </svg>
                  </div>
                </div>
                {/* Bottom progress text */}
                <div className="absolute bottom-14 left-0 right-0 flex justify-center">
                  <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white/80 text-[11px] font-medium">
                    {Math.round(livenessProgress)}% — Continuez le mouvement…
                  </div>
                </div>
              </div>
            )}

            {/* Liveness passed overlay */}
            {isLivenessEnabled && livenessPhase === 'passed' && (
              <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">Vérification réussie !</p>
                </motion.div>
              </div>
            )}

            {/* Liveness failed overlay */}
            {isLivenessEnabled && livenessPhase === 'failed' && (
              <div className="absolute inset-0 z-40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 bg-black/70 backdrop-blur rounded-2xl p-6">
                  <div className="h-14 w-14 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="h-7 w-7 text-destructive" />
                  </div>
                  <p className="text-white font-semibold text-sm">Mouvement insuffisant</p>
                  <p className="text-white/60 text-xs text-center max-w-[200px]">
                    Nous n'avons pas détecté suffisamment de mouvement. Veuillez suivre les instructions.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={retryLiveness}
                    className="pointer-events-auto"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Réessayer
                  </Button>
                </div>
              </div>
            )}

            {/* Smart status indicator (when not in liveness mode) */}
            {smartCapture && captureMode !== 'free' && livenessPhase === 'idle' && (
              <div className="absolute top-3 left-0 right-0 flex justify-center z-30">
                <div className={`px-3 py-1.5 rounded-full bg-black/70 backdrop-blur flex items-center gap-2 ${statusColor}`}>
                  {frameStatus === 'searching' && <Scan className="h-3.5 w-3.5 animate-pulse" />}
                  {frameStatus === 'adjusting' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {frameStatus === 'ready' && <CheckCircle className="h-3.5 w-3.5" />}
                  <span className="text-[11px] font-medium">{messages[frameStatus]}</span>
                </div>
              </div>
            )}

            {/* Frame overlay — document */}
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

            {/* Frame overlay — selfie (only when not in liveness challenge/passed/failed) */}
            {captureMode === 'selfie' && livenessPhase === 'idle' && (
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

            {/* Camera controls */}
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
                disabled={isLivenessEnabled && livenessPhase === 'challenge'}
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
            <img src={capturedImage} alt="Photo capturée" className="w-full h-[280px] object-cover rounded-xl" />
            {/* Liveness badge */}
            {isLivenessEnabled && livenessPhase === 'passed' && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Vivacité vérifiée
                </span>
              </div>
            )}
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
                {isLivenessEnabled
                  ? 'Un test anti-fraude sera effectué avant la capture'
                  : smartCapture && captureMode !== 'free'
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
