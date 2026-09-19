import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, TrendingUp } from 'lucide-react';
import Seo from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { ENABLED_OAUTH_PROVIDERS } from '@/config/authProviders';

type Mode = 'signin' | 'signup' | 'forgot' | 'otp';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

const GoogleMark = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"/>
    <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"/>
    <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1c.95-2.85 3.6-4.96 6.73-4.96z"/>
  </svg>
);

const AuthPage = () => {
  const {
    user, loading, recoveryMode, clearRecoveryMode,
    signIn, signUp, sendPasswordReset, updatePassword,
    signInWithGoogle, sendSignInCode,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setConfirm('');
    setOtpSent(false);
    setError(null);
    setNotice(null);
  };

  const validate = (): string | null => {
    if (mode === 'otp') return EMAIL_RE.test(email.trim()) ? null : 'Enter a valid email address.';
    if (recoveryMode) {
      if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
      if (password !== confirm) return 'Passwords do not match.';
      return null;
    }
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    if (mode === 'forgot') return null;
    if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
    if (mode === 'signup' && password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'otp') {
        const { error: err } = await sendSignInCode(email.trim());
        if (err) setError(err);
        else {
          setOtpSent(true);
          setNotice('Sign-in link sent. Check your email and tap the link to sign in.');
        }
      } else if (recoveryMode) {
        const { error: err } = await updatePassword(password);
        if (err) setError(err);
        else {
          setResetDone(true);
          clearRecoveryMode();
        }
      } else if (mode === 'signin') {
        const { error: err } = await signIn(email.trim(), password);
        if (err) setError(err);
      } else if (mode === 'signup') {
        const { error: err, needsEmailConfirmation } = await signUp(email.trim(), password);
        if (err) setError(err);
        else if (needsEmailConfirmation) {
          switchMode('signin');
          setNotice('Account created. Check your email to confirm your address, then sign in.');
        }
      } else {
        const { error: err } = await sendPasswordReset(email.trim());
        if (err) setError(err);
        else {
          switchMode('signin');
          setNotice('Password reset link sent. Check your email.');
        }
      }
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    setPending(true);
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err);
      setPending(false);
    }
    // On success the browser is navigating to Google; keep the pending state.
  };

  if (!loading && user && !recoveryMode && !resetDone) {
    return <Navigate to={from} replace />;
  }

  const title = recoveryMode
    ? 'Choose a new password'
    : mode === 'signin'
      ? 'Sign in to StockSense'
      : mode === 'signup'
        ? 'Create your account'
        : mode === 'otp'
          ? 'Sign in with an email link'
          : 'Reset your password';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Seo
        title="Sign in — StockSense"
        description="Sign in or create a free StockSense account for the Indian stock market dashboard."
        path="/auth"
        noindex
      />
      <header className="px-5 pt-6">
        <Link to="/" className="mx-auto flex w-fit items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-[17px] font-bold tracking-tight">StockSense</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/60 p-8">
          {resetDone ? (
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight">Password updated</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Your password has been changed. You are signed in.
              </p>
              <Button className="mt-6 w-full rounded-full" onClick={() => navigate('/', { replace: true })}>
                Go to dashboard
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-center text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                {recoveryMode
                  ? 'Enter a new password for your account.'
                  : mode === 'forgot'
                    ? 'We will email you a password reset link.'
                    : mode === 'otp'
                      ? 'Passwordless sign-in with a one-time email link.'
                      : 'Free account for the Indian market dashboard.'}
              </p>

              {!recoveryMode && mode !== 'forgot' && mode !== 'otp' && (
                <div className="mt-6 grid grid-cols-2 rounded-full border border-border bg-background/60 p-1 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className={`rounded-full py-2 transition-colors ${mode === 'signin' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className={`rounded-full py-2 transition-colors ${mode === 'signup' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Create account
                  </button>
                </div>
              )}

              {notice && (
                <div className="mt-5 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm text-foreground" role="status">
                  {notice}
                </div>
              )}
              {error && (
                <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}

              {!recoveryMode && mode !== 'otp' && ENABLED_OAUTH_PROVIDERS.google && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 w-full rounded-full"
                    onClick={handleGoogle}
                    disabled={pending}
                  >
                    {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleMark />}
                    Continue with Google
                  </Button>
                  <div className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    or with email
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
                {(!recoveryMode && !(mode === 'otp' && otpSent)) && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-email">Email</Label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={pending}
                      required
                    />
                  </div>
                )}

                {mode !== 'forgot' && mode !== 'otp' && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">{recoveryMode ? 'New password' : 'Password'}</Label>
                    <Input
                      id="auth-password"
                      type="password"
                      autoComplete={mode === 'signup' || recoveryMode ? 'new-password' : 'current-password'}
                      placeholder={`At least ${MIN_PASSWORD} characters`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={pending}
                      required
                    />
                  </div>
                )}

                {(mode === 'signup' || recoveryMode) && (
                  <div className="space-y-2">
                    <Label htmlFor="auth-confirm">Confirm password</Label>
                    <Input
                      id="auth-confirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={pending}
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full rounded-full" disabled={pending}>
                  {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {recoveryMode
                    ? 'Update password'
                    : mode === 'signin'
                      ? 'Sign in'
                      : mode === 'signup'
                        ? 'Create account'
                        : mode === 'otp'
                          ? otpSent ? 'Resend sign-in link' : 'Email me a sign-in link'
                          : 'Send reset link'}
                </Button>
              </form>

              <div className="mt-5 space-y-2 text-center text-sm">
                {recoveryMode ? null : mode === 'signin' ? (
                  <>
                    <div>
                      <button type="button" onClick={() => switchMode('forgot')} className="text-muted-foreground transition-colors hover:text-foreground">
                        Forgot password?
                      </button>
                    </div>
                    <div>
                      <button type="button" onClick={() => switchMode('otp')} className="text-muted-foreground transition-colors hover:text-foreground">
                        Sign in with an email link instead
                      </button>
                    </div>
                  </>
                ) : mode === 'forgot' || mode === 'otp' ? (
                  <div>
                    <button type="button" onClick={() => switchMode('signin')} className="text-muted-foreground transition-colors hover:text-foreground">
                      Back to sign in
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
