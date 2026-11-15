import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { Check, CheckCheck, NotebookPen, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/status-badge';
import { api, formatDate, formatTime } from '@/lib/client';
export function SessionCard({ appointment: a }) {
    const { mutate } = useSWRConfig();
    const [editing, setEditing] = useState(false);
    const [notes, setNotes] = useState(a.notes);
    const [busy, setBusy] = useState(false);
    async function act(body, success) {
        setBusy(true);
        try {
            await api(`/api/appointments/${a.id}`, 'PATCH', body);
            toast.success(success);
            setEditing(false);
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
        <div>
          <p className="font-medium">{a.patient.name}</p>
          <p className="text-sm text-muted-foreground">
            {a.service.name} &middot; {formatDate(a.start)}, {formatTime(a.start)} - {formatTime(a.end)}
          </p>
          {a.reason && (<p className="mt-2 text-sm">
              <span className="font-medium">Reason:</span> <span className="text-muted-foreground">{a.reason}</span>
            </p>)}
        </div>
        <StatusBadge status={a.status}/>
      </div>

      {a.notes && !editing && (<div className="mt-4 rounded-lg bg-muted p-3 text-sm">
          <p className="mb-1 font-medium">Consultation notes</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{a.notes}</p>
        </div>)}

      {a.feedback && (<p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true"/>
          {a.feedback.rating}/5 {a.feedback.comment && `- "${a.feedback.comment}"`}
        </p>)}

      <div className="mt-4 flex flex-wrap gap-2">
        {a.status === 'pending' && (<Button size="sm" disabled={busy} onClick={() => act({ action: 'approve' }, 'Session approved.')}>
            <Check className="size-4" aria-hidden="true"/>
            Approve
          </Button>)}
        {a.status === 'approved' && (<Button size="sm" disabled={busy} onClick={() => act({ action: 'complete' }, 'Session marked complete.')}>
            <CheckCheck className="size-4" aria-hidden="true"/>
            Mark complete
          </Button>)}
        {a.status !== 'cancelled' && (<Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            <NotebookPen className="size-4" aria-hidden="true"/>
            {a.notes ? 'Edit notes' : 'Add notes'}
          </Button>)}
        {(a.status === 'pending' || a.status === 'approved') && (<Button size="sm" variant="ghost" disabled={busy} onClick={() => act({ action: 'cancel' }, 'Session cancelled.')}>
            <X className="size-4" aria-hidden="true"/>
            Cancel
          </Button>)}
      </div>

      {editing && (<form className="mt-4 flex flex-col gap-2 border-t pt-4" onSubmit={(e) => {
                e.preventDefault();
                act({ action: 'notes', notes }, 'Notes saved.');
            }}>
          <Label htmlFor={`notes-${a.id}`}>Consultation notes</Label>
          <Textarea id={`notes-${a.id}`} rows={4} value={notes} maxLength={5000} onChange={(e) => setNotes(e.target.value)}/>
          <div>
            <Button size="sm" type="submit" disabled={busy}>
              Save notes
            </Button>
          </div>
        </form>)}
    </li>);
}
