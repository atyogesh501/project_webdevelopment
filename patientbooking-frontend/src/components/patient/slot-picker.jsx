import { useState } from 'react';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { fetcher, formatTime, todayISODate } from '@/lib/client';
export function SlotPicker({ doctorId, serviceId, excludeId, value, onChange, idPrefix = 'slot', }) {
    const [date, setDate] = useState(todayISODate());
    const params = new URLSearchParams({ date, serviceId });
    if (excludeId)
        params.set('exclude', excludeId);
    const { data, error, isLoading } = useSWR(date ? `/api/doctors/${doctorId}/slots?${params}` : null, fetcher);
    return (<div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor={`${idPrefix}-date`}>Date</Label>
        <Input id={`${idPrefix}-date`} type="date" min={todayISODate()} value={date} onChange={(e) => {
            setDate(e.target.value);
            onChange(null);
        }}/>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Available times (clinic time)</legend>
        {isLoading ? (<p className="text-sm text-muted-foreground">Loading slots...</p>) : error ? (<p className="text-sm text-destructive">{error.message}</p>) : !data?.slots.length ? (<p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            No open slots on this day. Try another date.
          </p>) : (<div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
            {data.slots.map((slot) => (<button key={slot} type="button" aria-pressed={value === slot} onClick={() => onChange(slot)} className={cn('rounded-md border px-2 py-2 text-sm font-medium transition-colors', value === slot
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card hover:border-primary/50 hover:bg-accent')}>
                {formatTime(slot)}
              </button>))}
          </div>)}
      </fieldset>
    </div>);
}
