import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { CalendarClock, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import { api, formatDate, formatTime } from '@/lib/client';
import { SlotPicker } from './slot-picker';
export function AppointmentCard({ appointment: a }) {
    const { mutate } = useSWRConfig();
    const [mode, setMode] = useState('idle');
    const [slot, setSlot] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const canChange = a.status === 'pending' || a.status === 'approved';
    async function act(body, success) {
        setBusy(true);
        try {
            await api(`/api/appointments/${a.id}`, 'PATCH', body);
            toast.success(success);
            setMode('idle');
            mutate('/api/appointments');
        }
        catch (err) {
            toast.error(err.message);
        }
        finally {
            setBusy(false);
        }
    }
    return (<li className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary py-2 text-secondary-foreground">
            <span className="text-xs uppercase">{formatDate(a.start).split(',')[0]}</span>
            <span className="text-lg font-semibold leading-tight">{new Date(a.start).getUTCDate()}</span>
          </div>
          <div>
            <p className="font-medium">{a.service.name}</p>
            <p className="text-sm text-muted-foreground">
              {a.doctor.name} &middot; {a.doctor.specialty}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatDate(a.start)}, {formatTime(a.start)} - {formatTime(a.end)}
            </p>
          </div>
        </div>
        <StatusBadge status={a.status}/>
      </div>

      {a.notes && (<div className="mt-4 rounded-lg bg-muted p-3 text-sm">
          <p className="mb-1 font-medium">Clinician notes</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{a.notes}</p>
        </div>)}

      {a.feedback && (<div className="mt-4 flex items-start gap-2 text-sm">
          <span className="flex" aria-label={`Rated ${a.feedback.rating} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (<Star key={i} className={cn('size-4', i < a.feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-border')} aria-hidden="true"/>))}
          </span>
          {a.feedback.comment && <p className="text-muted-foreground">{a.feedback.comment}</p>}
        </div>)}

      <div className="mt-4 flex flex-wrap gap-2">
        {canChange && (<>
            <Button size="sm" variant="outline" onClick={() => setMode(mode === 'reschedule' ? 'idle' : 'reschedule')}>
              <CalendarClock className="size-4" aria-hidden="true"/>
              Reschedule
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => act({ action: 'cancel' }, 'Appointment cancelled.')}>
              <X className="size-4" aria-hidden="true"/>
              Cancel
            </Button>
          </>)}
        {a.status === 'completed' && !a.feedback && (<Button size="sm" variant="outline" onClick={() => setMode(mode === 'feedback' ? 'idle' : 'feedback')}>
            <Star className="size-4" aria-hidden="true"/>
            Leave feedback
          </Button>)}
      </div>

      {mode === 'reschedule' && (<div className="mt-4 flex flex-col gap-4 border-t pt-4">
          <SlotPicker idPrefix={`r-${a.id}`} doctorId={a.doctor.id} serviceId={a.service.id} excludeId={a.id} value={slot} onChange={setSlot}/>
          <div>
            <Button size="sm" disabled={!slot || busy} onClick={() => act({ action: 'reschedule', start: slot }, 'Appointment rescheduled. Awaiting confirmation.')}>
              Confirm new time
            </Button>
          </div>
        </div>)}

      {mode === 'feedback' && (<form className="mt-4 flex flex-col gap-3 border-t pt-4" onSubmit={(e) => {
                e.preventDefault();
                act({ action: 'feedback', rating, comment }, 'Thanks for your feedback!');
            }}>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Rating</legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (<button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} aria-pressed={rating === n}>
                  <Star className={cn('size-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-border')} aria-hidden="true"/>
                </button>))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`fb-${a.id}`}>Comments</Label>
            <Textarea id={`fb-${a.id}`} value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)}/>
          </div>
          <div>
            <Button size="sm" type="submit" disabled={busy}>
              Submit feedback
            </Button>
          </div>
        </form>)}
    </li>);
}
