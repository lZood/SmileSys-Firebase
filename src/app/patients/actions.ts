'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function addPatient(formData: any) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'No se pudo autenticar al usuario. Por favor, inicie sesión de nuevo.' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('clinic_id, roles')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        return { error: 'No se pudo encontrar el perfil del usuario.' };
    }

    // Server-side enforcement: staff-only users cannot create full patients
    const roles: string[] = Array.isArray((profile as any).roles) ? (profile as any).roles : [];
    const isStaffOnly = roles.includes('staff') && !roles.includes('admin') && !roles.includes('doctor');
    if (isStaffOnly) {
        return { error: 'Tu rol solo permite crear pacientes temporales.' };
    }

    const patientData = {
        clinic_id: profile.clinic_id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        age: formData.age,
        gender: formData.gender,
        occupation: formData.occupation,
        phone: formData.phone,
        address: formData.address,
        email: formData.email,
        medical_conditions: formData.medicalConditions,
        pregnancy_quarter: formData.pregnancyQuarter,
        current_medications: formData.currentMedications,
        blood_pressure: formData.bloodPressure,
        pulse: formData.pulse,
        temperature: formData.temperature,
        medical_diagnosis: formData.medicalDiagnosis,
        dental_chart: formData.dentalChart,
        status: formData.status || 'Active',
    };
    
    const { error: insertError } = await supabase
        .from('patients')
        .insert(patientData);

    if (insertError) {
        console.error('Error inserting patient:', insertError);
        return { error: `Error al guardar el paciente: ${insertError.message}` };
    }
    
    revalidatePath('/patients');
    return { error: null };
}

// Quick add a temporary (pending) patient with minimal data
export async function addTemporaryPatient(data: { firstName: string; lastName: string; email?: string; phone?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return { error: 'Perfil no encontrado' };
    const insertData: any = {
        clinic_id: profile.clinic_id,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        status: 'Pending',
        medical_diagnosis: 'Pendiente', // placeholder to satisfy NOT NULL
        dental_chart: {},
        medical_conditions: {},
    };
    const { error } = await supabase.from('patients').insert(insertData);
    if (error) {
        console.error('addTemporaryPatient error', error);
        return { error: error.message };
    }
    revalidatePath('/patients');
    return { error: null };
}

export async function getPatients() {
    const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

    if (!profile) return [];

    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching patients:', error);
        return [];
    }

    return data;
}

// Paginated patients with optional search and status filters
export async function getPatientsPaginated(params: { limit: number; offset: number; searchTerm?: string; status?: string }) {
    const { limit, offset, searchTerm, status } = params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { items: [], total: 0 };

    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();
    if (!profile) return { items: [], total: 0 };

    let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .eq('clinic_id', profile.clinic_id);

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }
    if (searchTerm && searchTerm.trim().length > 0) {
        const term = searchTerm.trim();
        // ilike on first_name, last_name, email
        query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const from = Math.max(0, offset);
    const to = Math.max(from, from + Math.max(1, limit) - 1);

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching patients paginated:', error);
        return { items: [], total: 0, error: error.message } as any;
    }

    return { items: data || [], total: count || 0 };
}

export async function getPatientById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching patient by id:', error);
        return null;
    }
    return data;
}

export async function getDoctorsForClinic(clinicId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, roles')
        .eq('clinic_id', clinicId)
        .contains('roles', ['doctor']);

    if (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
    return data;
}

export async function deletePatient(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

    if (error) {
        return { error: `Error al eliminar el paciente: ${error.message}` };
    }
    
    revalidatePath('/patients');
    return { error: null };
}

export async function uploadConsentForm(patientId: string, clinicId: string, file: Blob, fileName: string) {
    const supabase = await createClient();

    // Server-side validation: ensure the user belongs to the clinic they are uploading for
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Usuario no autenticado.' };
    }
    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

    if (!profile || profile.clinic_id !== clinicId) {
        return { error: 'No tienes permiso para realizar esta acción en esta clínica.' };
    }
    
    const filePath = `${clinicId}/${patientId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('consent-forms')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Error uploading consent form:', uploadError);
        return { error: `Error al subir el archivo: ${uploadError.message}` };
    }

    const { error: dbError } = await supabase
        .from('consent_documents')
        .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            file_path: filePath,
        });
    
    if (dbError) {
        console.error('Error saving consent document record:', dbError);
        // Attempt to delete the orphaned file from storage
        await supabase.storage.from('consent-forms').remove([filePath]);
        return { error: `Error al guardar el registro del documento: ${dbError.message}` };
    }

    revalidatePath(`/patients/${patientId}`);
    return { error: null };
}

export async function getConsentFormsForPatient(patientId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('consent_documents')
        .select('id, file_path, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching consent forms:', error);
        return [];
    }
    return data;
}


const updateDentalChartSchema = z.object({
    patientId: z.string().uuid(),
    clinicId: z.string().uuid(),
    dentalChart: z.any(),
});

export async function updatePatientDentalChart(data: z.infer<typeof updateDentalChartSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'No autorizado' };

    const parsedData = updateDentalChartSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: parsedData.error.message };
    }

    const { patientId, clinicId, dentalChart } = parsedData.data;

    // 1. Update the patient's record
    const { error: patientUpdateError } = await supabase
        .from('patients')
        .update({ dental_chart: dentalChart })
        .eq('id', patientId);

    if (patientUpdateError) {
        console.error("Error updating patient's dental chart:", patientUpdateError);
        return { error: 'No se pudo actualizar la ficha del paciente.' };
    }

    // 2. Log the change in the new dental_updates table
    const { error: logError } = await supabase
        .from('dental_updates')
        .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            dental_chart: dentalChart,
            updated_by: user.id,
            notes: 'Actualización de odontograma desde la interfaz de paciente.'
        });
    
    if (logError) {
        // This is not a critical failure, we can just log it and proceed.
        // In a more robust system, you might want to handle this more gracefully.
        console.error("Error logging dental chart update:", logError);
    }
    
    revalidatePath(`/patients/${patientId}`);
    return { error: null };
}

export async function getDentalUpdatesForPatient(patientId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('dental_updates')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching dental updates for patient:', error);
        return [];
    }

    return data;
}

export async function updatePatientStatus(id: string, status: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return { error: 'Perfil no encontrado' };
    // Ensure patient belongs to same clinic
    const { data: patient } = await supabase.from('patients').select('clinic_id').eq('id', id).single();
    if (!patient || patient.clinic_id !== profile.clinic_id) return { error: 'Sin permiso' };
    const { error } = await supabase.from('patients').update({ status }).eq('id', id);
    if (error) {
        console.error('updatePatientStatus error', error);
        return { error: error.message };
    }
    revalidatePath('/patients');
    return { error: null };
}

// Complete a pending patient by updating the existing record with full details
export async function completePendingPatient(patientId: string, formData: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // Fetch profile for clinic scoping (and potential role-based checks if needed)
    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id, roles')
        .eq('id', user.id)
        .single();
    if (!profile) return { error: 'Perfil no encontrado' };

    // Ensure patient belongs to same clinic and exists
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
    if (patientError || !patient) return { error: 'Paciente no encontrado' };
    if (patient.clinic_id !== profile.clinic_id) return { error: 'Sin permiso' };

    // Optional: enforce that only Pending can be completed
    // if (patient.status !== 'Pending') return { error: 'Solo pacientes pendientes pueden completarse.' };

    const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        age: formData.age,
        gender: formData.gender,
        occupation: formData.occupation,
        phone: formData.phone,
        address: formData.address,
        email: formData.email,
        medical_conditions: formData.medicalConditions,
        pregnancy_quarter: formData.pregnancyQuarter,
        current_medications: formData.currentMedications,
        blood_pressure: formData.bloodPressure,
        pulse: formData.pulse,
        temperature: formData.temperature,
        medical_diagnosis: formData.medicalDiagnosis,
        dental_chart: formData.dentalChart,
        status: 'Active',
    } as any;

    const { error: updateError } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patientId);
    if (updateError) {
        console.error('completePendingPatient error', updateError);
        return { error: updateError.message };
    }

    revalidatePath('/patients');
    return { error: null };
}

