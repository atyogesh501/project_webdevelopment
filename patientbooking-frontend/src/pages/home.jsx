import { Link } from 'react-router-dom'
import { CalendarCheck, ClipboardList, ShieldCheck } from 'lucide-react'
import { Brand } from '@/components/brand'
import { buttonVariants } from '@/components/ui/button'
import { useSession } from '@/lib/session'

const roles = [
  {
    icon: CalendarCheck,
    title: 'For patients',
    body: 'Sign in with Google, see real-time availability, book or reschedule in a few clicks, and rate your visit afterwards.',
  },
  {
    icon: ClipboardList,
    title: 'For clinicians',
    body: 'Set your weekly hours, approve or cancel requests, and keep consultation notes with every session.',
  },
  {
    icon: ShieldCheck,
    title: 'For clinic admins',
    body: 'Manage service categories, clinician profiles and every appointment from one dashboard.',
  },
]

export default function HomePage() {
  const { user } = useSession()

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Brand />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className={buttonVariants({ size: 'sm' })}>
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                Sign in
              </Link>
              <Link to="/login" className={buttonVariants({ size: 'sm' })}>
                Book a visit
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-medium text-primary">Smart clinic &amp; consultation booking</p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">Care that fits your calendar.</h1>
            <p className="max-w-md text-lg text-muted-foreground text-pretty">
              Meridian Clinic connects patients with the right clinician at the right time, with no phone queues and no
              double bookings.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to={user ? '/dashboard' : '/login'} className={buttonVariants({ size: 'lg' })}>
                Book a consultation
              </Link>
              <Link to="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Staff sign in
              </Link>
            </div>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border">
            <img
              src="/images/clinic-hero.png"
              alt="Bright, calm clinic reception area"
              className="size-full object-cover"
              fetchPriority="high"
            />
          </div>
        </section>

        <section aria-labelledby="roles-heading" className="border-t bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 id="roles-heading" className="text-2xl font-semibold tracking-tight">
              One system, three workspaces
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {roles.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex flex-col gap-3 rounded-xl border bg-background p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Meridian Clinic
      </footer>
    </div>
  )
}
