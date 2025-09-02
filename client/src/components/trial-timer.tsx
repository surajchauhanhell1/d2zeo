import { useState, useEffect } from 'react';
import { firebaseAuthManager } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle } from 'lucide-react';

interface TrialTimerProps {
  onExpiry: () => void;
}

export default function TrialTimer({ onExpiry }: TrialTimerProps) {
  const [remainingTime, setRemainingTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const sessionInfo = firebaseAuthManager.getSessionInfo();
    if (!sessionInfo?.isTrialUser) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const updateTimer = () => {
      const remaining = firebaseAuthManager.getRemainingTime();
      setRemainingTime(remaining);

      if (remaining <= 0) {
        onExpiry();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [onExpiry]);

  if (!isVisible || remainingTime <= 0) {
    return null;
  }

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  const isLowTime = remainingTime < 30000; // Less than 30 seconds

  return (
    <Card className={`fixed top-20 right-4 z-50 transition-all duration-300 ${
      isLowTime ? 'bg-destructive/10 border-destructive animate-pulse' : 'bg-card'
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          {isLowTime ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : (
            <Clock className="w-4 h-4 text-primary" />
          )}
          <span className={`text-sm font-medium ${
            isLowTime ? 'text-destructive' : 'text-foreground'
          }`}>
            Trial: {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        {isLowTime && (
          <p className="text-xs text-destructive mt-1">
            Session expiring soon!
          </p>
        )}
      </CardContent>
    </Card>
  );
}