
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
    const supabase = createClient();

    // 1. Validar datos
    const parsedData = treatmentSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }
    const { patientId, clinicId, description, totalCost, paymentType, durationMonths, monthlyPayment } = parsedData.data;

    // 2. Insertar tratamiento
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
    return { error: null };
}

export async function getTreatmentsForClinic() {
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
    
    // Calcular el total pagado para cada tratamiento
    return data.map(treatment => ({
        ...treatment,
        total_paid: treatment.treatment_payments.reduce((sum, p) => sum + p.amount_paid, 0)
    }));
}


const paymentSchema = z.object({
    treatmentId: z.string().uuid(),
    amount: z.number().positive("El monto debe ser positivo."),
    paymentDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Fecha inválida."),
    paymentMethod: z.enum(['Cash', 'Card', 'Transfer']),
    notes: z.string().optional()
});

export async function addPaymentToTreatment(data: z.infer<typeof paymentSchema>) {
    const supabase = createClient();
    
    const parsedData = paymentSchema.safeParse(data);
    if(!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }
    const { treatmentId, amount, paymentDate, paymentMethod, notes } = parsedData.data;

    const { data: treatment } = await supabase.from('treatments').select('clinic_id').eq('id', treatmentId).single();
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
    return { error: null };
}

export async function getPaymentsForClinic() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated', data: [] };

    const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', user.id).single();
    if (!profile) return { error: 'Profile not found', data: [] };

    const [treatmentPayments, generalPayments] = await Promise.all([
        supabase
            .from('treatment_payments')
            .select('*, treatments(description), patients(id, first_name, last_name)')
            .eq('clinic_id', profile.clinic_id),
        supabase
            .from('general_payments')
            .select('*, patients(id, first_name, last_name)')
            .eq('clinic_id', profile.clinic_id)
    ]);
    
    if (treatmentPayments.error || generalPayments.error) {
        console.error("Error fetching payments:", treatmentPayments.error || generalPayments.error);
        return { error: 'Failed to fetch payments', data: [] };
    }

    const formattedTreatmentPayments = treatmentPayments.data.map(p => ({
        id: p.id,
        patientName: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : 'Paciente no encontrado',
        patientId: p.patients?.id,
        amount: p.amount_paid,
        date: p.payment_date,
        method: p.payment_method,
        concept: p.treatments?.description || 'Pago de Tratamiento',
        status: 'Paid',
    }));

     const formattedGeneralPayments = generalPayments.data.map(p => ({
        id: p.id,
        patientName: p.patients ? `${p.patients.first_name} ${p.patients.last_name}` : 'Paciente no encontrado',
        patientId: p.patients?.id,
        amount: p.amount,
        date: p.payment_date,
        method: p.payment_method,
        concept: p.description || 'Pago General',
        status: 'Paid',
    }));

    const allPayments = [...formattedTreatmentPayments, ...formattedGeneralPayments];
    allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { error: null, data: allPayments };
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
    const supabase = createClient();
    const parsedData = generalPaymentSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }
    
    const { error } = await supabase.from('general_payments').insert(parsedData.data);
    
    if (error) {
        console.error("Error creating general payment:", error);
        return { error: 'Error al registrar el pago.' };
    }
    
    revalidatePath('/billing');
    return { error: null };
}

export async function getPatientsForBilling() {
    const supabase = createClient();
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
