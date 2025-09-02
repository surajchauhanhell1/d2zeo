export interface SessionInfo {
  email: string;
  loginTime: number;
  sessionId: string;
  isTrialUser: boolean;
}

export class AuthManager {
  private static instance: AuthManager;
  private sessionInfo: SessionInfo | null = null;
  private trialTimer: NodeJS.Timeout | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private onLogoutCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  setLogoutCallback(callback: () => void) {
    this.onLogoutCallback = callback;
  }

  async login(email: string, password: string): Promise<void> {
    const sessionId = this.generateSessionId();
    const isTrialUser = email === 'trial@d2zero.com';
    
    // Check if trial user is already logged in elsewhere
    if (isTrialUser) {
      const activeSession = this.getActiveTrialSession();
      if (activeSession && activeSession.sessionId !== sessionId) {
        // Force logout the existing session
        this.forceLogoutExistingSession();
      }
    }

    // Create new session
    this.sessionInfo = {
      email,
      loginTime: Date.now(),
      sessionId,
      isTrialUser
    };

    // Store session info
    localStorage.setItem('authSession', JSON.stringify(this.sessionInfo));
    
    // Set trial session in a way that can be checked across tabs
    if (isTrialUser) {
      localStorage.setItem('activeTrialSession', JSON.stringify({
        sessionId,
        loginTime: this.sessionInfo.loginTime,
        email
      }));
    }

    // Start trial timer if trial user
    if (isTrialUser) {
      this.startTrialTimer();
    }

    // Start session monitoring
    this.startSessionMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getActiveTrialSession(): { sessionId: string; loginTime: number; email: string } | null {
    const stored = localStorage.getItem('activeTrialSession');
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private forceLogoutExistingSession() {
    // Set a flag that other tabs can detect
    localStorage.setItem('forceLogout', Date.now().toString());
    
    // Clear the existing session
    localStorage.removeItem('activeTrialSession');
  }

  private startTrialTimer() {
    // Clear any existing timer
    if (this.trialTimer) {
      clearTimeout(this.trialTimer);
    }

    // Set 2-minute timer (120,000 ms)
    this.trialTimer = setTimeout(() => {
      this.handleTrialExpiry();
    }, 120000);
  }

  private startSessionMonitoring() {
    // Clear any existing interval
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Check every 5 seconds for session conflicts
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity();
    }, 5000);

    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'forceLogout') {
      // Another session is forcing this one to logout
      this.logout();
    } else if (event.key === 'activeTrialSession' && this.sessionInfo?.isTrialUser) {
      // Check if our session is still the active one
      const activeSession = this.getActiveTrialSession();
      if (!activeSession || activeSession.sessionId !== this.sessionInfo.sessionId) {
        // Our session has been replaced
        this.logout();
      }
    }
  }

  private checkSessionValidity() {
    if (!this.sessionInfo) return;

    // Check if trial user session is still valid
    if (this.sessionInfo.isTrialUser) {
      const activeSession = this.getActiveTrialSession();
      if (!activeSession || activeSession.sessionId !== this.sessionInfo.sessionId) {
        // Session has been taken over by another login
        this.logout();
        return;
      }

      // Check if trial time has expired
      const timeElapsed = Date.now() - this.sessionInfo.loginTime;
      if (timeElapsed >= 120000) { // 2 minutes
        this.handleTrialExpiry();
        return;
      }
    }
  }

  private handleTrialExpiry() {
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
    this.logout();
  }

  logout() {
    // Clear timers
    if (this.trialTimer) {
      clearTimeout(this.trialTimer);
      this.trialTimer = null;
    }
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }

    // Clear session data
    if (this.sessionInfo?.isTrialUser) {
      localStorage.removeItem('activeTrialSession');
    }
    localStorage.removeItem('authSession');
    
    // Remove event listener
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    
    this.sessionInfo = null;
  }

  isAuthenticated(): boolean {
    if (!this.sessionInfo) {
      // Try to restore from localStorage
      const stored = localStorage.getItem('authSession');
      if (stored) {
        try {
          this.sessionInfo = JSON.parse(stored);
          
          // Check if trial session is still valid
          if (this.sessionInfo?.isTrialUser) {
            const timeElapsed = Date.now() - this.sessionInfo.loginTime;
            if (timeElapsed >= 120000) {
              this.logout();
              return false;
            }
            
            // Check if session is still active
            const activeSession = this.getActiveTrialSession();
            if (!activeSession || activeSession.sessionId !== this.sessionInfo.sessionId) {
              this.logout();
              return false;
            }
            
            // Restart monitoring for restored session
            this.startTrialTimer();
            this.startSessionMonitoring();
          }
        } catch {
          this.logout();
          return false;
        }
      }
    }
    
    return !!this.sessionInfo;
  }

  getSessionInfo(): SessionInfo | null {
    return this.sessionInfo;
  }

  getRemainingTime(): number {
    if (!this.sessionInfo?.isTrialUser) return Infinity;
    
    const timeElapsed = Date.now() - this.sessionInfo.loginTime;
    const remaining = 120000 - timeElapsed; // 2 minutes in ms
    return Math.max(0, remaining);
  }
}

export const authManager = AuthManager.getInstance();