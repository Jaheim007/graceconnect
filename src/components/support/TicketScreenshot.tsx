import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'ticket-screenshots';

/**
 * Resolve a stored ticket-screenshot URL into a short-lived signed URL.
 * The bucket is private: only the ticket author and superadmins can read it.
 */
export function useTicketScreenshotUrl(storedUrl: string) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!storedUrl) return;
      if (!storedUrl.includes(`/${BUCKET}/`)) {
        setUrl(storedUrl);
        return;
      }
      const path = storedUrl.split(`/${BUCKET}/`).pop()?.split('?')[0];
      if (!path) return;
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(decodeURIComponent(path), 600);
      if (active) setUrl(data?.signedUrl ?? null);
    })();
    return () => {
      active = false;
    };
  }, [storedUrl]);

  return url;
}

interface Props {
  storedUrl: string;
  alt: string;
  className?: string;
  onClick?: (signedUrl: string) => void;
}

/** Private ticket screenshot rendered through a temporary signed URL. */
export default function TicketScreenshot({ storedUrl, alt, className, onClick }: Props) {
  const url = useTicketScreenshotUrl(storedUrl);

  if (!url) {
    return <div className={className ?? 'h-40 w-32 rounded-xl border border-border bg-muted animate-pulse'} />;
  }

  const img = <img src={url} alt={alt} loading="lazy" className={className} />;

  if (onClick) {
    return (
      <button type="button" onClick={() => onClick(url)} className="block">
        {img}
      </button>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {img}
    </a>
  );
}
