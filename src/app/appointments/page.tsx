
'use client';

import * as React from 'react';
import { PlusCircle, Calendar as CalendarIcon, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appointments as initialAppointments, Appointment, patients } from "@/lib/data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';


export default function AppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = React.useState(false);

  const now = new Date();
  
  const todaysAppointments = appointments.filter(
    (a) => new Date(a.date).toDateString() === now.toDateString()
  );

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.date) > now && new Date(a.date).toDateString() !== now.toDateString()
  );
  
  const pastAppointments = appointments.filter(
    (a) => new Date(a.date) < now && new Date(a.date).toDateString() !== now.toDateString()
  );

  const handleRowClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };
  
  const handleStatusChange = (newStatus: Appointment['status']) => {
    if (selectedAppointment) {
        // Here you would call your backend to update the status
        // For now, we update the local state
        setAppointments(prev => prev.map(app => 
            app.id === selectedAppointment.id ? {...app, status: newStatus} : app
        ));
        setSelectedAppointment(prev => prev ? {...prev, status: newStatus} : null);
    }
  };
  
  const AppointmentForm = ({ appointment, onClose }: { appointment?: Appointment | null, onClose: () => void }) => {
    const [patientName, setPatientName] = React.useState(appointment?.patientName || '');
    const [date, setDate] = React.useState<Date | undefined>(appointment ? new Date(appointment.date) : undefined);
    
    const appointmentDates = React.useMemo(() => 
        appointments.map(app => new Date(app.date)), 
    [appointments]);

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{appointment ? "Edit Appointment" : "New Appointment"}</DialogTitle>
                    <DialogDescription>
                        {appointment ? "Update the details for this appointment." : "Schedule a new appointment."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="patient-name">Patient Name</Label>
                        <Input 
                            id="patient-name"
                            placeholder="Select or type for a guest"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            list="patients-list"
                        />
                         <datalist id="patients-list">
                            {patients.map(p => <option key={p.id} value={p.name} />)}
                        </datalist>
                    </div>
                     <div className="grid gap-2">
                        <Label>Date</Label>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            components={{
                                DayContent: ({ date }) => {
                                    const isAppointmentDay = appointmentDates.some(d => d.toDateString() === date.toDateString());
                                    return (
                                        <div className="relative h-full w-full flex items-center justify-center">
                                            <span>{date.getDate()}</span>
                                            {isAppointmentDay && <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                                        </div>
                                    );
                                }
                            }}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" defaultValue={appointment?.time} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="service">Service</Label>
                            <Input id="service" defaultValue={appointment?.service} placeholder="e.g. Check-up" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" placeholder="Optional notes about the appointment." />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Appointment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  };


  const renderTable = (data: typeof appointments) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? data.map((appointment) => (
          <TableRow key={appointment.id} onClick={() => handleRowClick(appointment)} className="cursor-pointer">
            <TableCell className="font-medium">{appointment.patientName}</TableCell>
            <TableCell>{appointment.doctor}</TableCell>
            <TableCell>{appointment.service}</TableCell>
            <TableCell>
              {appointment.date} at {appointment.time}
            </TableCell>
            <TableCell>
                <Badge 
                    variant={
                        appointment.status === 'Completed' ? 'default' 
                        : appointment.status === 'Canceled' ? 'destructive'
                        : 'secondary'
                    }
                    className={cn({
                        'bg-green-100 text-green-800 border-green-200': appointment.status === 'Completed',
                        'bg-blue-100 text-blue-800 border-blue-200': appointment.status === 'Scheduled',
                        'bg-red-100 text-red-800 border-red-200': appointment.status === 'Canceled',
                        'bg-yellow-100 text-yellow-800 border-yellow-200': appointment.status === 'In-progress'
                    })}
                >
                    {appointment.status}
                </Badge>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={5} className="text-center h-24">No appointments found.</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout>
        {isDetailsModalOpen && selectedAppointment && (
             <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Appointment Details</DialogTitle>
                        <DialogDescription>
                            Viewing appointment for {selectedAppointment.patientName} on {selectedAppointment.date}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p><strong>Patient:</strong> {selectedAppointment.patientName}</p>
                        <p><strong>Doctor:</strong> {selectedAppointment.doctor}</p>
                        <p><strong>Service:</strong> {selectedAppointment.service}</p>
                        <p><strong>Date:</strong> {selectedAppointment.date}</p>
                        <p><strong>Time:</strong> {selectedAppointment.time}</p>
                        <div className="flex items-center gap-2">
                            <strong>Status:</strong>
                            <Badge 
                                variant={
                                    selectedAppointment.status === 'Completed' ? 'default' 
                                    : selectedAppointment.status === 'Canceled' ? 'destructive'
                                    : 'secondary'
                                }
                                className={cn({
                                    'bg-green-100 text-green-800 border-green-200': selectedAppointment.status === 'Completed',
                                    'bg-blue-100 text-blue-800 border-blue-200': selectedAppointment.status === 'Scheduled',
                                    'bg-red-100 text-red-800 border-red-200': selectedAppointment.status === 'Canceled',
                                    'bg-yellow-100 text-yellow-800 border-yellow-200': selectedAppointment.status === 'In-progress'
                                })}
                            >
                                {selectedAppointment.status}
                            </Badge>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <div className="flex gap-2">
                             <Button onClick={() => handleStatusChange('Completed')} disabled={selectedAppointment.status === 'Completed'}>Complete</Button>
                             <Button onClick={() => handleStatusChange('In-progress')} disabled={selectedAppointment.status === 'In-progress'}>Set In-Progress</Button>
                             <Button variant="destructive" onClick={() => handleStatusChange('Canceled')} disabled={selectedAppointment.status === 'Canceled'}>Cancel</Button>
                        </div>
                        <Button variant="outline" onClick={() => { setIsDetailsModalOpen(false); }}>Close</Button>
                    </DialogFooter>
                      <Separator />
                     <div className="pt-4">
                        <h4 className="font-semibold mb-2">Reschedule</h4>
                        <div className="flex gap-2">
                           <Input type="date" defaultValue={selectedAppointment.date} />
                           <Input type="time" defaultValue={selectedAppointment.time} />
                           <Button>Save Changes</Button>
                        </div>
                     </div>
                </DialogContent>
            </Dialog>
        )}

        {isNewAppointmentModalOpen && <AppointmentForm onClose={() => setIsNewAppointmentModalOpen(false)} />}


      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Citas</h1>
          <p className="text-muted-foreground">
            Visualiza y gestiona las citas de los pacientes.
          </p>
        </div>
        <Button size="sm" className="h-9 gap-1" onClick={() => setIsNewAppointmentModalOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            Nueva Cita
          </span>
        </Button>
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="upcoming">Próximas</TabsTrigger>
          <TabsTrigger value="past">Pasadas</TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>Citas de Hoy</CardTitle>
              <CardDescription>
                Citas programadas para el día de hoy.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(todaysAppointments)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Próximas Citas</CardTitle>
              <CardDescription>
                Citas agendadas para el futuro.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(upcomingAppointments)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="past">
            <Card>
                <CardHeader>
                <CardTitle>Citas Pasadas</CardTitle>
                <CardDescription>
                    Historial de todas las citas anteriores.
                </CardDescription>
                </CardHeader>
                <CardContent>{renderTable(pastAppointments)}</CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
