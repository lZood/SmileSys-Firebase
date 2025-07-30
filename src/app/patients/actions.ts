
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPatient(formData: any) {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'No se pudo autenticar al usuario. Por favor, inicie sesión de nuevo.' };
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();
    
    if (profileError || !profile) {
        return { error: 'No se pudo encontrar el perfil del usuario.' };
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
        status: 'Active',
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

export async function getPatients() {
    const supabase = createClient();
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

export async function getPatientById(id: string) {
    const supabase = createClient();
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

export async function deletePatient(id: string) {
    const supabase = createClient();
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
    const supabase = createClient();
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
    const supabase = createClient();
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

    