import { useState } from 'react';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import { fetcher } from '@/lib/client';
import { SessionCard } from './session-card';
import { WorkingHoursForm } from './working-hours-form';
const FILTERS = ['pending', 'approved', 'completed', 'cancelled', 'all'];
export function DoctorDashboard() {
    const [filter, setFilter] = useState('pending');
    const { data, isLoading } = useSWR('/api/appointments', fetcher);
    const all = data?.appointments ?? [];
    const count = (s) => all.filter((a) => a.status === s).length;
    const visible = all
        .filter((a) => filter === 'all' || a.status === filter)
        .sort((a, b) => (filter === 'pending' || filter === 'approved' ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start)));
    return (<Tabs defaultValue="sessions">
      <TabsList>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="schedule">Schedule & profile</TabsTrigger>
      </TabsList>

      <TabsContent value="sessions" className="mt-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Awaiting approval" value={count('pending')}/>
          <StatCard label="Confirmed" value={count('approved')}/>
          <StatCard label="Completed" value={count('completed')}/>
          <StatCard label="Cancelled" value={count('cancelled')}/>
        </div>

        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (<button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn('rounded-full border px-3 py-1 text-sm capitalize transition-colors', filter === f ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}>
              {f}
            </button>))}
        </div>

        {isLoading ? (<p className="text-sm text-muted-foreground">Loading sessions...</p>) : visible.length === 0 ? (<p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">No sessions in this view.</p>) : (<ul className="flex flex-col gap-3">
            {visible.map((a) => (<SessionCard key={a.id} appointment={a}/>))}
          </ul>)}
      </TabsContent>

      <TabsContent value="schedule" className="mt-6">
        <WorkingHoursForm />
      </TabsContent>
    </Tabs>);
}
