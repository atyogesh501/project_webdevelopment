import { Link } from 'react-router-dom'
import { Stethoscope } from 'lucide-react'

export function Brand({ href = '/' }) {
  return (
    <Link to={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Stethoscope className="size-4" aria-hidden="true" />
      </span>
      Meridian Clinic
    </Link>
  )
}
