import { useState } from 'react';
import PasswordScreen from '@/components/password-screen';
import FileGrid from '@/components/file-grid';
import AdminSettings from '@/components/admin-settings';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState(() => {
    // Load access code from localStorage or use default
    return localStorage.getItem('delta2zero-access-code') || 'delta2025';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleAccessCodeChange = (newCode: string) => {
    // Save to localStorage for persistence
    localStorage.setItem('delta2zero-access-code', newCode);
    setAccessCode(newCode);
  };

  if (!isAuthenticated) {
    return <PasswordScreen onAuthenticated={handleAuthenticated} accessCode={accessCode} />;
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              data-testid="button-admin-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileGrid />
      </main>
      
      {/* Admin Settings Modal */}
      <AdminSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentAccessCode={accessCode}
        onAccessCodeChange={handleAccessCodeChange}
      />
    </div>
  );
}
