import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const REF_STORAGE_KEY = "sv_referral_code";
const REF_PROCESSED_KEY = "sv_referral_processed";

/**
 * Capture le ?ref= dans l'URL et l'enregistre.
 * Une fois l'utilisateur authentifié, appelle register_referral pour le lier au parrain.
 */
export function ReferralCapture() {
  const { user } = useAuth();

  // 1) Capture le code dans l'URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref && /^SV-[A-Z0-9]{4,12}$/i.test(ref)) {
        localStorage.setItem(REF_STORAGE_KEY, ref.toUpperCase());
      }
    } catch {}
  }, []);

  // 2) Lie le code au user dès qu'il est authentifié
  useEffect(() => {
    if (!user) return;
    const code = localStorage.getItem(REF_STORAGE_KEY);
    const processed = localStorage.getItem(REF_PROCESSED_KEY);
    if (!code || processed === user.id) return;

    (async () => {
      try {
        await supabase.rpc("register_referral" as any, {
          _referred_id: user.id,
          _code: code,
        });
        localStorage.setItem(REF_PROCESSED_KEY, user.id);
      } catch (e) {
        console.warn("[ReferralCapture] failed:", e);
      }
    })();
  }, [user]);

  return null;
}
