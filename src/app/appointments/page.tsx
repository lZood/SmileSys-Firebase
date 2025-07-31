'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, CalendarClock, ListTodo, CalendarDays } from 'lucide-react';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  add,
  isSameDay,
  isAfter,
  isBefore,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPatients } from '../patients/actions';
import { getUserData } from '../user/actions';
import { Combobox } from '@/components/ui/combobox';

// Types will be adapted for Supabase
export type Appointment = {
  id: string;
  patientName: string;
  doctor: string;
  service: string;
  time: string;
  date: string; // YYYY-MM-DD
  status: 'Scheduled' | 'Completed' | 'Canceled' | 'In-progress';
};

type Patient = { id: string; first_name: string; last_name: string };
type Doctor = { id: string; first_name: string; last_name: string };

const AppointmentForm = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSubmit,
  existingAppointment,
  patients,
  doctors
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  selectedDate: Date, 
  onSubmit: (newAppointment: Omit<Appointment, 'id' | 'status'>) => void,
  existingAppointment?: Appointment | null,
  patients: Patient[],
  doctors: Doctor[],
}) => {
    const { toast } = useToast();
    const [patientId, setPatientId] = React.useState('');
    const [doctorId, setDoctorId] = React.useState('');
    const [time, setTime] = React.useState('10:00');
    const [service, setService] = React.useState('');

    const patientOptions = patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }));
    const doctorOptions = doctors.map(d => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }));

    React.useEffect(() => {
        if(existingAppointment) {
            // This part would need more logic to find the patient/doctor ID from the name
            // For now, it will reset on edit.
            setPatientId('');
            setDoctorId('');
            setTime(existingAppointment.time);
            setService(existingAppointment.service);
        } else {
             setPatientId('');
             setDoctorId('');
             setTime('10:00');
             setService('');
        }
    }, [existingAppointment]);

    const handleSubmit = () => {
        const patient = patients.find(p => p.id === patientId);
        const doctor = doctors.find(d => d.id === doctorId);

        if (!patient || !time || !service || !doctor) {
            toast({
                variant: "destructive",
                title: "Campos Incompletos",
                description: "Por favor, complete todos los campos para guardar la cita.",
            });
            return;
        }
        onSubmit({
            patientName: `${patient.first_name} ${patient.last_name}`,
            doctor: `Dr. ${doctor.first_name} ${doctor.last_name}`,
            service,
            time,
            date: format(selectedDate, 'yyyy-MM-dd'),
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{existingAppointment ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
                    <DialogDescription>
                        {existingAppointment ? 'Editando' : 'Agendando'} cita para el {format(selectedDate, 'd \'de\' MMMM \'de\' yyyy', { locale: es })}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="patient-name">Nombre del Paciente</Label>
                        <Combobox 
                            options={patientOptions}
                            value={patientId}
                            onChange={setPatientId}
                            placeholder="Seleccionar paciente..."
                            emptyMessage="No se encontraron pacientes."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="time">Hora</Label>
                            <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="service">Servicio</Label>
                            <Input id="service" value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Check-up" />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="doctor">Doctor</Label>
                         <Combobox 
                            options={doctorOptions}
                            value={doctorId}
                            onChange={setDoctorId}
                            placeholder="Seleccionar doctor..."
                            emptyMessage="No se encontraron doctores."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar Cita</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const AppointmentDetailsModal = ({
    isOpen,
    onClose,
    date,
    appointments,
    onAdd,
    onEdit,
    onDelete
} : {
    isOpen: boolean,
    onClose: () => void,
    date: Date,
    appointments: Appointment[],
    onAdd: () => void,
    onEdit: (app: Appointment) => void,
    onDelete: (id: string) => void
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Citas para el {format(date, 'd \'de\' MMMM', { locale: es })}</DialogTitle>
                     <DialogDescription>
                        {appointments.length > 0 
                            ? `Hay ${appointments.length} cita(s) programada(s).` 
                            : 'No hay citas para este día.'}
                     </DialogDescription>
                </DialogHeader>
                <div className="py-4 max-h-80 overflow-y-auto">
                    {appointments.length > 0 ? (
                        <div className="space-y-3">
                        {appointments.map(app => (
                            <div key={app.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <div>
                                    <p className="font-semibold">{app.time} - {app.patientName}</p>
                                    <p className="text-sm text-muted-foreground">{app.service} con {app.doctor}</p>
                                </div>
                                <div className="flex gap-2">
                                     <Button variant="ghost" size="icon" onClick={() => onEdit(app)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => onDelete(app.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay citas programadas.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button onClick={onAdd}><Plus className="h-4 w-4 mr-2" /> Agregar Nueva Cita</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AppointmentsCalendarPage() {
  const [currentDate, setCurrentDate] = React.useState<Date | null>(null);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]); 
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  
  React.useEffect(() => {
    // Set dates on client-side to avoid hydration mismatch
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);

    async function fetchData() {
        const [patientsData, userData] = await Promise.all([
            getPatients(),
            getUserData()
        ]);
        setPatients(patientsData as Patient[]);
        if (userData?.teamMembers) {
            const doctorMembers = userData.teamMembers.filter(m => m.roles.includes('doctor'));
            setDoctors(doctorMembers as Doctor[]);
        }
    }
    fetchData();
    // TODO: Fetch appointments from Supabase for the current month
  }, []);

  if (!currentDate || !selectedDate) {
    // Render a loading state or nothing until the date is set client-side
    return null;
  }
  
  // Stats Calculation
  const today = new Date();
  const pendingToday = appointments.filter(app => isToday(new Date(app.date)) && (app.status === 'Scheduled' || app.status === 'In-progress')).length;
  const startOfNextDay = add(new Date(today).setHours(0,0,0,0), { days: 1 });
  const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
  const appointmentsThisWeek = appointments.filter(app => {
      const appDate = new Date(app.date);
      return isAfter(appDate, startOfNextDay) && isBefore(appDate, endOfWeekDate);
  }).length;
  const appointmentsThisMonth = appointments.filter(app => isSameMonth(new Date(app.date), currentDate)).length;


  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
    end: endOfWeek(lastDayOfMonth, { weekStartsOn: 1 }),
  });

  const goToPreviousMonth = () => {
    setCurrentDate(add(currentDate, { months: -1 }));
  };

  const goToNextMonth = () => {
    setCurrentDate(add(currentDate, { months: 1 }));
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDetailsModalOpen(true);
  };
  
  const handleAddAppointment = (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
        // TODO: Implement Supabase insert
        const newAppointment: Appointment = {
            id: `APP${String(appointments.length + 1).padStart(3, '0')}`,
            ...newAppointmentData,
            status: 'Scheduled'
        };
        setAppointments(prev => [...prev, newAppointment]);
  };

  const openAddForm = () => {
      setSelectedAppointment(null);
      setIsDetailsModalOpen(false);
      setIsFormModalOpen(true);
  }

  const openEditForm = (appointment: Appointment) => {
      setSelectedAppointment(appointment);
      setIsDetailsModalOpen(false);
      setIsFormModalOpen(true);
  }
  
  const handleDeleteAppointment = (id: string) => {
      // TODO: Implement Supabase delete
      setAppointments(prev => prev.filter(app => app.id !== id));
  }


  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((appointment) =>
      isSameDay(new Date(appointment.date), day)
    ).sort((a, b) => new Date(`1970-01-01T${a.time}`).getTime() - new Date(`1970-01-01T${b.time}`).getTime());
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Citas Pendientes Hoy</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingToday}</div>
                    <p className="text-xs text-muted-foreground">Citas programadas o en progreso.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Citas Restantes (Semana)</CardTitle>
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{appointmentsThisWeek}</div>
                    <p className="text-xs text-muted-foreground">Citas para el resto de la semana.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Citas (Mes)</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{appointmentsThisMonth}</div>
                     <p className="text-xs text-muted-foreground">En {format(currentDate, 'MMMM', { locale: es })}.</p>
                </CardContent>
            </Card>
        </div>
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-sm">
            {isFormModalOpen && (
                <AppointmentForm 
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    selectedDate={selectedDate}
                    onSubmit={handleAddAppointment}
                    existingAppointment={selectedAppointment}
                    patients={patients}
                    doctors={doctors}
                />
            )}
             {isDetailsModalOpen && (
                <AppointmentDetailsModal 
                    isOpen={isDetailsModalOpen}
                    onClose={() => setIsDetailsModalOpen(false)}
                    date={selectedDate}
                    appointments={getAppointmentsForDay(selectedDate)}
                    onAdd={openAddForm}
                    onEdit={openEditForm}
                    onDelete={handleDeleteAppointment}
                />
            )}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold font-headline capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-l border-border">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-r border-border">
                {day}
              </div>
            ))}
            {daysInMonth.map((day) => {
              const appointmentsForDay = getAppointmentsForDay(day);
              const maxVisible = 3;
              const hiddenCount = appointmentsForDay.length - maxVisible;

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'relative h-28 sm:h-36 p-2 border-b border-r border-border flex flex-col cursor-pointer hover:bg-muted transition-colors',
                    !isSameMonth(day, currentDate) && 'bg-muted/50 text-muted-foreground',
                  )}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={cn(
                      'text-xs font-semibold',
                      isToday(day) && 'flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </time>
                  <div className="mt-1 flex-grow overflow-y-auto text-xs space-y-1">
                    {appointmentsForDay.slice(0, maxVisible).map(app => (
                      <div key={app.id} className="p-1 bg-primary/10 rounded-md text-primary-dark font-medium truncate">
                        {app.time} - {app.patientName}
                      </div>
                    ))}
                    {hiddenCount > 0 && (
                      <div className="text-muted-foreground font-medium pt-1">
                        +{hiddenCount} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
