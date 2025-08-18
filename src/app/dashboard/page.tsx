'use client';

import * as React from 'react';
import { Activity, DollarSign, Users, Package, CalendarPlus, UserPlus, FilePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { WelcomeTour } from '@/components/welcome-tour';
import { getUserData } from '../user/actions'; // kept for type inference only
import { getDashboardData } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { NewPatientForm } from '@/components/new-patient-form';
import { AddGeneralPaymentModal } from '@/components/add-general-payment-modal';
import { AppointmentForm } from '@/components/appointment-form';
import { getPatients } from '../patients/actions';
import { createAppointment } from '../appointments/actions';
import { useToast } from '@/hooks/use-toast';
import { useUserData } from '@/context/UserDataProvider';
import { useRouter } from 'next/navigation';

type UserData = Awaited<ReturnType<typeof getUserData>>;
type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type Patient = { id: string; first_name: string; last_name: string };
type Doctor = { id: string; first_name: string; last_name: string; roles: string[] };

const QuickActionModals = ({
    showAppointmentModal,
    showPatientModal,
    showPaymentModal,
    onClose,
    onSuccess,
    patients,
    doctors,
    clinic
}: {
    showAppointmentModal: boolean;
    showPatientModal: boolean;
    showPaymentModal: boolean;
    onClose: (modal: 'appointment' | 'patient' | 'payment') => void;
    onSuccess: (modal: 'appointment' | 'patient' | 'payment') => void;
    patients: Patient[];
    doctors: Doctor[];
    clinic: NonNullable<UserData['clinic']> | null;
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
            {showPatientModal && <NewPatientForm onClose={(submitted) => {
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

export default function DashboardPage() {
  const [isWelcomeTourOpen, setIsWelcomeTourOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [doctors, setDoctors] = React.useState<Doctor[]>([]);
  const { userData: contextUserData } = useUserData();
  const { toast } = useToast();
  const router = useRouter();

  // State for modals
  const [modalState, setModalState] = React.useState({
      appointment: false,
      patient: false,
      payment: false,
  });
  
  const openModal = (modal: 'appointment' | 'patient' | 'payment') => setModalState(prev => ({...prev, [modal]: true}));
  const closeModal = (modal: 'appointment' | 'patient' | 'payment') => setModalState(prev => ({...prev, [modal]: false}));

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const [data, patientsData] = await Promise.all([
        getDashboardData(todayString),
        getPatients()
    ]);
    if (data) setDashboardData(data as DashboardData);
    setPatients(patientsData as Patient[]);
    setIsLoading(false);
  }, []);

  // Sync user from context to local state (avoid calling server action twice)
  React.useEffect(() => {
    if (contextUserData) {
      setUserData(contextUserData);
      if (contextUserData.teamMembers) setDoctors(contextUserData.teamMembers as Doctor[]);
    }
  }, [contextUserData]);

  React.useEffect(() => {
    const hasSeenWelcomeTour = localStorage.getItem('hasSeenWelcomeTour');
    if (!hasSeenWelcomeTour) {
      setIsWelcomeTourOpen(true);
    }
    fetchData();
  }, [fetchData]);
  
  const handleModalSuccess = (modal: 'appointment' | 'patient' | 'payment') => {
      fetchData(); // Refetch all data on success
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

  // Small colored dot classes for mobile status view
  const statusDotClass = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-400';
      case 'Scheduled': return 'bg-blue-400';
      case 'Canceled': return 'bg-red-400';
      case 'In-progress': return 'bg-yellow-400';
      default: return 'bg-gray-400';
    }
  };

  // Responsive chart sizing for mobile
  const [chartHeight, setChartHeight] = React.useState<number>(350);
  const [tickAngle, setTickAngle] = React.useState<number>(0);

  React.useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      if (w < 480) {
        setChartHeight(260);
        setTickAngle(-45);
      } else if (w < 768) {
        setChartHeight(300);
        setTickAngle(-35);
      } else {
        setChartHeight(350);
        setTickAngle(0);
      }
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Limit bars to 4 max: keep top 3 and aggregate rest into 'Otros' if needed
  const chartData = React.useMemo(() => {
    const stats = dashboardData?.serviceStats || [];
    if (!Array.isArray(stats) || stats.length === 0) return [];
    if (stats.length <= 4) return stats;
    // take first 3 and aggregate the rest
    const first = stats.slice(0, 3);
    const rest = stats.slice(3);
    const othersCount = rest.reduce((sum: number, item: any) => sum + (Number(item.count) || 0), 0);
    return [...first, { name: 'Otros', count: othersCount }];
  }, [dashboardData?.serviceStats]);

  // Acción rápida: Ajustar stock (prompt -> POST /api/inventory/adjust, con fallback)
   const handleAdjustStock = async () => {
    const product = window.prompt('Nombre del producto a ajustar:');
    if (!product) return;
    const qtyStr = window.prompt('Nueva cantidad (número):');
    if (qtyStr === null) return;
    const quantity = parseInt(qtyStr, 10);
    if (Number.isNaN(quantity)) {
      toast({ variant: 'destructive', title: 'Cantidad inválida', description: 'Introduce un número válido.' });
      return;
    }
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, quantity }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ variant: 'destructive', title: 'Error', description: data?.error || 'No se pudo ajustar el stock' });
      } else {
        toast({ title: 'Stock ajustado', description: `${product} ahora tiene ${quantity}` });
        router.push('/inventory');
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Error de red al ajustar stock' });
    }
  };

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
        />
      {/* Contenedor: usar ancho completo para aprovechar espacio en pantallas grandes */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
         <div className="flex flex-col gap-4">
         <div className="mb-4">
            <h1 className="text-3xl font-bold font-headline break-words">
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
        {/* En móviles: 2 columnas (2x2 para 4 métricas). En pantallas grandes: 4 columnas */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 w-full">
          {/* Cada tarjeta debe poder encogerse: min-w-0 evita overflow en grids */}
          <Card className="w-full min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium break-words">Pacientes Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="min-w-0">
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{dashboardData?.totalPatients}</div> }
              <p className="text-xs text-muted-foreground whitespace-normal break-words">Todos los pacientes registrados</p>
            </CardContent>
          </Card>

          <Card className="w-full min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium break-words">Citas para Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="min-w-0">
               {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{dashboardData?.appointmentsTodayCount}</div> }
              <p className="text-xs text-muted-foreground whitespace-normal break-words">Programadas para hoy</p>
            </CardContent>
          </Card>

          <Card className="w-full min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium break-words">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="min-w-0">
              {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">${dashboardData?.totalIncomeThisMonth?.toFixed(2) || '0.00'}</div> }
              <p className="text-xs text-muted-foreground whitespace-normal break-words">Basado en pagos completados</p>
            </CardContent>
          </Card>

          <Card className="w-full min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium break-words">Alertas de Inventario</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="min-w-0">
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">0</div> }
              <p className="text-xs text-muted-foreground whitespace-normal break-words">Productos con stock bajo</p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            {/* Móviles: 2x2 grid para acciones rápidas */}
            <CardContent className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button variant="outline" className="h-16 sm:h-20 w-full min-w-0 flex flex-col items-center justify-center gap-2 text-sm" onClick={() => openModal('appointment')}>
                    <CalendarPlus className="h-6 w-6" />
                    <span className="text-base truncate">Agendar Cita</span>
                </Button>
                <Button variant="outline" className="h-16 sm:h-20 w-full min-w-0 flex flex-col items-center justify-center gap-2 text-sm" onClick={() => openModal('patient')}>
                    <UserPlus className="h-6 w-6" />
                    <span className="text-base truncate">Registrar Paciente</span>
                </Button>
                <Button variant="outline" className="h-16 sm:h-20 w-full min-w-0 flex flex-col items-center justify-center gap-2 text-sm" onClick={() => openModal('payment')}>
                    <FilePlus className="h-6 w-6" />
                    <span className="text-base truncate">Registrar Pago</span>
                </Button>
                <Button variant="outline" className="h-16 sm:h-20 w-full min-w-0 flex flex-col items-center justify-center gap-2 text-sm" onClick={handleAdjustStock}>
                    <Package className="h-6 w-6" />
                    <span className="text-base truncate">Ajustar Stock</span>
                </Button>
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8 w-full">
           <Card className="lg:col-span-6">
            <CardHeader>
              <CardTitle>Servicios del Mes</CardTitle>
              <CardDescription>Resumen de los servicios más realizados este mes.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="w-full overflow-hidden">
                {/* Allow horizontal scroll if many bars, and make chart responsive to viewport */}
                <div className="w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    {isLoading ? <Skeleton className="w-full h-full" /> : 
                       dashboardData?.serviceStats && dashboardData.serviceStats.length > 0 ? (
                       <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 60 }}>
                        <XAxis dataKey="name" stroke="#888888" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} angle={tickAngle} textAnchor={tickAngle ? 'end' : 'middle'} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                         <Tooltip
                           cursor={{fill: 'hsl(var(--muted))'}}
                           contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                         />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                       ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                              No hay datos de servicios este mes.
                          </div>
                      )
                    }
                  </ResponsiveContainer>
                </div>
              </div>
             </CardContent>
           </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Citas para Hoy</CardTitle>
              <CardDescription>Una lista de las citas programadas para el día.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Responsive: table for md+; stacked cards for mobile */}
              <div className="w-full">
                {/* Desktop / tablet table */}
                <div className="hidden md:block w-full overflow-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={`skel-row-${i}`}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          </TableRow>
                        ))
                      ) : dashboardData?.appointmentsToday && dashboardData.appointmentsToday.length > 0 ? (
                        dashboardData.appointmentsToday.slice(0, 5).map((appointment: any) => (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              <div className="font-medium">{appointment.patientName}</div>
                              <div className="text-sm text-muted-foreground">{appointment.doctorName}</div>
                            </TableCell>
                            <TableCell>{appointment.service_description}</TableCell>
                            <TableCell>{appointment.appointment_time}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-3 h-3 rounded-full ${statusDotClass(appointment.status)}`} aria-label={getStatusInSpanish(appointment.status)} />
                                <span>
                                  <Badge variant="outline" className={cn(getAppointmentStatusClass(appointment.status), 'capitalize')}>
                                    {getStatusInSpanish(appointment.status)}
                                  </Badge>
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">No hay citas para hoy.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile stacked cards */}
                <div className="block md:hidden space-y-4">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={`skel-mobile-${i}`} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-32 mb-1" />
                        <div className="flex items-center justify-between mt-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      </div>
                    ))
                  ) : dashboardData?.appointmentsToday && dashboardData.appointmentsToday.length > 0 ? (
                    dashboardData.appointmentsToday.slice(0, 10).map((appointment: any) => (
                      <div key={appointment.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{appointment.patientName}</div>
                            <div className="text-sm text-muted-foreground truncate">{appointment.doctorName}</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-medium">{appointment.appointment_time}</div>
                            <span className={`inline-block w-3 h-3 rounded-full mt-2 ${statusDotClass(appointment.status)}`} aria-label={getStatusInSpanish(appointment.status)} />
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground truncate">{appointment.service_description}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground">No hay citas para hoy.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
         </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
