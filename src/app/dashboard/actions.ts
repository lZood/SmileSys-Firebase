
'use server';

import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format, isValid, subHours } from 'date-fns';

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


async function autoCompleteAppointments(clinicId: string) {
    const supabase = createClient();
    const oneHourAgo = format(subHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss");

    // 1. Fetch appointments that should be completed
    // We combine date and time into a single timestamp for comparison
    const { data: appointmentsToUpdate, error: fetchError } = await supabase
        .from('appointments')
        .select('id')
        .eq('clinic_id', clinicId)
        .in('status', ['Scheduled', 'In-progress'])
        .lt('appointment_date', oneHourAgo.split('T')[0]) // filter by date first for efficiency
        .filter( 'appointment_time', 'lt', oneHourAgo.split('T')[1]); // then by time

    // This is a simplified approach. A proper way would be to create a timestamp column.
    // For now, we will manually filter.
     const { data: allPotentials, error: fetchAllError } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time')
        .eq('clinic_id', clinicId)
        .in('status', ['Scheduled', 'In-progress'])
        .lte('appointment_date', oneHourAgo.split('T')[0]); // Get all appointments up to today

     if (fetchAllError) {
        console.error("Error fetching appointments for auto-complete:", fetchAllError);
        return;
    }

    const now = new Date();
    const idsToUpdate = allPotentials
        .filter(app => {
            const appDateTime = new Date(`${app.appointment_date}T${app.appointment_time}`);
            return appDateTime < subHours(now, 1);
        })
        .map(app => app.id);


    if (idsToUpdate.length === 0) {
        return; // Nothing to update
    }

    // 2. Update their status to 'Completed'
    const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'Completed' })
        .in('id', idsToUpdate);

    if (updateError) {
        console.error('Error auto-completing appointments:', updateError);
    } else {
        console.log(`Auto-completed ${idsToUpdate.length} appointments.`);
    }
}


export async function getDashboardData(dateString: string) {
    const supabase = createClient();

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
            patients (id, first_name, last_name),
            doctors:profiles (id, first_name, last_name)
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
    const formattedAppointments = appointmentsToday?.map(app => ({
        id: app.id,
        patientName: app.patients ? `${app.patients.first_name} ${app.patients.last_name}` : 'Paciente no encontrado',
        doctorName: app.doctors ? `Dr. ${app.doctors.first_name} ${app.doctors.last_name}` : 'Doctor no asignado',
        service_description: app.service_description,
        appointment_time: app.appointment_time,
        status: app.status
    }));

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
