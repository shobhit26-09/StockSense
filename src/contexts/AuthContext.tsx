import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  error: string | null;
  /** True when the project requires email confirmation before the first session. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** True until the initial stored session check resolves. */
  loading: boolean;
  isConfigured: boolean;
  /** True after a password-recovery link lands, until the password is updated. */
  recoveryMode: boolean;
  clearRecoveryMode: () => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  /** Redirects the browser to Google and back; only resolves on failure to start. */
  signInWithGoogle: () => Promise<AuthResult>;
  /** Emails a one-time sign-in code (with a magic link as fallback in the same email). */
  sendSignInCode: (email: string) => Promise<AuthResult>;
  verifySignInCode: (email: string, token: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const NOT_CONFIGURED =
  'Accounts are unavailable on this deployment because the auth backend is not configured.';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    if (error) return { error: error.message };
    return { error: null, needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    return { error: error?.message ?? null };
  }, []);

  const sendSignInCode = useCallback(async (email: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth`, shouldCreateUser: true },
    });
    return { error: error?.message ?? null };
  }, []);

  const verifySignInCode = useCallback(async (email: string, token: string): Promise<AuthResult> => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    return { error: error?.message ?? null };
  }, []);

  const clearRecoveryMode = useCallback(() => setRecoveryMode(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      recoveryMode,
      clearRecoveryMode,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      signInWithGoogle,
      sendSignInCode,
      verifySignInCode,
    }),
    [session, loading, recoveryMode, clearRecoveryMode, signIn, signUp, signOut, sendPasswordReset, updatePassword, signInWithGoogle, sendSignInCode, verifySignInCode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
