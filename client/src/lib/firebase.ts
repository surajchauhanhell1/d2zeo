// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getDatabase, ref, set, onValue, remove, push, onDisconnect } from "firebase/database";

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
export const database = getDatabase(app);

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
export const database = getDatabase(app);

interface SessionInfo {
  isTrialUser: boolean;
  sessionStartTime: number;
  sessionDuration: number; // in milliseconds
  sessionId: string;
  email: string;
}

interface ActiveSession {
  sessionId: string;
  email: string;
  loginTime: number;
  lastActivity: number;
}
class FirebaseAuthManager {
  private sessionInfo: SessionInfo | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;
  private onSessionConflictCallback: (() => void) | null = null;
  private database: any;
  private sessionRef: any = null;

  constructor() {
    this.database = getDatabase();
    // Check for existing session on initialization
    this.loadSessionFromStorage();
    this.setupSessionMonitoring();
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async checkExistingSession(email: string): Promise<boolean> {
    return new Promise((resolve) => {
      const sessionsRef = ref(this.database, 'activeSessions');
      onValue(sessionsRef, (snapshot) => {
        const sessions = snapshot.val() || {};
        const existingSession = Object.values(sessions).find(
          (session: any) => session.email === email
        );
        resolve(!!existingSession);
      }, { onlyOnce: true });
    });
  }

  private async createSession(email: string, sessionId: string) {
    const sessionData: ActiveSession = {
      sessionId,
      email,
      loginTime: Date.now(),
      lastActivity: Date.now()
    };

    this.sessionRef = ref(this.database, `activeSessions/${sessionId}`);
    await set(this.sessionRef, sessionData);
    
    // Set up automatic cleanup on disconnect
    onDisconnect(this.sessionRef).remove();
    
    // Update last activity every 30 seconds
    const activityInterval = setInterval(async () => {
      if (this.sessionRef) {
        try {
          await set(ref(this.database, `activeSessions/${sessionId}/lastActivity`), Date.now());
        } catch (error) {
          console.error('Failed to update activity:', error);
          clearInterval(activityInterval);
        }
      } else {
        clearInterval(activityInterval);
      }
    }, 30000);
  }

  private async removeSession() {
    if (this.sessionRef) {
      try {
        await remove(this.sessionRef);
        this.sessionRef = null;
      } catch (error) {
        console.error('Failed to remove session:', error);
      }
    }
  }

  private setupSessionMonitoring() {
    // Monitor for session conflicts
    const sessionsRef = ref(this.database, 'activeSessions');
    onValue(sessionsRef, (snapshot) => {
      if (!this.sessionInfo) return;
      
      const sessions = snapshot.val() || {};
      const currentEmail = this.sessionInfo.email;
      const currentSessionId = this.sessionInfo.sessionId;
      
      // Check if there's another session with the same email
      const conflictingSessions = Object.values(sessions).filter(
        (session: any) => session.email === currentEmail && session.sessionId !== currentSessionId
      );
      
      if (conflictingSessions.length > 0) {
        console.log('Session conflict detected - another login with same email');
        this.handleSessionConflict();
      }
    });
  }

  private async handleSessionConflict() {
    console.log('Session terminated due to conflict');
    this.stopSessionMonitoring();
    await this.removeSession();
    this.sessionInfo = null;
    this.saveSessionToStorage();
    
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error during conflict logout:', error);
    }
    
    if (this.onSessionConflictCallback) {
      this.onSessionConflictCallback();
    }
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
    // Check if email is already logged in
    const hasExistingSession = await this.checkExistingSession(email);
    if (hasExistingSession) {
      throw new Error('This email is already logged in from another device or browser. Please try again later.');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const sessionId = this.generateSessionId();
    
    // Check if this is a trial user
    const isTrialUser = email.toLowerCase() === 'trial@d2zero.com';
    
    if (isTrialUser) {
      this.sessionInfo = {
        isTrialUser: true,
        sessionStartTime: Date.now(),
        sessionDuration: 2 * 60 * 1000, // 2 minutes in milliseconds
        sessionId,
        email: email.toLowerCase(),
      };
      this.saveSessionToStorage();
      this.startSessionMonitoring();
    } else {
      this.sessionInfo = {
        isTrialUser: false,
        sessionStartTime: Date.now(),
        sessionDuration: 0,
        sessionId,
        email: email.toLowerCase(),
      };
      this.saveSessionToStorage();
    }
    
    // Create session in database
    await this.createSession(email.toLowerCase(), sessionId);
    
    return user;
  }

  async logout(): Promise<void> {
    this.stopSessionMonitoring();
    await this.removeSession();
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
export const firebaseAuthManager = new FirebaseAuthManager();

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