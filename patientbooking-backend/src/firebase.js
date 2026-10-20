import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { HttpError } from './http.js'

// Verifying ID tokens only needs the project ID: firebase-admin checks the token
// signature against Google's public keys, so no service-account secret is required.
function firebaseAuth() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) throw new HttpError(500, 'Google sign-in is not configured on the server (FIREBASE_PROJECT_ID).')
  const app = getApps()[0] ?? initializeApp({ projectId })
  return getAuth(app)
}

export async function verifyGoogleIdToken(idToken) {
  try {
    const decoded = await firebaseAuth().verifyIdToken(idToken)
    if (decoded.firebase?.sign_in_provider !== 'google.com') {
      throw new HttpError(400, 'Please sign in with Google.')
    }
    if (!decoded.email || !decoded.email_verified) {
      throw new HttpError(400, 'Your Google account email must be verified.')
    }
    return decoded
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(401, 'Google sign-in could not be verified. Please try again.' + error.message)
  }
}
