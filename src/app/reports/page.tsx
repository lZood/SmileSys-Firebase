
'use client';

import * as React from 'react';
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
import { payments, quotes, appointmentsByDoctorData, monthlyRevenueData, newPatientsData } from '@/lib/data';
import { DollarSign, TrendingUp, Users, FileCheck2 } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ReportsPage() {
    // --- Data Processing ---

    // 1. Revenue by Treatment Type
    const revenueByTreatment = payments
        .filter(p => p.status === 'Paid')
        .reduce((acc, payment) => {
            const concept = payment.concept || 'Uncategorized';
            if (!acc[concept]) {
                acc[concept] = 0;
            }
            acc[concept] += payment.amount;
            return acc;
        }, {} as Record<string, number>);

    const revenueByTreatmentData = Object.entries(revenueByTreatment).map(([name, revenue]) => ({
        name,
        revenue,
    }));

    // 2. Quote Conversion Rate
    const presentedQuotes = quotes.filter(q => q.status === 'Presented' || q.status === 'Accepted').length;
    const acceptedQuotes = quotes.filter(q => q.status === 'Accepted').length;
    const quoteConversionRate = presentedQuotes > 0 ? (acceptedQuotes / presentedQuotes) * 100 : 0;
    const quoteConversionData = [
        { name: 'Accepted', value: acceptedQuotes },
        { name: 'Presented (Not Accepted)', value: presentedQuotes - acceptedQuotes }
    ];

    // 3. Monthly Revenue
    const currentMonthRevenue = monthlyRevenueData[monthlyRevenueData.length - 1].revenue;
    const previousMonthRevenue = monthlyRevenueData[monthlyRevenueData.length - 2].revenue;
    const revenueChange = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Reports & Analytics</h1>
                <p className="text-muted-foreground">
                    Insights into your clinic's performance.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month's Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${currentMonthRevenue.toLocaleString()}</div>
                        <p className={`text-xs ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(2)}% from last month
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Quote Acceptance Rate</CardTitle>
                        <FileCheck2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{quoteConversionRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">
                            {acceptedQuotes} of {presentedQuotes} quotes accepted.
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Patients (Month)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{newPatientsData[newPatientsData.length - 1].count}</div>
                        <p className="text-xs text-muted-foreground">New patients this month.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Busiest Doctor</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{appointmentsByDoctorData.reduce((prev, current) => (prev.appointments > current.appointments) ? prev : current).doctor}</div>
                        <p className="text-xs text-muted-foreground">
                            Highest number of appointments.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Revenue</CardTitle>
                        <CardDescription>Income trend over the last 6 months.</CardDescription>
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
                        <CardTitle>Revenue by Treatment</CardTitle>
                        <CardDescription>Breakdown of income from different services.</CardDescription>
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
                        <CardTitle>Quote Conversion</CardTitle>
                        <CardDescription>How many presented quotes are accepted.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={quoteConversionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {quoteConversionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Appointments per Doctor</CardTitle>
                        <CardDescription>Distribution of workload among doctors.</CardDescription>
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
