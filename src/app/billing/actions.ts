
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
            patients (first_name, last_name),
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
    notes: z.string().optional()
});

export async function addPaymentToTreatment(data: z.infer<typeof paymentSchema>) {
    const supabase = createClient();
    
    // Validar datos de entrada
    const parsedData = paymentSchema.safeParse(data);
    if(!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }
    const { treatmentId, amount, paymentDate, notes } = parsedData.data;

    // Obtener clinic_id del tratamiento para la política de seguridad
    const { data: treatment } = await supabase.from('treatments').select('clinic_id').eq('id', treatmentId).single();
    if (!treatment) {
        return { error: 'Tratamiento no encontrado.' };
    }

    // Insertar el pago
    const { error } = await supabase.from('treatment_payments').insert({
        treatment_id: treatmentId,
        clinic_id: treatment.clinic_id, // Usar el clinic_id del tratamiento
        amount_paid: amount,
        payment_date: paymentDate,
        notes: notes
    });

    if (error) {
        console.error("Error adding payment:", error);
        return { error: `Error al registrar el pago: ${error.message}` };
    }

    revalidatePath('/billing');
    return { error: null };
}
