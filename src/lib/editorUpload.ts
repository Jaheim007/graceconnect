import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a File (from clipboard paste or drag-drop) to Supabase storage
 * and return the public URL.
 */
export async function uploadEditorImage(file: File): Promise<string | null> {
  const ext = file.name?.split('.').pop() || 'png';
  const fileName = `editor/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('org-uploads')
    .upload(fileName, file, {
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    console.error('Editor image upload failed:', error);
    return null;
  }

  const { data } = supabase.storage.from('org-uploads').getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Convert a video URL (YouTube, Facebook, TikTok, Vimeo, Dailymotion)
 * into an embeddable iframe src.
 * Returns null if the URL is not recognized.
 */
export function getVideoEmbedUrl(url: string): string | null {
  const trimmed = url.trim();

  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo: vimeo.com/ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Dailymotion: dailymotion.com/video/ID
  const dmMatch = trimmed.match(/dailymotion\.com\/video\/(\w+)/);
  if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;

  // Facebook video: facebook.com/.../videos/...
  if (/facebook\.com.*\/videos\//.test(trimmed)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=0&width=560`;
  }

  // TikTok: tiktok.com/@user/video/ID
  const ttMatch = trimmed.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (ttMatch) return `https://www.tiktok.com/embed/v2/${ttMatch[1]}`;

  return null;
}
