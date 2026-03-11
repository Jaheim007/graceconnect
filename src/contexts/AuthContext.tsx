import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  const fetchProfile = async (userId: string) => {
    try {
      // Use maybeSingle() — never throws when row is missing
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (data) setProfile(data as Profile);
    } catch {
      // Non-fatal — profile is optional for display
    }
  };

  const fetchPlatformRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_platform_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      setIsSuperadmin(data?.role === 'superadmin');
    } catch {
      setIsSuperadmin(false);
    }
  };

  const upsertProfile = async (userId: string, displayName?: string) => {
    try {
      // Use upsert with ignoreDuplicates so it never throws on existing row
      await supabase.from('profiles').upsert(
        { id: userId, display_name: displayName || null, country: 'CI' },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      await fetchProfile(userId);
    } catch {
      // Non-fatal — user can still use the app
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout — if Supabase never responds, unblock the app after 5s
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    // Get the initial session FIRST — set loading=false immediately after
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      clearTimeout(timeout);
      if (s) {
        setSession(s);
        setUser(s.user);
        // Fire-and-forget — don't block loading on these
        upsertProfile(s.user.id, s.user.user_metadata?.full_name);
        fetchPlatformRole(s.user.id);
      }
      // Always resolve loading after getSession — never block on profile fetch
      setLoading(false);
    }).catch(() => {
      clearTimeout(timeout);
      if (mounted) setLoading(false);
    });

    // Listen for subsequent auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          upsertProfile(newSession.user.id, newSession.user.user_metadata?.full_name);
          fetchPlatformRole(newSession.user.id);

          // Send welcome email on first sign-up only (not repeat logins)
          if (event === 'SIGNED_IN' && newSession.user.email) {
            const createdAt = new Date(newSession.user.created_at).getTime();
            const now = Date.now();
            // Only send if account was created within last 60 seconds
            if (now - createdAt < 60_000) {
              sendEmailNotification('welcome', newSession.user.email, {
                name: newSession.user.user_metadata?.full_name || newSession.user.email.split('@')[0],
              }).catch(() => {});
            }
          }
        } else {
          setProfile(null);
          setIsSuperadmin(false);
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (returnTo?: string) => {
    const isCustomDomain = !window.location.hostname.includes('lovable.app') && !window.location.hostname.includes('lovableproject.com');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://siteviral.com/auth/callback',
        skipBrowserRedirect: isCustomDomain,
      },
    });

    if (!error && isCustomDomain && data?.url) {
      window.location.href = data.url;
    }

    return { error: error as Error | null };
  };

  const signInWithFacebook = async (returnTo?: string) => {
    const isCustomDomain = !window.location.hostname.includes('lovable.app') && !window.location.hostname.includes('lovableproject.com');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: 'https://siteviral.com/auth/callback',
        skipBrowserRedirect: isCustomDomain,
      },
    });

    if (!error && isCustomDomain && data?.url) {
      window.location.href = data.url;
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
    await supabase.auth.signOut();
    setProfile(null);
    setIsSuperadmin(false);
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
        signInWithGoogle,
        signInWithFacebook,
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
