// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

interface SessionInfo {
  isTrialUser: boolean;
  sessionStartTime: number;
  sessionDuration: number; // in milliseconds
}

class FirebaseAuthManager {
  private sessionInfo: SessionInfo | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;

  constructor() {
    // Check for existing session on initialization
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage() {
    const stored = localStorage.getItem('d2zero_session');
    if (stored) {
      try {
        this.sessionInfo = JSON.parse(stored);
        if (this.sessionInfo?.isTrialUser) {
          this.startSessionMonitoring();
        }
      } catch (error) {
        console.error('Failed to load session from storage:', error);
        localStorage.removeItem('d2zero_session');
      }
    }
  }

  private saveSessionToStorage() {
    if (this.sessionInfo) {
      localStorage.setItem('d2zero_session', JSON.stringify(this.sessionInfo));
    } else {
      localStorage.removeItem('d2zero_session');
    }
  }

  private startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(() => {
      if (this.isSessionExpired()) {
        this.handleSessionExpiry();
      }
    }, 1000); // Check every second
  }

  private stopSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  private isSessionExpired(): boolean {
    if (!this.sessionInfo?.isTrialUser) return false;
    
    const elapsed = Date.now() - this.sessionInfo.sessionStartTime;
    return elapsed >= this.sessionInfo.sessionDuration;
  }

  private async handleSessionExpiry() {
    console.log('Trial session expired, logging out user');
    this.stopSessionMonitoring();
    this.sessionInfo = null;
    this.saveSessionToStorage();
    
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during automatic logout:', error);
    }
    
    if (this.onSessionExpiredCallback) {
      this.onSessionExpiredCallback();
    }
  }

  async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if this is a trial user
    const isTrialUser = email.toLowerCase() === 'trial@d2zero.com';
    
    if (isTrialUser) {
      this.sessionInfo = {
        isTrialUser: true,
        sessionStartTime: Date.now(),
        sessionDuration: 2 * 60 * 1000, // 2 minutes in milliseconds
      };
      this.saveSessionToStorage();
      this.startSessionMonitoring();
    } else {
      this.sessionInfo = {
        isTrialUser: false,
        sessionStartTime: Date.now(),
        sessionDuration: 0,
      };
      this.saveSessionToStorage();
    }
    
    return user;
  }

  async logout(): Promise<void> {
    this.stopSessionMonitoring();
    this.sessionInfo = null;
    this.saveSessionToStorage();
    await signOut(auth);
  }

  getSessionInfo(): SessionInfo | null {
    return this.sessionInfo;
  }

  getRemainingTime(): number {
    if (!this.sessionInfo?.isTrialUser) return 0;
    
    const elapsed = Date.now() - this.sessionInfo.sessionStartTime;
    const remaining = this.sessionInfo.sessionDuration - elapsed;
    return Math.max(0, remaining);
  }

  onSessionExpired(callback: () => void) {
    this.onSessionExpiredCallback = callback;
  }

  // Check if another session might have started elsewhere
  checkForSessionConflict(): boolean {
    if (!this.sessionInfo?.isTrialUser) return false;
    
    // For trial users, we could implement additional checks here
    // For now, we'll rely on Firebase's built-in session management
    return false;
  }
}

export const firebaseAuthManager = new FirebaseAuthManager();

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKEK1tBDqxHBuwiezIBlJkiWIgGqROogY",
  authDomain: "d2zero.firebaseapp.com",
  projectId: "d2zero",
  storageBucket: "d2zero.firebasestorage.app",
  messagingSenderId: "510533297980",
  appId: "1:510533297980:web:249548ef6aa0d05740e039",
  measurementId: "G-6WVWVC6D1L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

// Auth helper functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    return await firebaseAuthManager.login(email, password);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logout = async () => {
  try {
    await firebaseAuthManager.logout();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};