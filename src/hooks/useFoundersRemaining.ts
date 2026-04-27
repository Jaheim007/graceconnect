import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Public hook returning the live count of remaining Founder slots.
 * Refreshes every 60s. Returns null while loading.
 */
export function useFoundersRemaining() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchRemaining = async () => {
      try {
        const { data } = await supabase.rpc('founders_remaining' as any);
        if (!cancelled && typeof data === 'number') setRemaining(data);
      } catch {
        // silent — keep last known value
      }
    };
    fetchRemaining();
    const id = setInterval(fetchRemaining, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return remaining;
}
