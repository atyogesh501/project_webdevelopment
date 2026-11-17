import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { api, fetcher } from '@/lib/client';
const empty = { name: '', email: '', password: '', specialty: '', bio: '', serviceIds: [], active: true };
export function DoctorsPanel() {
    const { data, mutate } = useSWR('/api/doctors?all=1', fetcher);
    const { data: svc } = useSWR('/api/services', fetcher);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(empty);
    const [busy, setBusy] = useState(false);
    function startEdit(d) {
        setEditingId(d?.id ?? 'new');
        setDraft(d ? { name: d.name, email: d.email, password: '', specialty: d.specialty, bio: d.bio, serviceIds: d.serviceIds, active: d.active } : empty);
    }
    const toggleService = (id) => setDraft((p) => ({ ...p, serviceIds: p.serviceIds.includes(id) ? p.serviceIds.filter((s) => s !== id) : [...p.serviceIds, id] }));
    async function save(e) {
        e.preventDefault();
        setBusy(true);
        try {
            if (editingId === 'new') {
                const { active: _active, ...body } = draft;
                await api('/api/doctors', 'POST', body);
            }
            else {
                const { email: _e, password: _p, ...body } = draft;
                await api(`/api/doctors/${editingId}`, 'PATCH', body);
            }
            toast.success('Clinician saved.');
            setEditingId(null);
            mutate();
        }
        catch (err) {
            toast.error(err.message);
        }
        finally {
            setBusy(false);
        }
    }
    async function remove(d) {
        if (!confirm(`Remove ${d.name}? Their future appointments will be cancelled.`))
            return;
        try {
            await api(`/api/doctors/${d.id}`, 'DELETE');
            toast.success('Clinician removed.');
            mutate();
        }
        catch (err) {
            toast.error(err.message);
        }
    }
    const isNew = editingId === 'new';
    const form = (<form onSubmit={save} className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="doc-name">Full name</Label>
        <Input id="doc-name" required minLength={2} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="doc-spec">Specialty</Label>
        <Input id="doc-spec" required minLength={2} value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })}/>
      </div>
      {isNew && (<>
          <div className="flex flex-col gap-2">
            <Label htmlFor="doc-email">Login email</Label>
            <Input id="doc-email" type="email" required value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}/>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="doc-pass">Temporary password</Label>
            <Input id="doc-pass" type="password" autoComplete="new-password" required minLength={8} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })}/>
          </div>
        </>)}
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="doc-bio">Bio</Label>
        <Textarea id="doc-bio" maxLength={1000} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })}/>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-medium">Services offered</legend>
        <div className="flex flex-wrap gap-2">
          {svc?.services.map((s) => (<button key={s.id} type="button" aria-pressed={draft.serviceIds.includes(s.id)} onClick={() => toggleService(s.id)} className={cn('rounded-full border px-3 py-1 text-sm transition-colors', draft.serviceIds.includes(s.id) ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>
              {s.name}
            </button>))}
        </div>
      </fieldset>
      {!isNew && (<label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })}/>
          Accepting bookings
        </label>)}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>{busy ? 'Saving...' : isNew ? 'Add clinician' : 'Save changes'}</Button>
        <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
      </div>
    </form>);
    const serviceName = (id) => svc?.services.find((s) => s.id === id)?.name;
    return (<div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Clinicians</h2>
        <Button size="sm" onClick={() => startEdit()}>
          <Plus className="size-4" aria-hidden="true"/>
          Add clinician
        </Button>
      </div>
      {isNew && form}
      <ul className="flex flex-col gap-3">
        {data?.doctors.map((d) => editingId === d.id ? (<li key={d.id}>{form}</li>) : (<li key={d.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {d.name}
                  {!d.active && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>}
                </p>
                <p className="text-sm text-primary">{d.specialty}</p>
                <p className="text-sm text-muted-foreground">{d.email}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {d.serviceIds.map(serviceName).filter(Boolean).join(', ') || 'No services assigned'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(d)}>
                  <Pencil className="size-4" aria-hidden="true"/>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(d)} aria-label={`Remove ${d.name}`}>
                  <Trash2 className="size-4" aria-hidden="true"/>
                </Button>
              </div>
            </li>))}
      </ul>
    </div>);
}
