import { useNavigate } from 'react-router-dom';
import { LogOut, Mail } from 'lucide-react';
import PageShell from '@/components/PageShell';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const AccountPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const created = user?.created_at ? new Date(user.created_at) : null;
  const initial = (user?.email ?? '?').charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <PageShell
      eyebrow="Account"
      title="Your account"
      sub="Manage your StockSense sign-in."
      seoTitle="Your account — StockSense"
      seoDescription="Manage your StockSense account."
      seoNoIndex
    >
      <div className="max-w-xl rounded-3xl border border-border bg-card/60 p-7 md:p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {initial}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{user?.email}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Signed in with email and password
              {created && ` · Joined ${created.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-xl border border-border bg-background/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Your watchlist and theme preferences stay on this device. Signing out only ends the
          session on this browser.
        </p>

        <Button onClick={handleSignOut} variant="outline" className="mt-6 rounded-full">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </PageShell>
  );
};

export default AccountPage;
