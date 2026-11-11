import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/client'
import { useSession } from '@/lib/session'

const DEMO_ACCOUNTS = [
  { label: 'Clinician', email: 'doctor@clinic.dev', password: 'doctor123' },
  { label: 'Admin', email: 'admin@clinic.dev', password: 'admin123' },
]

export function StaffLoginForm() {
  const navigate = useNavigate()
  const { mutate } = useSession()
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const { user } = await api('/api/auth/login', 'POST', { email, password })
      await mutate({ user }, { revalidate: false })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Staff email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Please wait...' : 'Sign in as staff'}
        </Button>
      </form>

      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm font-medium">Demo staff accounts</p>
        <p className="mb-3 text-xs text-muted-foreground">Fill in credentials for a role.</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <Button
              key={a.email}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail(a.email)
                setPassword(a.password)
              }}
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
