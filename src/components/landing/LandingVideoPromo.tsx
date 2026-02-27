import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/**
 * Promo video section for the landing page.
 * Replace YOUTUBE_VIDEO_ID with your actual video ID once produced.
 */
export function LandingVideoPromo() {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false);

  // Replace with actual YouTube video ID
  const YOUTUBE_VIDEO_ID = '';

  if (!YOUTUBE_VIDEO_ID) return null; // Hidden until a video is provided

  return (
    <section className="py-20 px-4">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">{t('landing.video_badge')}</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            {t('landing.video_title')}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{t('landing.video_desc')}</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
          <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video shadow-elevated border border-border">
            {playing ? (
              <iframe
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                title="Siteviral — Presentation"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-4 group"
              >
                <img
                  src={`https://img.youtube.com/vi/${YOUTUBE_VIDEO_ID}/maxresdefault.jpg`}
                  alt="Video thumbnail"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-background/40" />
                <div className="relative z-10 h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-primary-foreground ml-1" />
                </div>
                <span className="relative z-10 text-sm font-semibold text-foreground">{t('landing.video_watch')}</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
