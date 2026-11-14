import { useState } from 'react';
import useSWR from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetcher } from '@/lib/client';
import { BookingFlow } from './booking-flow';
import { AppointmentCard } from './appointment-card';
export function PatientDashboard() {
    const [tab, setTab] = useState('appointments');
    const { data, isLoading } = useSWR('/api/appointments', fetcher);
    const now = Date.now();
    const all = data?.appointments ?? [];
    const upcoming = all
        .filter((a) => new Date(a.end).getTime() >= now && a.status !== 'cancelled' && a.status !== 'completed')
        .sort((a, b) => a.start.localeCompare(b.start));
    const past = all.filter((a) => !upcoming.includes(a));
    return (<Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="appointments">My appointments</TabsTrigger>
        <TabsTrigger value="book">Book a visit</TabsTrigger>
      </TabsList>

      <TabsContent value="appointments" className="mt-6 flex flex-col gap-8">
        {isLoading ? (<p className="text-sm text-muted-foreground">Loading appointments...</p>) : (<>
            <section aria-labelledby="upcoming-heading">
              <h2 id="upcoming-heading" className="mb-3 text-lg font-semibold">
                Upcoming
              </h2>
              {upcoming.length === 0 ? (<div className="rounded-xl border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">You have no upcoming appointments.</p>
                  <button type="button" onClick={() => setTab('book')} className="mt-2 text-sm font-medium text-primary hover:underline">
                    Book your first visit
                  </button>
                </div>) : (<ul className="flex flex-col gap-3">
                  {upcoming.map((a) => (<AppointmentCard key={a.id} appointment={a}/>))}
                </ul>)}
            </section>
            {past.length > 0 && (<section aria-labelledby="history-heading">
                <h2 id="history-heading" className="mb-3 text-lg font-semibold">
                  History
                </h2>
                <ul className="flex flex-col gap-3">
                  {past.map((a) => (<AppointmentCard key={a.id} appointment={a}/>))}
                </ul>
              </section>)}
          </>)}
      </TabsContent>

      <TabsContent value="book" className="mt-6">
        <BookingFlow onBooked={() => setTab('appointments')}/>
      </TabsContent>
    </Tabs>);
}
