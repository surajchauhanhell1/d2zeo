import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface SessionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionConflictModal({ isOpen, onClose }: SessionConflictModalProps) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(10);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <DialogTitle>Session Conflict</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Your trial account has been logged in from another location. Only one active session is allowed for trial accounts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              You will be automatically logged out in <span className="font-bold text-destructive">{countdown}</span> seconds.
            </p>
          </div>
          
          <Button 
            onClick={onClose} 
            className="w-full"
            variant="destructive"
          >
            Logout Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}