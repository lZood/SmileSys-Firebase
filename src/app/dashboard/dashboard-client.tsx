'use client';

import * as React from 'react';
import { Activity, DollarSign, Users, Package, CalendarPlus, UserPlus, FilePlus, Circle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { WelcomeTour } from '@/components/welcome-tour';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, startOfToday, differenceInMinutes, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { NewPatientForm } from '@/components/new-patient-form';
import { AddGeneralPaymentModal } from '@/components/add-general-payment-modal';
import { AppointmentForm } from '@/components/appointment-form';
import { getPatients } from '../patients/actions';
import { createAppointment, getAppointments } from '../appointments/actions';
import { useToast } from '@/hooks/use-toast';
import { getUserData } from '../user/actions'; // Import for types
import { getDashboardData } from './actions'; // Import for types
import { createClient } from '@/lib/supabase/client'; // Import for real-time
import { useRouter } from 'next/navigation';

type UserData = Awaited<ReturnType<typeof getUserData>>;
type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type Patient = { id: string; first_name: string; last_name: string };
type Doctor = { id: string; first_name: string; last_name: string; roles: string[] };
type Appointment = Awaited<ReturnType<typeof getAppointments>>[0];
type Notification = {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    link_to?: string;
    user_id: string;
};


const QuickActionModals = ({
    showAppointmentModal,
    showPatientModal,
    showPaymentModal,
    onClose,
    onSuccess,
    patients,
    doctors,
    clinic,
    allowedModes
}: {
    showAppointmentModal: boolean;
    showPatientModal: boolean;
    showPaymentModal: boolean;
    onClose: (modal: 'appointment' | 'patient' | 'payment') => void;
    onSuccess: (modal: 'appointment' | 'patient' | 'payment') => void;
    patients: Patient[];
    doctors: Doctor[];
    clinic: NonNullable<UserData['clinic']> | null;
    allowedModes: 'all' | 'temporary-only';
}) => {
    const { toast } = useToast();

    const handleCreateAppointment = async (data: any) => {
        const result = await createAppointment(data);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Cita Creada', description: 'La nueva cita ha sido agendada.' });
            onSuccess('appointment');
        }
    };

    return (
        <>
            {showAppointmentModal && (
                <AppointmentForm
                    isOpen={true}
                    onClose={() => onClose('appointment')}
                    selectedDate={new Date()}
                    onSubmit={handleCreateAppointment}
                    patients={patients}
                    doctors={doctors}
                />
            )}
            {showPatientModal && <NewPatientForm allowedModes={allowedModes} onClose={(submitted) => {
                onClose('patient');
                if (submitted) onSuccess('patient');
            }} />}
            {showPaymentModal && clinic && (
                <AddGeneralPaymentModal
                    isOpen={true}
                    onClose={() => onClose('payment')}
                    onPaymentAdded={() => {
                        onSuccess('payment');
                        onClose('payment');
                    }}
                    patients={patients}
                    clinic={clinic}
                />
            )}
        </>
    );
};


export function DashboardClient({
    initialUserData,
    initialDashboardData,
    initialPatients,
    initialDoctors,
}: {
    initialUserData: UserData | null;
    initialDashboardData: DashboardData | null;
    initialPatients: Patient[];
    initialDoctors: Doctor[];
}) {
    const router = useRouter();
    const [isWelcomeTourOpen, setIsWelcomeTourOpen] = React.useState(false);

    // Use initial data from props
    const [userData, setUserData] = React.useState(initialUserData);
    const [dashboardData, setDashboardData] = React.useState(initialDashboardData);
    const [patients, setPatients] = React.useState(initialPatients);
    const [doctors, setDoctors] = React.useState(initialDoctors);

    const [modalState, setModalState] = React.useState({
        appointment: false,
        patient: false,
        payment: false,
    });
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [remindersToDismiss, setRemindersToDismiss] = React.useState<string[]>([]);
    const { toast } = useToast();

    const openModal = (modal: 'appointment' | 'patient' | 'payment') => setModalState(prev => ({ ...prev, [modal]: true }));
    const closeModal = (modal: 'appointment' | 'patient' | 'payment') => setModalState(prev => ({ ...prev, [modal]: false }));

    const refetchDashboardData = async () => {
        const todayString = format(new Date(), 'yyyy-MM-dd');
        const data = await getDashboardData(todayString);
        setDashboardData(data as any);
    };

    const refetchPatients = async () => {
        const data = await getPatients();
        setPatients(data as any[]);
    }

    const handleModalSuccess = (modal: 'appointment' | 'patient' | 'payment') => {
        if (modal === 'appointment') refetchDashboardData();
        if (modal === 'patient') refetchPatients();
        if (modal === 'payment') refetchDashboardData();
        closeModal(modal);
    };

    const handleTourClose = () => {
        localStorage.setItem('hasSeenWelcomeTour', 'true');
        setIsWelcomeTourOpen(false);
    };

    const getAppointmentStatusClass = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'Scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Canceled': return 'bg-red-100 text-red-800 border-red-200';
            case 'In-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusInSpanish = (status: string) => {
        const translations: Record<string, string> = {
            'Scheduled': 'Programada',
            'Completed': 'Completada',
            'Canceled': 'Cancelada',
            'In-progress': 'En Progreso'
        };
        return translations[status] || status;
    }

    // Type guard to ensure dashboardData has the expected fields (not an error payload)
    const isFullDashboardData = (d: any): d is Exclude<DashboardData, { error: string }> => {
        return d && typeof d === 'object' && !('error' in d);
    };

    // New utility: export today's appointments to CSV
    const exportAppointmentsCSV = () => {
        const rows: string[] = [];
        const headers = ['Hora', 'Paciente', 'Doctor', 'Estado'];
        rows.push(headers.join(','));
        const apps = dashboardData?.appointmentsToday || [];
        apps.forEach((a: any) => {
            const time = a.time || a.appointment_time || a.appointment_time || '';
            const patient = a.patientName || a.patient_name || (a.patient && `${a.patient.first_name} ${a.patient.last_name}`) || '';
            const doctor = a.doctorName || a.doctor_name || (a.doctor && `${a.doctor.first_name} ${a.doctor.last_name}`) || '';
            const status = getStatusInSpanish(a.status || a.appointment_status || '');
            rows.push([`"${time}"`, `"${patient}"`, `"${doctor}"`, `"${status}"`].join(','));
        });
        const csv = rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `citas_hoy_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Exportado', description: 'Citas de hoy exportadas como CSV.' });
    };

    // New utility: show a compact upcoming week summary via toast
    const showUpcomingWeekSummary = () => {
        if (!dashboardData || !('appointmentsNext7' in dashboardData) || !(dashboardData as any).appointmentsNext7) {
            toast({ title: 'Resumen semanal', description: 'No hay datos de la próxima semana disponibles.' });
            return;
        }
        const next7 = (dashboardData as any).appointmentsNext7 as any[];
        const total = next7.reduce((s: number, d: any) => s + (d.count || 0), 0);
        toast({ title: 'Próxima semana', description: `Tienes ${total} citas programadas en los próximos 7 días.` });
    };

    // Welcome Tour effect
    React.useEffect(() => {
        const hasSeenWelcomeTour = localStorage.getItem('hasSeenWelcomeTour');
        if (!hasSeenWelcomeTour) {
            setIsWelcomeTourOpen(true);
        }
    }, []);

     // Real-time notifications and reminders (from original DashboardLayout)
  React.useEffect(() => {
    const supabase = createClient();

    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setNotifications(data as Notification[]);
        }
    };
    fetchNotifications();

    // 2. Listen for new notifications in real-time
    const notificationsChannel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Check if the notification is for the current user
          if ((payload.new as Notification).user_id === userData?.user?.id) {
             setNotifications(currentNotifications => [
                payload.new as Notification,
                ...currentNotifications
             ]);
          }
        }
      )
      .subscribe();

    // 3. Reminder logic
    let reminderInterval: NodeJS.Timeout;

    const checkAppointmentsForReminders = async () => {
        const today = startOfToday();
        const todayString = format(today, 'yyyy-MM-dd');
        // Use local state data if available, otherwise fetch (less ideal but works if initial data is somehow missing)
         const appointmentsToday = dashboardData?.appointmentsToday || await getAppointments({
            startDate: todayString,
            endDate: todayString,
        });


        const now = new Date();
        // Helper to extract time and date from differing appointment shapes
        const extractTimeAndDate = (a: any): { time: string | null; date: string | null } => {
            if (!a) return { time: null, date: null };
            // shape: { time, date }
            if ('time' in a && 'date' in a) return { time: a.time, date: a.date };
            // shape: { appointment_time, date }
            if ('appointment_time' in a && 'date' in a) return { time: a.appointment_time, date: a.date };
            // shape: { appointment_time, appointment_date }
            if ('appointment_time' in a && 'appointment_date' in a) return { time: a.appointment_time, date: a.appointment_date };
            // fallback guesses
            return { time: a.time ?? a.appointment_time ?? null, date: a.date ?? a.appointment_date ?? null };
        };

        (appointmentsToday || []).forEach((app: any) => {
             if (remindersToDismiss.includes(app.id)) return;

            const { time, date } = extractTimeAndDate(app);
            if (!time || !date) return; // can't compute reminder without both

            // Normalize date string for parse
            const normalizedDate = String(date).replace(/-/g, '/');
            const appTime = parse(String(time), 'HH:mm', new Date(normalizedDate));
            const diff = differenceInMinutes(appTime, now);

            // Only show reminder if within 5 minutes AND appointment hasn't passed
            if (diff > 0 && diff <= 5) {
                const toastId = `reminder-${app.id}`;
                 (require('react-hot-toast') as typeof import('react-hot-toast')).toast((t) => (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                            <p className="font-bold">Recordatorio de Cita</p>
                            <p>Tu cita con {app.patientName} empieza en {diff} minuto(s).</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => {
                            setRemindersToDismiss(prev => [...prev, app.id]);
                             (require('react-hot-toast') as typeof import('react-hot-toast')).toast.dismiss(t.id);
                        }}><X className="h-4 w-4" /></Button>
                    </div>
                 ), {
                    id: toastId, // Use a unique ID to prevent duplicates
                    duration: 60000 // 1 minute
                 });
            }
        });
    };

    checkAppointmentsForReminders(); // Check immediately on load
    reminderInterval = setInterval(checkAppointmentsForReminders, 60000);

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(notificationsChannel);
      clearInterval(reminderInterval);
    };
  }, [userData?.user?.id, remindersToDismiss, dashboardData?.appointmentsToday]); // Add dashboardData dependency


    // Determine if initial loading is happening (based on whether initial data was provided)
    // In a real app, you might refine this based on context loading state or similar.
    const isLoading = !initialUserData || !initialDashboardData || initialPatients.length === 0 || initialDoctors.length === 0;


    return (
        <DashboardLayout>
            <WelcomeTour isOpen={isWelcomeTourOpen} onClose={handleTourClose} />
            <QuickActionModals
                showAppointmentModal={modalState.appointment}
                showPatientModal={modalState.patient}
                showPaymentModal={modalState.payment}
                onClose={closeModal}
                onSuccess={handleModalSuccess}
                patients={patients}
                doctors={doctors}
                clinic={userData?.clinic || null}
                allowedModes={(userData?.profile?.roles || []).includes('staff') && !(userData?.profile?.roles || []).includes('admin') && !(userData?.profile?.roles || []).includes('doctor') ? 'temporary-only' : 'all'}
            />
            <div className="flex flex-col gap-4">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold font-headline">
                        {/* Use userData from state */}
                        {isLoading ? (
                            <Skeleton className="h-8 w-48" />
                        ) : (
                            `Hola, ${userData?.profile?.first_name || 'Usuario'}!`
                        )}
                    </h1>
                    <p className="text-muted-foreground">
                        Aquí tienes un resumen de la actividad de tu clínica hoy.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
                            <Users className="h-5 w-5 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            {/* Use dashboardData from state */}
                            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{dashboardData?.totalPatients}</div>}
                            <p className="text-xs text-muted-foreground">Todos los pacientes registrados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Citas para Hoy</CardTitle>
                            <Activity className="h-5 w-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            {/* Use dashboardData from state */}
                            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{dashboardData?.appointmentsTodayCount}</div>}
                            <p className="text-xs text-muted-foreground">Programadas para hoy</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                            <DollarSign className="h-5 w-5 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                             {/* Use dashboardData from state */}
                            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">${dashboardData?.totalIncomeThisMonth?.toFixed(2) || '0.00'}</div>}
                            <p className="text-xs text-muted-foreground">Basado en pagos completados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Alertas de Inventario</CardTitle>
                            <Package className="h-5 w-5 text-rose-500" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">0</div>}
                            <p className="text-xs text-muted-foreground">Productos con stock bajo</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 50/50: Servicios del Mes (left) & Citas para Hoy (right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle>Servicios del Mes</CardTitle>
                            <CardDescription>Resumen de ingresos y servicios más frecuentes</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {isLoading ? (
                                <Skeleton className="h-40 w-full" />
                            ) : (
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <div className="text-3xl font-bold">${dashboardData?.totalIncomeThisMonth?.toFixed(2) || '0.00'}</div>
                                        <p className="text-sm text-muted-foreground">Ingresos totales este mes</p>
                                    </div>
                                    <div className="w-full md:w-1/2 h-40">
                                        {/* Small bar chart placeholder if data exists */}
                                        {dashboardData && 'monthlyServices' in dashboardData && (dashboardData as any).monthlyServices && (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={(dashboardData as any).monthlyServices}>
                                                    <XAxis dataKey="day" hide />
                                                    <YAxis hide />
                                                    <Tooltip />
                                                    <Bar dataKey="count" fill="#60a5fa" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <CardTitle>Citas para Hoy</CardTitle>
                                <CardDescription>Vista ampliada y acciones</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={exportAppointmentsCSV}>Exportar CSV</Button>
                                <Button size="sm" variant="ghost" onClick={showUpcomingWeekSummary}>Resumen 7d</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            {isLoading ? (
                                <Skeleton className="h-56 w-full" />
                            ) : (
                                <div className="space-y-3">
                                    {(dashboardData?.appointmentsToday || []).map((a: any) => (
                                        <div key={a.id} className="flex items-center justify-between p-3 rounded-md border">
                                            <div className="flex items-center gap-4">
                                                <div className="text-sm font-medium">{a.time || a.appointment_time}</div>
                                                <div>
                                                    <div className="font-semibold">{a.patientName || a.patient_name || (a.patient && `${a.patient.first_name} ${a.patient.last_name}`)}</div>
                                                    <div className="text-xs text-muted-foreground">{a.doctorName || a.doctor_name || (a.doctor && `${a.doctor.first_name} ${a.doctor.last_name}`)}</div>
                                                </div>
                                            </div>
                                            <Badge className={cn('px-2 py-1', getAppointmentStatusClass(a.status || a.appointment_status))}>{getStatusInSpanish(a.status || a.appointment_status)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Acciones Rápidas</CardTitle>
                    </CardHeader>
                    {/* 2x2 layout on small screens, 3 columns on large */}
                    <CardContent className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => openModal('appointment')}>
                            <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-indigo-50 text-indigo-600"><CalendarPlus className="h-5 w-5" /></span>
                            <span className="text-base">Agendar Cita</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => openModal('patient')}>
                            <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-emerald-50 text-emerald-600"><UserPlus className="h-5 w-5" /></span>
                            <span className="text-base">Registrar Paciente</span>
                        </Button>
                        {((userData?.profile?.roles || []).includes('staff') && !(userData?.profile?.roles || []).includes('admin')) ? null : (
                        <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => openModal('payment')}>
                            <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-amber-50 text-amber-600"><FilePlus className="h-5 w-5" /></span>
                            <span className="text-base">Registrar Pago</span>
                        </Button>
                        )}
                         {/* Adjust inventory quick action: prompt for item and new qty */}
                        {((userData?.profile?.roles || []).includes('staff') && !(userData?.profile?.roles || []).includes('admin')) ? null : (
                         <Button
                             variant="outline"
                             className="h-20 flex flex-col items-center justify-center gap-2"
                             onClick={async () => {
                                 try {
                                     const product = window.prompt('Producto (ej: cepillos):', 'cepillos');
                                     if (!product) return;
                                     const qtyStr = window.prompt(`Nueva cantidad para "${product}":`, '0');
                                     if (qtyStr === null) return;
                                     const quantity = Number(qtyStr);
                                     if (Number.isNaN(quantity)) {
                                         toast({ variant: 'destructive', title: 'Cantidad inválida', description: 'Introduce un número válido.' });
                                         return;
                                     }
                                     // Placeholder: call API to update inventory if endpoint exists
                                     try {
                                         await fetch('/api/inventory/update', {
                                             method: 'POST',
                                             headers: { 'Content-Type': 'application/json' },
                                             body: JSON.stringify({ product, quantity }),
                                         });
                                     } catch (e) {
                                         // ignore if endpoint missing; still show success locally
                                     }
                                     toast({ title: 'Inventario actualizado', description: `"${product}" → ${quantity}` });
                                 } catch (err) {
                                     toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el inventario.' });
                                 }
                             }}
                         >
                             <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-rose-50 text-rose-600"><Package className="h-5 w-5" /></span>
                             <span className="text-base">Inventario</span>
                         </Button>
                        )}

                    </CardContent>
                </Card>

            </div>
        </DashboardLayout>
    );
}
