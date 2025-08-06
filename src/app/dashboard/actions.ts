
'use server';

import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format, isValid, subHours } from 'date-fns';
import { autoCompleteAppointments } from "../appointments/actions";

const commonServices = [
    'Consulta / Revisión',
    'Limpieza Dental',
    'Blanqueamiento Dental',
    'Relleno de Caries (Restauración)',
    'Extracción Dental',
    'Tratamiento de Conducto (Endodoncia)',
    'Corona Dental',
    'Ortodoncia (Ajuste)',
];


export async function getDashboardData(dateString: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Not authenticated' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return { error: 'Profile not found' };
    }
    
    const clinicId = profile.clinic_id;

    // --- Auto-complete appointments before fetching data ---
    await autoCompleteAppointments(clinicId);
    // ----------------------------------------------------

    const today = new Date(dateString);

    if (!isValid(today)) {
        return { error: 'Invalid date provided to getDashboardData' };
    }

    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    // 1. Get total patients
    const { count: totalPatients, error: patientsError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId);

    // 2. Get total income this month
    const { data: monthlyPayments, error: paymentsError } = await supabase
        .from('treatment_payments')
        .select('amount_paid')
        .eq('clinic_id', clinicId)
        .gte('payment_date', format(startDate, 'yyyy-MM-dd'))
        .lte('payment_date', format(endDate, 'yyyy-MM-dd'));

    const { data: generalMonthlyPayments, error: generalPaymentsError } = await supabase
        .from('general_payments')
        .select('amount')
        .eq('clinic_id', clinicId)
        .gte('payment_date', format(startDate, 'yyyy-MM-dd'))
        .lte('payment_date', format(endDate, 'yyyy-MM-dd'));

    const totalIncomeThisMonth = (monthlyPayments?.reduce((sum, p) => sum + p.amount_paid, 0) || 0) + (generalMonthlyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0);

    // 3. Get appointments for today AND for the month (for stats)
    const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
            *,
            patients (*),
            profiles!doctor_id(*)
        `)
        .eq('clinic_id', clinicId)
        .gte('appointment_date', format(startDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(endDate, 'yyyy-MM-dd'))
        .order('appointment_time', { ascending: true });


    if (patientsError || paymentsError || appointmentsError || generalPaymentsError) {
        console.error({ patientsError, paymentsError, appointmentsError, generalPaymentsError });
        return { error: 'Failed to fetch dashboard data' };
    }
    
    // Process data for today's appointments
    const appointmentsToday = allAppointments?.filter(app => app.appointment_date === dateString) || [];

    // Map to structure expected by the frontend
    const formattedAppointments = appointmentsToday?.map(app => {
        const doctorProfile = app.profiles;
        return {
            id: app.id,
            patientName: app.patients ? `${app.patients.first_name} ${app.patients.last_name}` : 'Paciente no encontrado',
            doctorName: doctorProfile ? `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}` : 'Doctor no asignado',
            service_description: app.service_description,
            appointment_time: app.appointment_time,
            status: app.status
        }
    });

    // Process data for service stats
    const serviceCounts = (allAppointments || []).reduce((acc, app) => {
        const service = app.service_description.trim();
        const serviceKey = commonServices.includes(service) ? service : 'Otros';
        acc[serviceKey] = (acc[serviceKey] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const serviceStats = Object.entries(serviceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 services

    return {
        totalPatients: totalPatients ?? 0,
        totalIncomeThisMonth,
        appointmentsToday: formattedAppointments ?? [],
        appointmentsTodayCount: appointmentsToday?.length ?? 0,
        serviceStats
    };
}
