import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { StatusBadge } from '@/components/status-badge';
import { StatCard } from '@/components/stat-card';
import { api, fetcher, formatDate, formatPrice, formatTime } from '@/lib/client';
const STATUSES = ['pending', 'approved', 'completed', 'cancelled'];
export function AppointmentsPanel() {
    const { data, mutate, isLoading } = useSWR('/api/appointments', fetcher);
    const [status, setStatus] = useState('all');
    const [query, setQuery] = useState('');
    const all = data?.appointments ?? [];
    const q = query.trim().toLowerCase();
    const rows = all
        .filter((a) => status === 'all' || a.status === status)
        .filter((a) => !q || [a.patient.name, a.doctor.name, a.service.name].some((v) => v.toLowerCase().includes(q)))
        .sort((a, b) => b.start.localeCompare(a.start));
    const revenue = all.filter((a) => a.status === 'completed').reduce((sum, a) => sum + a.service.price, 0);
    const ratings = all.flatMap((a) => (a.feedback ? [a.feedback.rating] : []));
    const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1) : '-';
    async function setApptStatus(a, next) {
        try {
            await api(`/api/appointments/${a.id}`, 'PATCH', { action: 'status', status: next });
            toast.success(`Marked ${next}.`);
            mutate();
        }
        catch (err) {
            toast.error(err.message);
        }
    }
    async function remove(a) {
        if (!confirm('Permanently delete this appointment record?'))
            return;
        try {
            await api(`/api/appointments/${a.id}`, 'DELETE');
            toast.success('Appointment deleted.');
            mutate();
        }
        catch (err) {
            toast.error(err.message);
        }
    }
    return (<div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total appointments" value={all.length}/>
        <StatCard label="Awaiting approval" value={all.filter((a) => a.status === 'pending').length}/>
        <StatCard label="Completed revenue" value={formatPrice(revenue)}/>
        <StatCard label="Avg. rating" value={avgRating}/>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input type="search" placeholder="Search patient, clinician or service" aria-label="Search appointments" value={query} onChange={(e) => setQuery(e.target.value)} className="sm:max-w-xs"/>
        <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (<option key={s} value={s} className="capitalize">{s}</option>))}
        </NativeSelect>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">When</th>
              <th scope="col" className="px-4 py-3 font-medium">Patient</th>
              <th scope="col" className="px-4 py-3 font-medium">Clinician</th>
              <th scope="col" className="px-4 py-3 font-medium">Service</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>) : rows.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No appointments match.</td></tr>) : (rows.map((a) => (<tr key={a.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-medium">{formatDate(a.start)}</p>
                    <p className="text-muted-foreground">{formatTime(a.start)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{a.patient.name}</p>
                    <p className="text-muted-foreground">{a.patient.email}</p>
                  </td>
                  <td className="px-4 py-3">{a.doctor.name}</td>
                  <td className="px-4 py-3">{a.service.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status}/></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <NativeSelect aria-label={`Change status for ${a.patient.name}`} value={a.status} onChange={(e) => setApptStatus(a, e.target.value)} className="h-8 w-32">
                        {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </NativeSelect>
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => remove(a)} aria-label="Delete appointment">
                        <Trash2 className="size-4" aria-hidden="true"/>
                      </Button>
                    </div>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>
    </div>);
}
