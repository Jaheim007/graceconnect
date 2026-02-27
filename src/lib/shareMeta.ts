interface BuildSocialShareUrlInput {
  targetUrl: string;
  title?: string;
  description?: string;
  image?: string;
}

const DEFAULT_SITE_ORIGIN = 'https://siteviral.com';

const getFunctionsBase = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return supabaseUrl ? `${supabaseUrl}/functions/v1` : 'https://api.siteviral.com/functions/v1';
};

const toAbsoluteUrl = (value: string) => {
  try {
    return new URL(value).toString();
  } catch {
    try {
      return new URL(value, typeof window !== 'undefined' ? window.location.origin : DEFAULT_SITE_ORIGIN).toString();
    } catch {
      return '';
    }
  }
};

export const buildSocialShareUrl = ({ targetUrl, title, description, image }: BuildSocialShareUrlInput) => {
  const absoluteTarget = toAbsoluteUrl(targetUrl);
  if (!absoluteTarget) return targetUrl;

  const params = new URLSearchParams({ target: absoluteTarget });
  if (title?.trim()) params.set('title', title.trim().slice(0, 180));
  if (description?.trim()) params.set('description', description.trim().slice(0, 300));

  const absoluteImage = image ? toAbsoluteUrl(image) : '';
  if (absoluteImage) params.set('image', absoluteImage);

  return `${getFunctionsBase()}/share-meta?${params.toString()}`;
};
