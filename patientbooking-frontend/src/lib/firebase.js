import { getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
)

function firebaseAuth() {
  if (!isFirebaseConfigured) {
    throw new Error('Google sign-in is not configured. Add the VITE_FIREBASE_* environment variables.')
  }
  const app = getApps()[0] ?? initializeApp(firebaseConfig)
  return getAuth(app)
}

const POPUP_ERRORS = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
  'auth/unauthorized-domain': 'This domain is not authorised for Google sign-in in your Firebase project.',
}

/** Opens the Google popup and returns a Firebase ID token for the backend to verify. */
export async function getGoogleIdToken() {
  const auth = firebaseAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const result = await signInWithPopup(auth, provider)
    return await result.user.getIdToken()
  } catch (error) {
    throw new Error(POPUP_ERRORS[error?.code] ?? error?.message ?? 'Google sign-in failed.')
  }
}

export async function signOutOfFirebase() {
  if (!isFirebaseConfigured) return
  await signOut(firebaseAuth()).catch(() => {})
}
