import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isSuperadmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
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
          // Fire-and-forget — don't await here to avoid blocking state changes
          upsertProfile(newSession.user.id, newSession.user.user_metadata?.full_name);
          fetchPlatformRole(newSession.user.id);
        } else {
          setProfile(null);
          setIsSuperadmin(false);
        }

        // Only set loading=false for INITIAL_SESSION event to avoid flicker
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: displayName },
      },
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/feed` },
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
        signIn,
        signUp,
        signInWithGoogle,
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
