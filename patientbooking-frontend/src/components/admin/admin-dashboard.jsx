import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentsPanel } from './appointments-panel';
import { DoctorsPanel } from './doctors-panel';
import { ServicesPanel } from './services-panel';
export function AdminDashboard() {
    return (<Tabs defaultValue="appointments">
      <TabsList>
        <TabsTrigger value="appointments">Appointments</TabsTrigger>
        <TabsTrigger value="doctors">Clinicians</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
      </TabsList>
      <TabsContent value="appointments" className="mt-6">
        <AppointmentsPanel />
      </TabsContent>
      <TabsContent value="doctors" className="mt-6">
        <DoctorsPanel />
      </TabsContent>
      <TabsContent value="services" className="mt-6">
        <ServicesPanel />
      </TabsContent>
    </Tabs>);
}
