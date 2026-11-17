import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, fetcher, formatPrice } from '@/lib/client';
const empty = { name: '', description: '', durationMinutes: 30, price: 50 };
export function ServicesPanel() {
    const { data, mutate } = useSWR('/api/services', fetcher);
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(empty);
    const [busy, setBusy] = useState(false);
    function startEdit(s) {
        setEditingId(s?.id ?? 'new');
        setDraft(s ? { name: s.name, description: s.description, durationMinutes: s.durationMinutes, price: s.price } : empty);
    }
    async function save(e) {
        e.preventDefault();
        setBusy(true);
        try {
            if (editingId === 'new')
                await api('/api/services', 'POST', draft);
            else
                await api(`/api/services/${editingId}`, 'PATCH', draft);
            toast.success('Service saved.');
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
    async function remove(s) {
        if (!confirm(`Delete "${s.name}"?`))
            return;
        try {
            await api(`/api/services/${s.id}`, 'DELETE');
            toast.success('Service deleted.');
            mutate();
        }
        catch (err) {
            toast.error(err.message);
        }
    }
    const form = (<form onSubmit={save} className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="svc-name">Name</Label>
        <Input id="svc-name" required minLength={2} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}/>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="svc-desc">Description</Label>
        <Textarea id="svc-desc" maxLength={500} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}/>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="svc-dur">Duration (minutes)</Label>
        <Input id="svc-dur" type="number" min={10} max={240} step={5} required value={draft.durationMinutes} onChange={(e) => setDraft({ ...draft, durationMinutes: Number(e.target.value) })}/>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="svc-price">Price (USD)</Label>
        <Input id="svc-price" type="number" min={0} step={1} required value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}/>
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save service'}</Button>
        <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
      </div>
    </form>);
    return (<div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Service categories</h2>
        <Button size="sm" onClick={() => startEdit()}>
          <Plus className="size-4" aria-hidden="true"/>
          New service
        </Button>
      </div>
      {editingId === 'new' && form}
      <ul className="flex flex-col gap-3">
        {data?.services.map((s) => editingId === s.id ? (<li key={s.id}>{form}</li>) : (<li key={s.id} className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.durationMinutes} min &middot; {formatPrice(s.price)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(s)}>
                  <Pencil className="size-4" aria-hidden="true"/>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(s)} aria-label={`Delete ${s.name}`}>
                  <Trash2 className="size-4" aria-hidden="true"/>
                </Button>
              </div>
            </li>))}
      </ul>
    </div>);
}
