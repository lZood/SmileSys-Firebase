'use client';

import * as React from 'react';
import { DateRange } from 'react-day-picker';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from 'recharts';
import { DollarSign, TrendingUp, Users, FileCheck2 } from 'lucide-react';
import { DatePickerWithRange } from '../../components/ui/date-range-picker';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { Payment, Quote, MonthlyRevenue, AppointmentsByDoctor, RevenueByTreatment } from './types';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Helper to fetch reports API
async function fetchApi(path: string, params?: Record<string, string | number>) {
    const url = new URL(`/api/reports/${path}`, location.origin);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    const res = await fetch(url.toString());
    return res.json();
}

function downloadCSV(filename: string, rows: any[]) {
    if (!rows || rows.length === 0) {
        const blob = new Blob([""], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        return;
    }

    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

export default function ReportsPage() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRestricted, setIsRestricted] = React.useState(false);
    const [date, setDate] = React.useState<DateRange>({
        from: startOfMonth(subMonths(new Date(), 5)),
        to: endOfMonth(new Date())
    });

    const [revenueByTreatmentData, setRevenueByTreatmentData] = React.useState<RevenueByTreatment[]>([]);
    const [monthlyRevenueData, setMonthlyRevenueData] = React.useState<MonthlyRevenue[]>([]);
    const [quotesData, setQuotesData] = React.useState<Quote[]>([]);
    const [newPatientsCount, setNewPatientsCount] = React.useState(0);
    const [appointmentsByDoctorData, setAppointmentsByDoctorData] = React.useState<AppointmentsByDoctor[]>([]);

    const fetchData = React.useCallback(async () => {
        if (!date.from || !date.to) return;
        
        setIsLoading(true);
        try {
            const dateRange = {
                startDate: format(date.from, 'yyyy-MM-dd'),
                endDate: format(date.to, 'yyyy-MM-dd')
            };

            const [revenueRes, monthlyRevenueRes, quotesRes, patientsRes, appointmentsRes] = await Promise.all([
                fetchApi('by-treatment', dateRange),
                fetchApi('monthly', { months: 6 }),
                fetchApi('quotes', dateRange),
                fetchApi('overview', dateRange),
                fetchApi('appointments-by-doctor', dateRange)
            ]);

            if (revenueRes?.ok) {
                setRevenueByTreatmentData(revenueRes.data || []);
            }
 
            if (monthlyRevenueRes.data) {
                setMonthlyRevenueData(monthlyRevenueRes.data);
            }
 
            if (quotesRes.data) {
                setQuotesData(quotesRes.data);
            }
 
            if (patientsRes.ok) {
                setNewPatientsCount(patientsRes.data?.newPatientsCount ?? patientsRes.data?.newPatientsCount ?? patientsRes.data ?? 0);
            }
 
            if (appointmentsRes.data) {
                setAppointmentsByDoctorData(appointmentsRes.data as AppointmentsByDoctor[]);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [date]);

    React.useEffect(() => {
        (async () => {
            // verificar roles antes de cargar
            try {
                const { getUserData } = await import('../user/actions');
                const userData: any = await getUserData();
                const roles: string[] = userData?.profile?.roles || [];
                if (roles.includes('staff') && !roles.includes('admin')) {
                    setIsRestricted(true);
                    setIsLoading(false);
                    return;
                }
                fetchData();
            } catch (e) {
                console.error('Error verificando roles:', e);
                fetchData();
            }
        })();
    }, [fetchData]);

    if (isRestricted) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Acceso Restringido</CardTitle>
                        <CardDescription>No tienes permiso para usar esta área.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-[150px]" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[100px]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-[200px]" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[300px] w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    const presentedQuotes = quotesData.filter(q => q.status === 'Presented' || q.status === 'Accepted').length;
    const acceptedQuotes = quotesData.filter(q => q.status === 'Accepted').length;
    const quoteConversionRate = presentedQuotes > 0 ? (acceptedQuotes / presentedQuotes) * 100 : 0;
    
    const currentMonthRevenue = monthlyRevenueData.length > 0 
        ? monthlyRevenueData[monthlyRevenueData.length - 1].revenue 
        : 0;
    const previousMonthRevenue = monthlyRevenueData.length > 1 
        ? monthlyRevenueData[monthlyRevenueData.length - 2].revenue 
        : 0;
    const revenueChange = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

    const quoteConversionData = [
        { name: 'Aceptados', value: acceptedQuotes },
        { name: 'Presentados (No Aceptados)', value: presentedQuotes - acceptedQuotes }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Reportes y Analíticas</h1>
                    <p className="text-muted-foreground">
                        Análisis sobre el rendimiento de tu clínica.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DatePickerWithRange
                        date={date}
                        onSelect={(newDate: DateRange | undefined) => setDate(newDate || { from: undefined, to: undefined })}
                    />
                    <button className="btn" onClick={() => {
                        // Export CSV for appointments by doctor
                        const rows = appointmentsByDoctorData.map(r => ({ doctor: r.doctor, appointments: r.appointments }));
                        downloadCSV('appointments_by_doctor.csv', rows);
                    }}>Exportar Citas CSV</button>
                    <button className="btn" onClick={async () => {
                        // Export treatments CSV
                        const rows = revenueByTreatmentData.map(r => ({ name: r.name, revenue: r.revenue }));
                        downloadCSV('revenue_by_treatment.csv', rows);
                    }}>Exportar Servicios CSV</button>
                    <button className="btn" onClick={async () => {
                        // Trigger refresh (requires admin)
                        try {
                            const resp = await fetch('/api/reports/refresh', { method: 'POST' });
                            const json = await resp.json();
                            if (json.ok) alert('Refresh iniciado'); else alert('No autorizado o error');
                        } catch (e) {
                            alert('Error al pedir refresh');
                        }
                    }}>Refrescar MVs</button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos del Periodo</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${currentMonthRevenue.toLocaleString()}</div>
                        <p className={`text-xs ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(2)}% vs periodo anterior
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                        <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{quoteConversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {acceptedQuotes} de {presentedQuotes} presupuestos aceptados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nuevos Pacientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{newPatientsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            En el periodo seleccionado
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doctor más Activo</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {appointmentsByDoctorData.length > 0 
                                ? appointmentsByDoctorData.reduce((prev, current) => 
                                    prev.appointments > current.appointments ? prev : current
                                  ).doctor 
                                : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">Mayor número de citas</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos Mensuales</CardTitle>
                        <CardDescription>Tendencia de ingresos en los últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyRevenueData}>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                                <YAxis stroke="#888888" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Ingresos por Tratamiento</CardTitle>
                        <CardDescription>Desglose de ingresos por tipo de servicio</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueByTreatmentData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={80} stroke="#888888" fontSize={12} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Conversión de Presupuestos</CardTitle>
                        <CardDescription>Tasa de aceptación de presupuestos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={quoteConversionData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    labelLine={false} 
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {quoteConversionData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Citas por Doctor</CardTitle>
                        <CardDescription>Distribución de la carga de trabajo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={appointmentsByDoctorData}>
                                <XAxis dataKey="doctor" stroke="#888888" fontSize={12} />
                                <YAxis stroke="#888888" fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}