
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, CalendarClock, ListTodo, CalendarDays, MoreVertical, FilterX, SlidersHorizontal } from 'lucide-react';
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
  isBefore,
  startOfDay,
  isSameDay,
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPatients } from '../patients/actions';
import { getUserData } from '../user/actions';
import { Combobox } from '@/components/ui/combobox';
import { createAppointment, getAppointments, deleteAppointment, updateAppointment } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AppointmentForm } from '@/components/appointment-form';


// Types
type AppointmentStatus = 'Scheduled' | 'Completed' | 'Canceled' | 'In-progress';
export type Appointment = {
  id: string;
  patientName: string;
  doctor: string;
  service: string;
  time: string;
  date: string; // YYYY-MM-DD
  status: AppointmentStatus;
  patientId: string;
  doctorId: string;
};

type Patient = { id: string; first_name: string; last_name: string };
type Doctor = { id: string; first_name: string; last_name: string; roles: string[] };

const getStatusInSpanish = (status: AppointmentStatus) => {
    const translations: Record<AppointmentStatus, string> = {
        'Scheduled': 'Programada',
        'Completed': 'Completada',
        'Canceled': 'Cancelada',
        'In-progress': 'En Progreso'
    };
    return translations[status] || status;
}

const getStatusClass = (status: AppointmentStatus) => {
    const classes: Record<AppointmentStatus, string> = {
        'Scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
        'Completed': 'bg-green-100 text-green-800 border-green-200',
        'Canceled': 'bg-red-100 text-red-800 border-red-200',
        'In-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
};

const AppointmentDetailsModal = ({
    isOpen,
    onClose,
    date,
    appointments,
    onAdd,
    onEdit,
    onDelete,
    onStatusChange,
} : {
    isOpen: boolean,
    onClose: () => void,
    date: Date,
    appointments: Appointment[],
    onAdd: () => void,
    onEdit: (app: Appointment) => void,
    onDelete: (id: string) => void,
    onStatusChange: (id: string, status: AppointmentStatus) => void,
}) => {
    const isPast = isBefore(startOfDay(date), startOfDay(new Date())) && !isSameDay(date, new Date());


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
                                <div className="flex-1">
                                    <p className="font-semibold">{app.time} - {app.patientName}</p>
                                    <p className="text-sm text-muted-foreground">{app.service} con {app.doctor}</p>
                                    <Badge variant="outline" className={cn('mt-1 capitalize', getStatusClass(app.status))}>
                                      {getStatusInSpanish(app.status)}
                                    </Badge>
                                </div>
                                {!isPast && (
                                    <div className="flex gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => onStatusChange(app.id, 'In-progress')}>Marcar como 'En Progreso'</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onStatusChange(app.id, 'Completed')}>Marcar como 'Completada'</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onStatusChange(app.id, 'Canceled')}>Marcar como 'Cancelada'</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(app)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. La cita se eliminará permanentemente.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => onDelete(app.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay citas programadas.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    {!isPast && (
                        <Button onClick={onAdd}><Plus className="h-4 w-4 mr-2" /> Agregar Nueva Cita</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AppointmentsCalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentDate, setCurrentDate] = React.useState<Date | null>(null);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]); 
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const { toast } = useToast();

  const [patientFilter, setPatientFilter] = React.useState(searchParams.get('patientId') || 'all');
  const [doctorFilter, setDoctorFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showFilters, setShowFilters] = React.useState(false);


  const fetchVisibleAppointments = React.useCallback(async (date: Date) => {
    if (!date) return;
    
    setIsLoading(true);
    const firstDay = startOfMonth(date);
    const lastDay = endOfMonth(date);
    const start = format(startOfWeek(firstDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(lastDay, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    try {
      const appointmentsData = await getAppointments({
          startDate: start,
          endDate: end,
          patientId: patientFilter !== 'all' ? patientFilter : null,
          doctorId: doctorFilter !== 'all' ? doctorFilter : null,
          status: statusFilter !== 'all' ? statusFilter : null,
      });

      setAppointments(appointmentsData as Appointment[]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar las citas' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientFilter, doctorFilter, statusFilter]);

  // Set initial date on client to avoid hydration mismatch
  React.useEffect(() => {
    setCurrentDate(new Date());
  }, []);
  
  React.useEffect(() => {
    async function fetchInitialData() {
        const [patientsData, userData] = await Promise.all([
            getPatients(),
            getUserData()
        ]);
        setPatients(patientsData as Patient[]);
        if (userData?.teamMembers) {
            setDoctors(userData.teamMembers as Doctor[]);
        }
    }
    fetchInitialData();
  }, []);

  React.useEffect(() => {
      if(currentDate) {
        fetchVisibleAppointments(currentDate);
      }
  }, [currentDate, fetchVisibleAppointments]);

  // Update URL when filters change
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (patientFilter !== 'all') params.set('patientId', patientFilter); else params.delete('patientId');
    if (doctorFilter !== 'all') params.set('doctorId', doctorFilter); else params.delete('doctorId');
    if (statusFilter !== 'all') params.set('status', statusFilter); else params.delete('status');
    router.push(`/appointments?${params.toString()}`, { scroll: false });
  }, [patientFilter, doctorFilter, statusFilter, router, searchParams]);
  
  if (!currentDate) {
    return (
        <div className="flex items-center justify-center h-full">
            <Skeleton className="h-[70vh] w-full" />
        </div>
    );
  }

  const today = startOfDay(new Date());
  const todayString = format(today, 'yyyy-MM-dd');
  const pendingToday = appointments.filter(app => app.date === todayString && (app.status === 'Scheduled' || app.status === 'In-progress')).length;
  
  const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
  
  const appointmentsThisWeek = appointments.filter(app => {
      const appDate = new Date(app.date.replace(/-/g, '/'));
      return isBefore(today, appDate) && isBefore(appDate, endOfWeekDate);
  }).length;
  
  const monthString = format(currentDate, 'yyyy-MM');
  const appointmentsThisMonth = appointments.filter(app => app.date.startsWith(monthString)).length;

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
    end: endOfWeek(lastDayOfMonth, { weekStartsOn: 1 }),
  });

  const goToPreviousMonth = () => setCurrentDate(add(currentDate, { months: -1 }));
  const goToNextMonth = () => setCurrentDate(add(currentDate, { months: 1 }));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDetailsModalOpen(true);
  };
  
  const handleCreateAppointment = async (data: any) => {
    const result = await createAppointment(data);
    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Cita Creada', description: 'La nueva cita ha sido agendada.' });
        setIsFormModalOpen(false);
        fetchVisibleAppointments(currentDate);
    }
  };

  const handleUpdateAppointment = async (data: any) => {
    const result = await updateAppointment(data);
    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Cita Actualizada', description: 'La cita ha sido modificada.' });
        setIsFormModalOpen(false);
        setSelectedAppointment(null);
        fetchVisibleAppointments(currentDate);
    }
  }

  const handleDeleteAppointment = async (id: string) => {
      const { error } = await deleteAppointment(id);
      if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error });
      } else {
        toast({ title: 'Cita Eliminada', description: 'La cita ha sido eliminada.'});
        setIsDetailsModalOpen(false);
        fetchVisibleAppointments(currentDate);
      }
  }

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const { error } = await updateAppointment({ id, status });
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error });
    } else {
        toast({ title: 'Estado Actualizado', description: `La cita ahora está ${getStatusInSpanish(status)}.`});
        fetchVisibleAppointments(currentDate);
    }
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

  const getAppointmentsForDay = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    return appointments.filter((appointment) =>
      appointment.date === dayString
    ).sort((a, b) => a.time.localeCompare(b.time));
  };

  const getAppointmentDotColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-500';
      case 'In-progress': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      case 'Canceled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const clearFilters = () => {
    setPatientFilter('all');
    setDoctorFilter('all');
    setStatusFilter('all');
  }

  const patientOptions = [{ label: "Todos los Pacientes", value: "all" }, ...patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }))];
  const doctorOptions = [{ label: "Todos los Doctores", value: "all" }, ...doctors.filter(d => d.roles.includes('doctor')).map(d => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))];
  const statusOptions = [
      { label: "Todos los Estados", value: "all" },
      { label: "Programada", value: "Scheduled" },
      { label: "En Progreso", value: "In-progress" },
      { label: "Completada", value: "Completed" },
      { label: "Cancelada", value: "Canceled" },
  ];

  return (
    <div className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Citas Pendientes Hoy</CardTitle>
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{pendingToday}</div>}
                    <p className="text-xs text-muted-foreground">Citas programadas o en progreso.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Citas Restantes (Semana)</CardTitle>
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{appointmentsThisWeek}</div>}
                    <p className="text-xs text-muted-foreground">Citas para el resto de la semana.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Citas (Mes)</CardTitle>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-bold">{appointmentsThisMonth}</div>}
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
                    onSubmit={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
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
                    onStatusChange={handleStatusChange}
                />
            )}
          <div className="flex items-center justify-between mb-4">
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
               <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="h-8 w-8">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Collapsible open={showFilters}>
            <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                    <div className="md:col-span-1">
                        <Label htmlFor="patient-filter">Paciente</Label>
                        <Combobox options={patientOptions} value={patientFilter} onChange={setPatientFilter} placeholder="Filtrar por paciente..." emptyMessage="No se encontraron." />
                    </div>
                    <div className="md:col-span-1">
                        <Label htmlFor="doctor-filter">Doctor</Label>
                        <Combobox options={doctorOptions} value={doctorFilter} onChange={setDoctorFilter} placeholder="Filtrar por doctor..." emptyMessage="No se encontraron." />
                    </div>
                    <div className="md:col-span-1">
                        <Label htmlFor="status-filter">Estado</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="status-filter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-1 flex items-end">
                        <Button variant="ghost" onClick={clearFilters} className="w-full">
                            <FilterX className="h-4 w-4 mr-2" />
                            Limpiar Filtros
                        </Button>
                    </div>
                </div>
            </CollapsibleContent>
          </Collapsible>


          <div className="grid grid-cols-7 border-t border-l border-border">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b border-r border-border">
                {day}
              </div>
            ))}
            {daysInMonth.map((day) => {
              const appointmentsForDay = getAppointmentsForDay(day);
              const maxVisible = 2;
              const hiddenCount = appointmentsForDay.length - maxVisible;

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'relative h-28 sm:h-36 p-2 border-b border-r border-border flex flex-col cursor-pointer hover:bg-accent/50 transition-colors',
                    !isSameMonth(day, currentDate) && 'bg-muted/50 text-muted-foreground',
                  )}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={cn(
                      'text-xs font-semibold',
                      isToday(day) && 'flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground',
                      !isSameMonth(day, currentDate) && 'text-muted-foreground/60'
                    )}
                  >
                    {format(day, 'd')}
                  </time>
                  <div className="mt-1 flex-grow overflow-y-auto text-xs space-y-1">
                    {isLoading ? (
                        Array.from({ length: 1 }).map((_, i) => <Skeleton key={i} className="h-4 w-full rounded-md" />)
                    ) : (
                        <>
                            {appointmentsForDay.slice(0, maxVisible).map(app => (
                            <div key={app.id} className="p-1 bg-primary/10 rounded-md text-primary-dark font-medium truncate flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", getAppointmentDotColor(app.status))}></span>
                                <span className="flex-1 truncate">{app.time} - {app.patientName}</span>
                            </div>
                            ))}
                            {hiddenCount > 0 && (
                            <div className="text-muted-foreground font-medium pt-1">
                                +{hiddenCount} más
                            </div>
                            )}
                        </>
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
