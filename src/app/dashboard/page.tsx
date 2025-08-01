
'use client';

import * as React from 'react';
import { Activity, DollarSign, Users, Package, CalendarPlus, UserPlus, FilePlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { WelcomeTour } from '@/components/welcome-tour';
import { getUserData } from '../user/actions';
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
    const [user, data, patientsData] = await Promise.all([
        getUserData(),
        getDashboardData(todayString),
        getPatients()
    ]);
    if (user) {
        setUserData(user);
        if (user.teamMembers) {
            setDoctors(user.teamMembers as Doctor[]);
        }
    }
    if (data) setDashboardData(data as DashboardData);
    setPatients(patientsData as Patient[]);
    setIsLoading(false);
  }, []);

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
      <div className="flex flex-col gap-4">
        <div className="mb-4">
            <h1 className="text-3xl font-bold font-headline">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacientes Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{dashboardData?.totalPatients}</div> }
              <p className="text-xs text-muted-foreground">Todos los pacientes registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas para Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
               {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{dashboardData?.appointmentsTodayCount}</div> }
              <p className="text-xs text-muted-foreground">Programadas para hoy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">${dashboardData?.totalIncomeThisMonth?.toFixed(2) || '0.00'}</div> }
              <p className="text-xs text-muted-foreground">Basado en pagos completados</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas de Inventario</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">0</div> }
              <p className="text-xs text-muted-foreground">Productos con stock bajo</p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => openModal('appointment')}>
                    <CalendarPlus className="h-6 w-6" />
                    <span className="text-base">Agendar Cita</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => openModal('patient')}>
                    <UserPlus className="h-6 w-6" />
                    <span className="text-base">Registrar Paciente</span>
                </Button>
                 <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2" onClick={() => openModal('payment')}>
                    <FilePlus className="h-6 w-6" />
                    <span className="text-base">Registrar Pago</span>
                </Button>
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Servicios del Mes</CardTitle>
              <CardDescription>Resumen de los servicios más realizados este mes.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                {isLoading ? <Skeleton className="w-full h-full" /> : 
                    dashboardData?.serviceStats && dashboardData.serviceStats.length > 0 ? (
                    <BarChart data={dashboardData.serviceStats}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip
                        cursor={{fill: 'hsl(var(--muted))'}}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No hay datos de servicios este mes.
                        </div>
                    )
                }
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Citas para Hoy</CardTitle>
              <CardDescription>Una lista de las citas programadas para el día.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
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
                          <Badge variant="outline" className={cn(getAppointmentStatusClass(appointment.status), 'capitalize')}>
                            {getStatusInSpanish(appointment.status)}
                          </Badge>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
