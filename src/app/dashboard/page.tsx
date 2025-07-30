
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
import { Skeleton } from '@/components/ui/skeleton';

// Data will be fetched from Supabase
const treatmentStatsData: any[] = [];
const appointments: any[] = [];
const patients: any[] = [];

type UserData = Awaited<ReturnType<typeof getUserData>>;

export default function DashboardPage() {
  const [today, setToday] = React.useState(new Date());
  const [isWelcomeTourOpen, setIsWelcomeTourOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const appointmentsToday = appointments.filter(
    (app) => new Date(app.date).toDateString() === today.toDateString()
  ).length;

  React.useEffect(() => {
    setToday(new Date());
    
    getUserData().then(data => {
        if (data) {
            setUserData(data);
        }
        setIsLoading(false);
    });

    const hasSeenWelcomeTour = localStorage.getItem('hasSeenWelcomeTour');
    if (!hasSeenWelcomeTour) {
      setIsWelcomeTourOpen(true);
    }

  }, []);

  const handleTourClose = () => {
    localStorage.setItem('hasSeenWelcomeTour', 'true');
    setIsWelcomeTourOpen(false);
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
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">Todos los pacientes registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Citas para Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{appointmentsToday}</div>
              <p className="text-xs text-muted-foreground">Programadas para hoy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">Basado en pagos completados</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas de Inventario</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
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
              <CardTitle>Citas Recientes</CardTitle>
              <CardDescription>Una lista de las citas programadas para hoy.</CardDescription>
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
                  {appointments.length > 0 ? appointments.slice(0, 5).map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="font-medium">{appointment.patientName}</div>
                        <div className="text-sm text-muted-foreground">{appointment.doctor}</div>
                      </TableCell>
                      <TableCell>{appointment.service}</TableCell>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>
                        <Badge variant={
                            appointment.status === 'Completed' ? 'default' 
                          : appointment.status === 'Canceled' ? 'destructive'
                          : 'secondary'
                        }
                        className={
                            appointment.status === 'Completed' ? 'bg-green-500/20 text-green-700 border-green-500/20' : 
                            appointment.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-700 border-blue-500/20' : 
                            'bg-red-500/20 text-red-700 border-red-500/20'
                        }
                        >
                          {appointment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
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

    