
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, X } from 'lucide-react';
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
} from 'date-fns';
import { es } from 'date-fns/locale';
import { appointments as initialAppointments, Appointment, patients } from '@/lib/data';
import { cn } from '@/lib/utils';
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
import { Button } from '@/components/ui/button';

const AppointmentForm = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSubmit,
  existingAppointment
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  selectedDate: Date, 
  onSubmit: (newAppointment: Omit<Appointment, 'id' | 'status'>) => void,
  existingAppointment?: Appointment | null
}) => {
    const [patientName, setPatientName] = React.useState('');
    const [time, setTime] = React.useState('10:00');
    const [service, setService] = React.useState('');
    const [doctor, setDoctor] = React.useState('');

    React.useEffect(() => {
        if(existingAppointment) {
            setPatientName(existingAppointment.patientName);
            setTime(existingAppointment.time);
            setService(existingAppointment.service);
            setDoctor(existingAppointment.doctor);
        } else {
             setPatientName('');
             setTime('10:00');
             setService('');
             setDoctor('');
        }
    }, [existingAppointment]);

    const handleSubmit = () => {
        if (!patientName || !time || !service || !doctor) {
            console.error("Please fill all fields");
            return;
        }
        onSubmit({
            patientName,
            doctor,
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
                        <Input 
                            id="patient-name"
                            placeholder="Seleccionar paciente o escribir invitado"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            list="patients-list"
                        />
                         <datalist id="patients-list">
                            {patients.map(p => <option key={p.id} value={p.name} />)}
                        </datalist>
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
                        <Input id="doctor" value={doctor} onChange={e => setDoctor(e.target.value)} placeholder="Dr. Adams" />
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
  const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  
  React.useEffect(() => {
    // Set dates on client-side to avoid hydration mismatch
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  }, []);

  if (!currentDate || !selectedDate) {
    // Render a loading state or nothing until the date is set client-side
    return null;
  }

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
      // Logic to delete appointment, e.g. from Supabase
      // For now, we filter the state
      setAppointments(prev => prev.filter(app => app.id !== id));
  }


  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((appointment) =>
      isSameDay(new Date(appointment.date), day)
    ).sort((a, b) => new Date(`1970-01-01T${a.time}`).getTime() - new Date(`1970-01-01T${b.time}`).getTime());
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        {isFormModalOpen && (
            <AppointmentForm 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                selectedDate={selectedDate}
                onSubmit={handleAddAppointment}
                existingAppointment={selectedAppointment}
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

      <div className="grid grid-cols-7 border-t border-l border-gray-200">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b border-r border-gray-200">
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
                'relative h-28 sm:h-36 p-2 border-b border-r border-gray-200 flex flex-col cursor-pointer hover:bg-gray-50 transition-colors',
                !isSameMonth(day, currentDate) && 'bg-gray-50 text-gray-400',
              )}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn(
                  'text-xs font-semibold',
                  isToday(day) && 'flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white'
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
                  <div className="text-gray-500 font-medium pt-1">
                    +{hiddenCount} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
