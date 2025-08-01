
'use client';

import * as React from 'react';
import { Activity, DollarSign, Users, Package } from 'lucide-react';
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

// Data will be fetched from Supabase
const treatmentStatsData: any[] = [];

type UserData = Awaited<ReturnType<typeof getUserData>>;
type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export default function DashboardPage() {
  const [isWelcomeTourOpen, setIsWelcomeTourOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const hasSeenWelcomeTour = localStorage.getItem('hasSeenWelcomeTour');
    if (!hasSeenWelcomeTour) {
      setIsWelcomeTourOpen(true);
    }
    
    async function fetchData() {
        setIsLoading(true);
        const [user, data] = await Promise.all([
            getUserData(),
            getDashboardData()
        ]);
        if (user) setUserData(user);
        if (data) setDashboardData(data as DashboardData);
        setIsLoading(false);
    }
    fetchData();

  }, []);

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

  return (
    <DashboardLayout>
      <WelcomeTour isOpen={isWelcomeTourOpen} onClose={handleTourClose} />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Estadísticas de Tratamientos</CardTitle>
              <CardDescription>Resumen de procedimientos realizados este mes.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={treatmentStatsData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
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
                            {appointment.status}
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
