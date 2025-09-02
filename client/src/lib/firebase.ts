import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKEK1tBDqxHBuwiezIBlJkiWIgGqROogY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "d2zero.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "d2zero",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "d2zero.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "510533297980",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:510533297980:web:249548ef6aa0d05740e039"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export interface SessionData {
  email: string;
  sessionId: string;
  loginTime: number;
  deviceId: string;
  isTrialUser: boolean;
}

export class FirebaseAuthManager {
  private static instance: FirebaseAuthManager;
  private currentUser: User | null = null;
  private sessionData: SessionData | null = null;
  private trialTimer: NodeJS.Timeout | null = null;
  private sessionCheckInterval: NodeJS.Timeout | null = null;
  private onLogoutCallback: (() => void) | null = null;
  private deviceId: string;

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.setupAuthStateListener();
  }

  static getInstance(): FirebaseAuthManager {
    if (!FirebaseAuthManager.instance) {
      FirebaseAuthManager.instance = new FirebaseAuthManager();
    }
    return FirebaseAuthManager.instance;
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  private setupAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (!user) {
        this.cleanup();
      }
    });
  }

  setLogoutCallback(callback: () => void) {
    this.onLogoutCallback = callback;
  }

  async login(email: string, password: string): Promise<void> {
    try {
      // Check if trial user is trying to login again from same device
      if (email === 'trial@d2zero.com') {
        const lastTrialTime = localStorage.getItem('lastTrialTime');
        if (lastTrialTime) {
          const timeSinceLastTrial = Date.now() - parseInt(lastTrialTime);
          // If less than 24 hours since last trial (86400000 ms)
          if (timeSinceLastTrial < 86400000) {
            throw new Error('Trial time is over. Please try again after 24 hours.');
          }
        }

        // Check if trial user is already logged in from another device
        await this.checkAndClearExistingSessions(email, true);
      } else {
        // For regular users, check if already logged in from another device
        await this.checkAndClearExistingSessions(email, false);
      }

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create session data
      const sessionId = this.generateSessionId();
      const isTrialUser = email === 'trial@d2zero.com';
      
      this.sessionData = {
        email,
        sessionId,
        loginTime: Date.now(),
        deviceId: this.deviceId,
        isTrialUser
      };

      // Store session in Firestore
      await setDoc(doc(db, 'sessions', user.uid), {
        ...this.sessionData,
        userId: user.uid
      });

      // Store locally for quick access
      localStorage.setItem('sessionData', JSON.stringify(this.sessionData));

      // For trial users, store the trial time
      if (isTrialUser) {
        localStorage.setItem('lastTrialTime', Date.now().toString());
        this.startTrialTimer();
      }

      // Start session monitoring
      this.startSessionMonitoring();

    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  private async checkAndClearExistingSessions(email: string, isTrialUser: boolean): Promise<void> {
    try {
      // Query for existing sessions with this email
      const sessionsRef = collection(db, 'sessions');
      const q = query(sessionsRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      for (const docSnapshot of querySnapshot.docs) {
        const sessionData = docSnapshot.data() as SessionData & { userId: string };
        
        if (isTrialUser) {
          // For trial users, clear any existing session regardless of device
          await deleteDoc(doc(db, 'sessions', docSnapshot.id));
        } else {
          // For regular users, only allow one session per email
          if (sessionData.deviceId !== this.deviceId) {
            // Clear the existing session from another device
            await deleteDoc(doc(db, 'sessions', docSnapshot.id));
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing sessions:', error);
      // Continue with login even if session check fails
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startTrialTimer() {
    if (this.trialTimer) {
      clearTimeout(this.trialTimer);
    }

    // 2-minute timer (120,000 ms)
    this.trialTimer = setTimeout(() => {
      this.handleTrialExpiry();
    }, 120000);
  }

  private startSessionMonitoring() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Check every 10 seconds for session validity
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionValidity();
    }, 10000);
  }

  private async checkSessionValidity() {
    if (!this.currentUser || !this.sessionData) return;

    try {
      // Check if our session still exists in Firestore
      const sessionDoc = await getDoc(doc(db, 'sessions', this.currentUser.uid));
      
      if (!sessionDoc.exists()) {
        // Session was removed (likely by another login)
        this.handleSessionConflict();
        return;
      }

      const storedSession = sessionDoc.data() as SessionData & { userId: string };
      
      // Check if session ID matches (to detect if replaced by another login)
      if (storedSession.sessionId !== this.sessionData.sessionId) {
        this.handleSessionConflict();
        return;
      }

      // For trial users, check if time has expired
      if (this.sessionData.isTrialUser) {
        const timeElapsed = Date.now() - this.sessionData.loginTime;
        if (timeElapsed >= 120000) { // 2 minutes
          this.handleTrialExpiry();
          return;
        }
      }
    } catch (error) {
      console.error('Error checking session validity:', error);
    }
  }

  private handleSessionConflict() {
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
    this.logout();
  }

  private handleTrialExpiry() {
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
    this.logout();
  }

  async logout(): Promise<void> {
    try {
      // Clear session from Firestore
      if (this.currentUser) {
        await deleteDoc(doc(db, 'sessions', this.currentUser.uid));
      }

      // Sign out from Firebase
      await signOut(auth);
      
      this.cleanup();
    } catch (error) {
      console.error('Logout error:', error);
      this.cleanup();
    }
  }

  private cleanup() {
    // Clear timers
    if (this.trialTimer) {
      clearTimeout(this.trialTimer);
      this.trialTimer = null;
    }
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }

    // Clear local data
    localStorage.removeItem('sessionData');
    
    this.sessionData = null;
    this.currentUser = null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.sessionData;
  }

  getSessionInfo(): SessionData | null {
    return this.sessionData;
  }

  getRemainingTime(): number {
    if (!this.sessionData?.isTrialUser) return Infinity;
    
    const timeElapsed = Date.now() - this.sessionData.loginTime;
    const remaining = 120000 - timeElapsed; // 2 minutes in ms
    return Math.max(0, remaining);
  }

  // Initialize session from localStorage on app start
  async initializeSession(): Promise<boolean> {
    try {
      const storedSession = localStorage.getItem('sessionData');
      if (!storedSession) return false;

      const sessionData = JSON.parse(storedSession) as SessionData;
      
      // Check if trial user and time has expired
      if (sessionData.isTrialUser) {
        const timeElapsed = Date.now() - sessionData.loginTime;
        if (timeElapsed >= 120000) {
          localStorage.removeItem('sessionData');
          return false;
        }
      }

      // Verify session still exists in Firestore
      if (this.currentUser) {
        const sessionDoc = await getDoc(doc(db, 'sessions', this.currentUser.uid));
        if (sessionDoc.exists()) {
          const storedFirebaseSession = sessionDoc.data() as SessionData & { userId: string };
          if (storedFirebaseSession.sessionId === sessionData.sessionId) {
            this.sessionData = sessionData;
            
            if (sessionData.isTrialUser) {
              this.startTrialTimer();
            }
            this.startSessionMonitoring();
            return true;
          }
        }
      }

      // Session invalid, clear it
      localStorage.removeItem('sessionData');
      return false;
    } catch (error) {
      console.error('Error initializing session:', error);
      localStorage.removeItem('sessionData');
      return false;
    }
  }
}

export const firebaseAuthManager = FirebaseAuthManager.getInstance();