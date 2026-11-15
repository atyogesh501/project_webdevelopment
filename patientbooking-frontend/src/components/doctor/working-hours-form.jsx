import { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, fetcher } from '@/lib/client';
import { WEEKDAYS } from '@/lib/types';
export function WorkingHoursForm() {
    const { data, mutate } = useSWR('/api/doctors/me', fetcher);
    if (!data)
        return <p className="text-sm text-muted-foreground">Loading schedule...</p>;
    return <Editor doctor={data.doctor} onSaved={(doctor) => mutate({ doctor }, { revalidate: false })}/>;
}
function Editor({ doctor, onSaved }) {
    const [hours, setHours] = useState(doctor.workingHours);
    const [bio, setBio] = useState(doctor.bio);
    const [saving, setSaving] = useState(false);
    const update = (day, patch) => setHours((prev) => prev.map((h) => (h.day === day ? { ...h, ...patch } : h)));
    async function save() {
        setSaving(true);
        try {
            const res = await api('/api/doctors/me', 'PATCH', { workingHours: hours, bio });
            onSaved(res.doctor);
            toast.success('Schedule updated.');
        }
        catch (err) {
            toast.error(err.message);
        }
        finally {
            setSaving(false);
        }
    }
    const ordered = [1, 2, 3, 4, 5, 6, 0].map((d) => hours.find((h) => h.day === d));
    return (<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Working hours</CardTitle>
          <CardDescription>Patients can only book inside these hours. Existing bookings are not affected.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {ordered.map((h) => (<li key={h.day} className="flex flex-wrap items-center gap-3 py-3">
                <label className="flex w-32 items-center gap-2 text-sm font-medium">
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={h.enabled} onChange={(e) => update(h.day, { enabled: e.target.checked })}/>
                  {WEEKDAYS[h.day]}
                </label>
                {h.enabled ? (<div className="flex items-center gap-2">
                    <Input type="time" aria-label={`${WEEKDAYS[h.day]} start`} className="w-32" value={h.start} onChange={(e) => update(h.day, { start: e.target.value })}/>
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input type="time" aria-label={`${WEEKDAYS[h.day]} end`} className="w-32" value={h.end} onChange={(e) => update(h.day, { end: e.target.value })}/>
                  </div>) : (<span className="text-sm text-muted-foreground">Unavailable</span>)}
              </li>))}
          </ul>
        </CardContent>
      </Card>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{doctor.specialty}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">Bio shown to patients</Label>
            <Textarea id="bio" rows={5} value={bio} maxLength={1000} onChange={(e) => setBio(e.target.value)}/>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </div>);
}
