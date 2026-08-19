import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let adminApp: App | undefined;
let adminAuthInstance: Auth | undefined;

try {
  if (!getApps().length) {
    adminApp = initializeApp({
      projectId: firebaseConfig?.projectId || process.env.FIREBASE_PROJECT_ID || 'albarakah-store',
    });
  } else {
    adminApp = getApps()[0];
  }
  adminAuthInstance = getAuth(adminApp);
} catch (err) {
  console.warn('Firebase Admin SDK initialization warning:', err);
}

export const adminAuth = adminAuthInstance as Auth;

