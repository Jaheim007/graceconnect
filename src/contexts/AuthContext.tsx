import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { sendEmailNotification } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isSuperadmin: boolean;
  platformRoleLoading: boolean;
  signInWithGoogle: (returnTo?: string) => Promise<{ error: Error | null }>;
  signInWithFacebook: (returnTo?: string) => Promise<{ error: Error | null }>;
  signInWithLinkedin: (returnTo?: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string, returnTo?: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [platformRoleLoading, setPlatformRoleLoading] = useState(true);
  const roleRequestRef = useRef(0);
  const platformRoleRetryTimeoutRef = useRef<number | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (data) {
        setProfile(data as Profile);
        // Broadcast profile locale to i18n system
        if (data.preferred_language) {
          localStorage.setItem('sv_profile_locale', data.preferred_language);
          window.dispatchEvent(new CustomEvent('sv:profile-locale', { detail: { locale: data.preferred_language } }));
        }
        if (data.preferred_currency) {
          localStorage.setItem('sv_display_currency', data.preferred_currency);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  const fetchPlatformRole = async (userId: string): Promise<boolean | null> => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const { data, error } = await supabase
          .from('user_platform_roles')
          .select('role')
          .eq('user_id', userId);

        if (error) throw error;

        return (data || []).some((row) => row.role === 'superadmin');
      } catch {
        if (attempt === 2) {
          return null;
        }

        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }

    return null;
  };

  const upsertProfile = async (userId: string, displayName?: string) => {
    try {
      const detectedCountry = (() => {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const tzMap: Record<string, string> = {
            'Africa/Abidjan': 'CI', 'Africa/Accra': 'GH', 'Africa/Nairobi': 'KE',
            'Africa/Lagos': 'NG', 'Africa/Dakar': 'SN', 'Africa/Bamako': 'ML',
            'Africa/Ouagadougou': 'BF', 'Africa/Lome': 'TG', 'Africa/Douala': 'CM',
            'Europe/Paris': 'FR', 'America/New_York': 'US',
          };
          return tzMap[tz] || null;
        } catch { return null; }
      })();

      // Derive a usable name: OAuth full_name > email prefix
      const derivedName = (() => {
        if (displayName && displayName.trim()) return displayName.trim();
        // Fallback: extract a readable name from the user's email
        const email = user?.email || session?.user?.email;
        if (email) {
          const prefix = email.split('@')[0];
          // Capitalize first letter, replace dots/underscores with spaces
          return prefix
            .replace(/[._]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        }
        return null;
      })();

      await supabase.from('profiles').upsert(
        { id: userId, display_name: derivedName || null, ...(detectedCountry ? { country: detectedCountry } : {}) } as any,
        { onConflict: 'id', ignoreDuplicates: true }
      );

      // If user already exists AND we have a name, patch display_name if it's currently null/empty
      if (derivedName) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle();
        if (existing && (!existing.display_name || existing.display_name.trim() === '')) {
          await supabase.from('profiles')
            .update({ display_name: derivedName })
            .eq('id', userId);
        }
      }

      await fetchProfile(userId);
    } catch {
      // Non-fatal — user can still use the app
    }
  };

  useEffect(() => {
    let mounted = true;

    const clearPlatformRoleRetry = () => {
      if (platformRoleRetryTimeoutRef.current !== null) {
        window.clearTimeout(platformRoleRetryTimeoutRef.current);
        platformRoleRetryTimeoutRef.current = null;
      }
    };

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      const requestId = ++roleRequestRef.current;
      clearPlatformRoleRetry();

      if (nextSession?.user) {
        try { sessionStorage.removeItem('sv_oauth_pending_since'); } catch {}
        upsertProfile(nextSession.user.id, nextSession.user.user_metadata?.full_name);
        setPlatformRoleLoading(true);
        const resolvePlatformRole = async () => {
          const nextIsSuperadmin = await fetchPlatformRole(nextSession.user.id);
          if (!mounted || roleRequestRef.current !== requestId) return;

          if (nextIsSuperadmin === null) {
            platformRoleRetryTimeoutRef.current = window.setTimeout(() => {
              if (!mounted || roleRequestRef.current !== requestId) return;
              void resolvePlatformRole();
            }, 1500);
            return;
          }

          setIsSuperadmin(nextIsSuperadmin);
          setPlatformRoleLoading(false);
        };

        void resolvePlatformRole();
      } else {
        setProfile(null);
        setIsSuperadmin(false);
        setPlatformRoleLoading(false);
      }
    };

    // Safety timeout — mobile OAuth can be slow; don't unblock too early
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 20_000);

    // Listen FIRST so we never miss the auth event emitted during OAuth callback hydration
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      applySession(newSession);

      if (newSession?.user && event === 'SIGNED_IN' && newSession.user.email) {
        const createdAt = new Date(newSession.user.created_at).getTime();
        const now = Date.now();
        if (now - createdAt < 60_000) {
          sendEmailNotification('welcome', newSession.user.email, {
            name: newSession.user.user_metadata?.full_name || newSession.user.email.split('@')[0],
          }).catch(() => {});
        }
      }

      if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    // Then hydrate any already available session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      applySession(s);
      clearTimeout(timeout);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      clearPlatformRoleRetry();
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (returnTo?: string) => {
    const hostname = window.location.hostname;
    const isCustomDomain = !hostname.includes('lovable.app') && !hostname.includes('lovableproject.com');

    // Store origin domain so callback can redirect back
    if (isCustomDomain && hostname !== 'siteviral.com' && hostname !== 'www.siteviral.com') {
      try { sessionStorage.setItem('sv_auth_origin_domain', window.location.origin); } catch {}
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://siteviral.com/auth/callback',
        skipBrowserRedirect: isCustomDomain,
      },
    });

    if (!error && isCustomDomain && data?.url) {
      window.location.assign(data.url);
    }

    return { error: error as Error | null };
  };

  const signInWithFacebook = async (returnTo?: string) => {
    const hostname = window.location.hostname;
    const isCustomDomain = !hostname.includes('lovable.app') && !hostname.includes('lovableproject.com');

    if (isCustomDomain && hostname !== 'siteviral.com' && hostname !== 'www.siteviral.com') {
      try { sessionStorage.setItem('sv_auth_origin_domain', window.location.origin); } catch {}
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'https://siteviral.com/auth/callback',
        skipBrowserRedirect: isCustomDomain,
      },
    });

    if (!error && isCustomDomain && data?.url) {
      window.location.assign(data.url);
    }

    return { error: error as Error | null };
  };

  const signInWithLinkedin = async (returnTo?: string) => {
    const hostname = window.location.hostname;
    const isCustomDomain = !hostname.includes('lovable.app') && !hostname.includes('lovableproject.com');

    if (isCustomDomain && hostname !== 'siteviral.com' && hostname !== 'www.siteviral.com') {
      try { sessionStorage.setItem('sv_auth_origin_domain', window.location.origin); } catch {}
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: 'https://siteviral.com/auth/callback',
        skipBrowserRedirect: isCustomDomain,
      },
    });

    if (!error && isCustomDomain && data?.url) {
      window.location.assign(data.url);
    }

    return { error: error as Error | null };
  };

  const signInWithMagicLink = async (email: string, returnTo?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${returnTo || '/feed'}` },
    });
    return { error: error as Error | null };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    try { sessionStorage.removeItem('sv_oauth_pending_since'); } catch {}
    try { sessionStorage.removeItem('sv_welcome_seen'); } catch {}
    if (platformRoleRetryTimeoutRef.current !== null) {
      window.clearTimeout(platformRoleRetryTimeoutRef.current);
      platformRoleRetryTimeoutRef.current = null;
    }
    await supabase.auth.signOut();
    setProfile(null);
    setIsSuperadmin(false);
    setPlatformRoleLoading(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isSuperadmin,
        platformRoleLoading,
        signInWithGoogle,
        signInWithFacebook,
        signInWithLinkedin,
        signInWithMagicLink,
        verifyOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
