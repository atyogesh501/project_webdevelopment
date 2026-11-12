import { Brand } from './brand';
import { LogoutButton } from './logout-button';
const roleLabel = { patient: 'Patient', doctor: 'Clinician', admin: 'Clinic Admin' };
export function AppShell({ user, title, description, children, }) {
    return (<div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Brand href="/dashboard"/>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabel[user.role]}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          <p className="mt-1 text-muted-foreground text-pretty">{description}</p>
        </div>
        {children}
      </main>
    </div>);
}
