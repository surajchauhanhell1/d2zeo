import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface PasswordScreenProps {
  onAuthenticated: () => void;
  accessCode: string;
}

export default function PasswordScreen({ onAuthenticated, accessCode: correctAccessCode }: PasswordScreenProps) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a brief loading time for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (inputCode === correctAccessCode) {
      onAuthenticated();
    } else {
      setError('Invalid access code. Please try again.');
      setInputCode('');
      setTimeout(() => setError(''), 3000);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-bg">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-primary mb-2">Delta2zero</h1>
            <p className="text-muted-foreground">Enter access code to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="access-code" className="text-sm font-medium">
                Access Code
              </Label>
              <Input
                id="access-code"
                type="password"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Enter access code"
                className="h-12"
                data-testid="input-access-code"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 font-semibold"
              disabled={isLoading}
              data-testid="button-submit-password"
            >
              {isLoading ? 'Verifying...' : 'Access Files'}
            </Button>
            
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
