import { useEffect, useState } from 'react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { StaffLoginForm } from '@/components/auth/auth-form'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [showStaff, setShowStaff] = useState(false)

  useEffect(() => {
    document.title = 'Sign in | Meridian Clinic'
  }, [])

  return (
    <AuthLayout title="Welcome to Meridian" description="Patients sign in with Google to book and manage consultations.">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="patient-heading" className="flex flex-col gap-3">
          <h2 id="patient-heading" className="text-sm font-medium">
            Patients
          </h2>
          <GoogleSignInButton />
          <p className="text-xs text-muted-foreground">
            New here? Signing in with Google creates your patient account automatically.
          </p>
        </section>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Clinic staff
          <span className="h-px flex-1 bg-border" />
        </div>

        {showStaff ? (
          <StaffLoginForm />
        ) : (
          <Button type="button" variant="ghost" onClick={() => setShowStaff(true)}>
            Sign in with staff email
          </Button>
        )}
      </div>
    </AuthLayout>
  )
}
