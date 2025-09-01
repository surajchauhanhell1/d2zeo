import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loginWithEmail } from '@/lib/firebase';
import { User, Mail, Lock } from 'lucide-react';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export default function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await loginWithEmail(email, password);
      onAuthenticated();
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
      setEmail('');
      setPassword('');
      setTimeout(() => setError(''), 5000);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <User className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl font-black text-primary mb-2">Delta2zero</h1>
            <p className="text-muted-foreground">Sign in to access your files</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 pl-10"
                  data-testid="input-email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 pl-10"
                  data-testid="input-password"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 font-semibold"
              disabled={isLoading || !email || !password}
              data-testid="button-login"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                {error}
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Only registered users can access this application
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}