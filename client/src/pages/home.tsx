import { useState, useEffect } from 'react';
import LoginScreen from '@/components/login-screen';
import FileGrid from '@/components/file-grid';
import TrialTimer from '@/components/trial-timer';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { authManager } from '@/lib/auth-manager';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isTrialUser, setIsTrialUser] = useState(false);

  useEffect(() => {
    // Set up logout callback
    authManager.setLogoutCallback(() => {
      setIsAuthenticated(false);
      setUserEmail(null);
      setIsTrialUser(false);
    });

    // Check initial authentication state
    const checkAuth = () => {
      const authenticated = authManager.isAuthenticated();
      const sessionInfo = authManager.getSessionInfo();
      
      setIsAuthenticated(authenticated);
      setUserEmail(sessionInfo?.email || null);
      setIsTrialUser(sessionInfo?.isTrialUser || false);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthenticated = () => {
    const sessionInfo = authManager.getSessionInfo();
    if (sessionInfo) {
      setIsAuthenticated(true);
      setUserEmail(sessionInfo.email);
      setIsTrialUser(sessionInfo.isTrialUser);
    }
  };

  const handleLogout = async () => {
    try {
      authManager.logout();
      setIsAuthenticated(false);
      setUserEmail(null);
      setIsTrialUser(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleTrialExpiry = () => {
    handleLogout();
  };
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center">
          <div className="text-primary text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-3xl font-black text-primary" data-testid="text-app-title">
              Delta2zero
            </h1>
            <div className="flex items-center gap-4">
              {userEmail && (
                <span className={`text-sm hidden sm:block ${
                  isTrialUser ? 'text-orange-600 font-medium' : 'text-muted-foreground'
                }`}>
                  {userEmail} {isTrialUser && '(Trial)'}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Trial Timer */}
      {isTrialUser && (
        <TrialTimer onExpiry={handleTrialExpiry} />
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileGrid />
      </main>
    </div>
  );
}
