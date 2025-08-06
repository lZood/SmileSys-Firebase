
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPatientById } from '../patients/actions';

const treatmentSchema = z.object({
    patientId: z.string().uuid(),
    clinicId: z.string().uuid(),
    description: z.string().min(1, "La descripción es requerida."),
    totalCost: z.number().positive("El costo total debe ser positivo."),
    paymentType: z.enum(['monthly', 'one_time']),
    durationMonths: z.number().optional().nullable(),
    monthlyPayment: z.number().optional().nullable(),
});

export async function createTreatment(data: z.infer<typeof treatmentSchema>) {
    const supabase = await createClient();

    const parsedData = treatmentSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }
    const { patientId, clinicId, description, totalCost, paymentType, durationMonths, monthlyPayment } = parsedData.data;

    const { error } = await supabase.from('treatments').insert({
        patient_id: patientId,
        clinic_id: clinicId,
        description,
        total_cost: totalCost,
        payment_type: paymentType,
        duration_months: durationMonths,
        monthly_payment: monthlyPayment,
        status: 'active',
    });

    if (error) {
        console.error("Error creando tratamiento:", error);
        return { error: `Error al crear el tratamiento: ${error.message}` };
    }

    revalidatePath('/billing');
    revalidatePath(`/patients/${patientId}`);
    return { error: null };
}

const updateTreatmentSchema = z.object({
    treatmentId: z.string().uuid(),
    description: z.string().min(1, "La descripción es requerida."),
    totalCost: z.number().positive("El costo total debe ser positivo."),
    paymentType: z.enum(['monthly', 'one_time']),
    durationMonths: z.number().optional().nullable(),
    monthlyPayment: z.number().optional().nullable(),
    status: z.enum(['active', 'completed', 'cancelled']),
});

export async function updateTreatment(data: z.infer<typeof updateTreatmentSchema>) {
    const supabase = await createClient();
    const parsedData = updateTreatmentSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }

    const { treatmentId, ...updateData } = parsedData.data;
    const { data: treatment} = await supabase.from('treatments').select('patient_id').eq('id', treatmentId).single();
    
    const { error } = await supabase
        .from('treatments')
        .update({
            description: updateData.description,
            total_cost: updateData.totalCost,
            payment_type: updateData.paymentType,
            duration_months: updateData.durationMonths,
            monthly_payment: updateData.monthlyPayment,
            status: updateData.status,
        })
        .eq('id', treatmentId);
    
    if (error) {
        console.error("Error updating treatment:", error);
        return { error: 'Error al actualizar el tratamiento.' };
    }

    revalidatePath('/billing');
    if (treatment?.patient_id) {
        revalidatePath(`/patients/${treatment.patient_id}`);
    }
    return { error: null };
}

export async function getTreatmentsForClinic() {
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
        .from('treatments')
        .select(`
            *,
            patients (id, first_name, last_name),
            treatment_payments (amount_paid)
        `)
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching treatments:", error);
        return [];
    }
    
    return data.map(treatment => ({
        ...treatment,
        total_paid: treatment.treatment_payments.reduce((sum, p) => sum + p.amount_paid, 0)
    }));
}

export async function getTreatmentsForPatient(patientId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('treatments')
        .select(`
            *,
            patients (id, first_name, last_name),
            treatment_payments (amount_paid)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching treatments for patient:", error);
        return [];
    }

    return data.map(treatment => ({
        ...treatment,
        total_paid: treatment.treatment_payments.reduce((sum, p) => sum + p.amount_paid, 0)
    }));
}


const paymentSchema = z.object({
    treatmentId: z.string().uuid(),
    amount: z.number().positive("El monto debe ser positivo."),
    paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Fecha inválida."),
    paymentMethod: z.enum(['Cash', 'Card', 'Transfer']).optional(),
    notes: z.string().optional()
});

export async function addPaymentToTreatment(data: z.infer<typeof paymentSchema>) {
    const supabase = await createClient();
    
    const parsedData = paymentSchema.safeParse(data);
    if(!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }
    const { treatmentId, amount, paymentDate, paymentMethod, notes } = parsedData.data;

    const { data: treatment } = await supabase.from('treatments').select('clinic_id, patient_id').eq('id', treatmentId).single();
    if (!treatment) {
        return { error: 'Tratamiento no encontrado.' };
    }

    const { error } = await supabase.from('treatment_payments').insert({
        treatment_id: treatmentId,
        clinic_id: treatment.clinic_id,
        amount_paid: amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes
    });

    if (error) {
        console.error("Error adding payment:", error);
        return { error: `Error al registrar el pago: ${error.message}` };
    }

    revalidatePath('/billing');
    revalidatePath(`/patients/${treatment.patient_id}`);
    return { error: null };
}

export async function getPaymentsForClinic() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated', data: [] };

    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return { error: 'Profile not found', data: [] };

    const [treatmentPaymentsRes, generalPaymentsRes] = await Promise.all([
        supabase
            .from('treatment_payments')
            .select('*, treatments(description, patients(id, first_name, last_name))')
            .eq('clinic_id', profile.clinic_id),
        supabase
            .from('general_payments')
            .select('*, patients(id, first_name, last_name)')
            .eq('clinic_id', profile.clinic_id)
    ]);
    
    if (treatmentPaymentsRes.error) {
        console.error("Error fetching treatment payments:", treatmentPaymentsRes.error);
        return { error: 'Failed to fetch treatment payments', data: [] };
    }
    if(generalPaymentsRes.error) {
        console.error("Error fetching general payments:", generalPaymentsRes.error);
        return { error: 'Failed to fetch general payments', data: [] };
    }

    const formattedTreatmentPayments = treatmentPaymentsRes.data?.map(p => ({
        id: p.id,
        patientName: p.treatments?.patients ? `${p.treatments.patients.first_name} ${p.treatments.patients.last_name}` : 'Paciente no encontrado',
        patientId: p.treatments?.patients?.id,
        amount: p.amount_paid,
        date: p.payment_date,
        method: p.payment_method,
        concept: p.treatments?.description || 'Pago de Tratamiento',
        status: 'Paid',
    }));

     const formattedGeneralPayments = generalPaymentsRes.data?.map(p => ({
        id: p.id,
        patientName: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : 'Paciente no encontrado',
        patientId: p.patient_id,
        amount: p.amount,
        date: p.payment_date,
        method: p.payment_method,
        concept: p.description || 'Pago General',
        status: 'Paid',
    }));

    const allPayments = [...(formattedTreatmentPayments || []), ...(formattedGeneralPayments || [])];
    allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { error: null, data: allPayments };
}

export async function getPaymentsForPatient(patientId: string) {
    const supabase = await createClient();
    if (!patientId) return [];

    const { data: patient, error: patientError } = await supabase.from('patients').select('id').eq('id', patientId).single();
    if (patientError || !patient) {
        console.error("Error fetching patient for payments:", patientError);
        return [];
    }

    const [treatmentPaymentsRes, generalPaymentsRes] = await Promise.all([
        supabase
            .from('treatment_payments')
            .select('*, treatments(description)')
            .eq('patient_id', patientId),
        supabase
            .from('general_payments')
            .select('*')
            .eq('patient_id', patientId)
    ]);

    if (treatmentPaymentsRes.error) {
        console.error("Error fetching patient treatment payments:", treatmentPaymentsRes.error);
    }
    if (generalPaymentsRes.error) {
        console.error("Error fetching patient general payments:", generalPaymentsRes.error);
    }
    
    const formattedTreatmentPayments = (treatmentPaymentsRes.data || []).map(p => ({
        id: p.id,
        amount: p.amount_paid,
        date: p.payment_date,
        method: p.payment_method,
        concept: p.treatments?.description || 'Pago de Tratamiento',
        status: 'Paid',
    }));

    const formattedGeneralPayments = (generalPaymentsRes.data || []).map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.payment_date,
        method: p.payment_method,
        concept: p.description || 'Pago General',
        status: 'Paid',
    }));

    const allPayments = [...formattedTreatmentPayments, ...formattedGeneralPayments];
    allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return allPayments;
}


const generalPaymentSchema = z.object({
  patientId: z.string().uuid("Seleccione un paciente."),
  amount: z.number().positive("El monto debe ser positivo."),
  paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Fecha inválida."),
  paymentMethod: z.enum(['Cash', 'Card', 'Transfer'], { required_error: "Seleccione un método de pago." }),
  description: z.string().min(1, "La descripción es requerida."),
  clinicId: z.string().uuid(),
});

export async function createGeneralPayment(data: z.infer<typeof generalPaymentSchema>) {
    const supabase = await createClient();
    const parsedData = generalPaymentSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }
    
    const { error } = await supabase.from('general_payments').insert({
        patient_id: data.patientId,
        clinic_id: data.clinicId,
        amount: data.amount,
        payment_date: data.paymentDate,
        payment_method: data.paymentMethod,
        description: data.description,
    });
    
    if (error) {
        console.error("Error creating general payment:", error);
        return { error: 'Error al registrar el pago.' };
    }
    
    revalidatePath('/billing');
    revalidatePath(`/patients/${data.patientId}`);
    return { error: null };
}

export async function getPatientsForBilling() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return [];

    const { data, error } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .eq('clinic_id', profile.clinic_id)
        .order('last_name', { ascending: true });

    if (error) {
        console.error("Error fetching patients for billing:", error);
        return [];
    }

    return data;
}


export async function deleteTreatment(treatmentId: string) {
    const supabase = await createClient();

    const { data: treatment, error: fetchError } = await supabase.from('treatments').select('patient_id').eq('id', treatmentId).single();
    if(fetchError || !treatment) {
        return { error: 'No se pudo encontrar el tratamiento a eliminar.' };
    }

    const { error } = await supabase.from('treatments').delete().eq('id', treatmentId);
    if(error) {
        return { error: `Error al eliminar el tratamiento: ${error.message}` };
    }

    revalidatePath('/billing');
    revalidatePath(`/patients/${treatment.patient_id}`);
    return { error: null };
}
