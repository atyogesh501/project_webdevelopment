import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/client'
import { getGoogleIdToken, isFirebaseConfigured, signOutOfFirebase } from '@/lib/firebase'
import { useSession } from '@/lib/session'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77z" />
    </svg>
  )
}

export function GoogleSignInButton() {
  const navigate = useNavigate()
  const { mutate } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  async function onClick() {
    setError(null)
    setPending(true)
    try {
      const idToken = await getGoogleIdToken()
      const { user } = await api('/api/auth/google', 'POST', { idToken })
      await mutate({ user }, { revalidate: false })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      await signOutOfFirebase()
      setError(err.message)
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="outline" size="lg" className="w-full" disabled={pending} onClick={onClick}>
        <GoogleIcon />
        {pending ? 'Signing in...' : 'Continue with Google'}
      </Button>
      {!isFirebaseConfigured && (
        <p className="text-xs text-muted-foreground">
          Google sign-in needs the <code className="font-mono">VITE_FIREBASE_*</code> environment variables.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
