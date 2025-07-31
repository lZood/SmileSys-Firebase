
'use server';

import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function getDashboardData() {
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
    const today = new Date();
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

    // 3. Get appointments for today
    const { data: appointmentsToday, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', format(today, 'yyyy-MM-dd'))
        .order('appointment_time', { ascending: true });


    if (patientsError || paymentsError || appointmentsError || generalPaymentsError) {
        console.error({ patientsError, paymentsError, appointmentsError, generalPaymentsError });
        return { error: 'Failed to fetch dashboard data' };
    }

    return {
        totalPatients: totalPatients ?? 0,
        totalIncomeThisMonth,
        appointmentsToday: appointmentsToday ?? [],
        appointmentsTodayCount: appointmentsToday?.length ?? 0
    };
}
