
'use server';

import { createClient } from "@/lib/supabase/server";

export async function getAppointmentsForPatient(patientId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });

    if (error) {
        console.error('Error fetching appointments for patient:', error);
        return [];
    }

    return data;
}
