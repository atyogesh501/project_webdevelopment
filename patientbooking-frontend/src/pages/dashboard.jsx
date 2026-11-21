import { useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { PatientDashboard } from '@/components/patient/patient-dashboard'
import { DoctorDashboard } from '@/components/doctor/doctor-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { useSession } from '@/lib/session'

export default function DashboardPage() {
  const { user } = useSession()

  useEffect(() => {
    document.title = 'Dashboard | Meridian Clinic'
  }, [])

  if (user.role === 'doctor') {
    return (
      <AppShell user={user} title="Clinician workspace" description="Review requests, run sessions and keep your schedule up to date.">
        <DoctorDashboard />
      </AppShell>
    )
  }
  if (user.role === 'admin') {
    return (
      <AppShell user={user} title="Clinic administration" description="Manage services, clinicians and every appointment across the clinic.">
        <AdminDashboard />
      </AppShell>
    )
  }
  return (
    <AppShell user={user} title={`Hello, ${user.name.split(' ')[0]}`} description="Book a consultation or manage your upcoming visits.">
      <PatientDashboard />
    </AppShell>
  )
}
