
'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

const AppointmentForm = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onSubmit 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  selectedDate: Date, 
  onSubmit: (newAppointment: Omit<Appointment, 'id' | 'status'>) => void 
}) => {
    const [patientName, setPatientName] = React.useState('');
    const [time, setTime] = React.useState('10:00');
    const [service, setService] = React.useState('');
    const [doctor, setDoctor] = React.useState('');

    const handleSubmit = () => {
        if (!patientName || !time || !service || !doctor) {
            // Add toast notification for incomplete fields
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
                    <DialogTitle>Nueva Cita</DialogTitle>
                    <DialogDescription>
                        Agendando cita para el {format(selectedDate, 'd \'de\' MMMM \'de\' yyyy', { locale: es })}.
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


export default function AppointmentsCalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(new Date());

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
    setIsModalOpen(true);
  };
  
  const handleAddAppointment = (newAppointmentData: Omit<Appointment, 'id' | 'status'>) => {
        const newAppointment: Appointment = {
            id: `APP${String(appointments.length + 1).padStart(3, '0')}`,
            ...newAppointmentData,
            status: 'Scheduled'
        };
        setAppointments(prev => [...prev, newAppointment]);
  };


  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((appointment) =>
      isSameDay(new Date(appointment.date), day)
    ).sort((a, b) => new Date(`1970-01-01T${a.time}`).getTime() - new Date(`1970-01-01T${b.time}`).getTime());
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
        {isModalOpen && (
            <AppointmentForm 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                onSubmit={handleAddAppointment}
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
