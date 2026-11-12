import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSWRConfig } from 'swr'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/client'
import { signOutOfFirebase } from '@/lib/firebase'

export function LogoutButton() {
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()
  const [pending, setPending] = useState(false)

  async function onLogout() {
    setPending(true)
    try {
      await Promise.all([api('/api/auth/logout', 'POST'), signOutOfFirebase()])
    } finally {
      // Clear every cached response so the next user never sees stale data.
      await mutate(() => true, undefined, { revalidate: false })
      navigate('/login', { replace: true })
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={onLogout}>
      <LogOut className="size-4" aria-hidden="true" />
      Sign out
    </Button>
  )
}
