import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { api, fetcher, formatDate, formatPrice, formatTime } from '@/lib/client';
import { SlotPicker } from './slot-picker';
export function BookingFlow({ onBooked }) {
    const { mutate } = useSWRConfig();
    const { data: serviceData } = useSWR('/api/services', fetcher);
    const [serviceId, setServiceId] = useState(null);
    const [doctorId, setDoctorId] = useState(null);
    const [slot, setSlot] = useState(null);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { data: doctorData } = useSWR(serviceId ? `/api/doctors?serviceId=${serviceId}` : null, fetcher);
    const service = serviceData?.services.find((s) => s.id === serviceId);
    const doctor = doctorData?.doctors.find((d) => d.id === doctorId);
    async function book() {
        if (!serviceId || !doctorId || !slot)
            return;
        setSubmitting(true);
        try {
            await api('/api/appointments', 'POST', { serviceId, doctorId, start: slot, reason });
            toast.success('Appointment requested. Your clinician will confirm shortly.');
            setSlot(null);
            setReason('');
            mutate('/api/appointments');
            mutate((key) => typeof key === 'string' && key.includes('/slots'));
            onBooked();
        }
        catch (err) {
            toast.error(err.message);
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Choose a service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceData?.services.map((s) => (<button key={s.id} type="button" aria-pressed={serviceId === s.id} onClick={() => {
                setServiceId(s.id);
                setDoctorId(null);
                setSlot(null);
            }} className={cn('flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors', serviceId === s.id ? 'border-primary bg-accent' : 'bg-card hover:border-primary/40')}>
                <span className="flex items-center justify-between gap-2 font-medium">
                  {s.name}
                  <span className="text-sm text-muted-foreground">{formatPrice(s.price)}</span>
                </span>
                <span className="text-sm text-muted-foreground">{s.description}</span>
                <span className="text-xs text-muted-foreground">{s.durationMinutes} min</span>
              </button>)) ?? <p className="text-sm text-muted-foreground">Loading services...</p>}
          </div>
        </CardContent>
      </Card>

      {serviceId && (<Card>
          <CardHeader>
            <CardTitle>2. Pick a clinician</CardTitle>
          </CardHeader>
          <CardContent>
            {!doctorData ? (<p className="text-sm text-muted-foreground">Loading clinicians...</p>) : doctorData.doctors.length === 0 ? (<p className="text-sm text-muted-foreground">No clinicians currently offer this service.</p>) : (<div className="grid gap-3 sm:grid-cols-2">
                {doctorData.doctors.map((d) => (<button key={d.id} type="button" aria-pressed={doctorId === d.id} onClick={() => {
                        setDoctorId(d.id);
                        setSlot(null);
                    }} className={cn('flex items-start gap-3 rounded-lg border p-4 text-left transition-colors', doctorId === d.id ? 'border-primary bg-accent' : 'bg-card hover:border-primary/40')}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {d.name.replace('Dr. ', '').split(' ').map((p) => p[0]).join('').slice(0, 2)}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-sm text-primary">{d.specialty}</span>
                      <span className="text-sm text-muted-foreground line-clamp-2">{d.bio}</span>
                    </span>
                  </button>))}
              </div>)}
          </CardContent>
        </Card>)}

      {serviceId && doctorId && (<Card>
          <CardHeader>
            <CardTitle>3. Select a time</CardTitle>
            <CardDescription>Slots reflect the clinician&apos;s working hours and existing bookings.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <SlotPicker key={`${doctorId}-${serviceId}`} doctorId={doctorId} serviceId={serviceId} value={slot} onChange={setSlot}/>
            <div className="flex flex-col gap-2">
              <Label htmlFor="reason">Reason for visit (optional)</Label>
              <Textarea id="reason" value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your symptoms or what you would like to discuss"/>
            </div>
            <div className="flex flex-col gap-3 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                {slot && service && doctor ? (<>
                    <span className="font-medium">{service.name}</span> with {doctor.name} on{' '}
                    <span className="font-medium">
                      {formatDate(slot)} at {formatTime(slot)}
                    </span>
                  </>) : (<span className="text-muted-foreground">Select a time slot to continue.</span>)}
              </p>
              <Button onClick={book} disabled={!slot || submitting}>
                {submitting ? 'Booking...' : 'Request appointment'}
              </Button>
            </div>
          </CardContent>
        </Card>)}
    </div>);
}
