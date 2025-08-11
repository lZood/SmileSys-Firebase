'use server';

import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export type ReportDateRange = {
    startDate: string;
    endDate: string;
};

export async function getRevenueData(dateRange: ReportDateRange) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "No autorizado" };

    const { data: clinicData } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

    if (!clinicData) return { error: "Clínica no encontrada" };

    const { data: payments, error } = await supabase
        .from('treatment_payments')
        .select(`
            amount_paid,
            payment_date,
            treatment:treatments(
                name
            )
        `)
        .eq('clinic_id', clinicData.clinic_id)
        .gte('payment_date', dateRange.startDate)
        .lte('payment_date', dateRange.endDate);

    if (error) {
        console.error('Error fetching revenue data:', error);
        return { error: error.message };
    }

    return { data: payments };
}

export async function getMonthlyRevenue(months: number = 6) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "No autorizado" };

    const { data: clinicData } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

    if (!clinicData) return { error: "Clínica no encontrada" };

    // Generar array de los últimos 6 meses
    const monthsArray = Array.from({ length: months }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
            start: format(startOfMonth(date), 'yyyy-MM-dd'),
            end: format(endOfMonth(date), 'yyyy-MM-dd'),
            month: format(date, 'MMM yyyy')
        };
    }).reverse();

    // Obtener ingresos para cada mes
    const monthlyData = await Promise.all(
        monthsArray.map(async (month) => {
            const { data: payments } = await supabase
                .from('treatment_payments')
                .select('amount_paid')
                .eq('clinic_id', clinicData.clinic_id)
                .gte('payment_date', month.start)
                .lte('payment_date', month.end);

            const revenue = payments?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;

            return {
                month: month.month,
                revenue
            };
        })
    );

    return { data: monthlyData };
}

export async function getQuotesData(dateRange: ReportDateRange) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "No autorizado" };

    const { data: clinicData } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

    if (!clinicData) return { error: "Clínica no encontrada" };

    const { data: quotes, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('clinic_id', clinicData.clinic_id)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);

    if (error) {
        console.error('Error fetching quotes data:', error);
        return { error: error.message };
    }

    return { data: quotes };
}

export async function getNewPatientsCount(dateRange: ReportDateRange) {
    const supabase = await createClient();
    const { data: profile } = await supabase.auth.getSession();
    if (!profile.session) return { error: "No autorizado" };

    const { data: clinicData } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', profile.session.user.id)
        .single();

    if (!clinicData) return { error: "Clínica no encontrada" };

    const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicData.clinic_id)
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);

    if (error) {
        console.error('Error fetching new patients count:', error);
        return { error: error.message };
    }

    return { data: count || 0 };
}

export async function getAppointmentsByDoctor(dateRange: ReportDateRange) {
    const supabase = await createClient();
    const { data: profile } = await supabase.auth.getSession();
    if (!profile.session) return { error: "No autorizado" };

    const { data: clinicData } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', profile.session.user.id)
        .single();

    if (!clinicData) return { error: "Clínica no encontrada" };

    const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
            doctor_id,
            profiles!doctor_id (
                first_name,
                last_name
            )
        `)
        .eq('clinic_id', clinicData.clinic_id)
        .gte('appointment_date', dateRange.startDate)
        .lte('appointment_date', dateRange.endDate);

    if (error) {
        console.error('Error fetching appointments by doctor:', error);
        return { error: error.message };
    }

    // Agrupar citas por doctor
    const appointmentsByDoctor = appointments.reduce((acc: any, curr) => {
        const doctorProfile = Array.isArray(curr.profiles) ? curr.profiles[0] : curr.profiles;
        const doctorName = `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}`;
        acc[doctorName] = (acc[doctorName] || 0) + 1;
        return acc;
    }, {});

    const data = Object.entries(appointmentsByDoctor).map(([doctor, appointments]) => ({
        doctor,
        appointments
    }));

    return { data };
}
