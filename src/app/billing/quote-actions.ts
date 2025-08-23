'use server';

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

type QuoteDetails = {
    id: string;
    patient_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    expires_at: string;
    notes?: string;
    patientName: string;
    items: Array<{
        id: string;
        quote_id: string;
        description: string;
        cost: number;
    }>;
};

const quoteItemSchema = z.object({
    description: z.string().min(1, "La descripción es requerida"),
    cost: z.number().positive("El costo debe ser positivo")
});

const createQuoteSchema = z.object({
    patientId: z.string().uuid(),
    clinicId: z.string().uuid(),
    items: z.array(quoteItemSchema),
    total: z.number().positive(),
    notes: z.string().optional(),
    expiresAt: z.string()
});

export async function createQuote(data: z.infer<typeof createQuoteSchema>) {
    const supabase = await createClient();
    
    const parsedData = createQuoteSchema.safeParse(data);
    if (!parsedData.success) {
        return { error: `Datos inválidos: ${parsedData.error.errors.map(e => e.message).join(', ')}` };
    }

    const { patientId, clinicId, items, total, notes, expiresAt } = parsedData.data;

    // Insertar el presupuesto
    const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
            patient_id: patientId,
            clinic_id: clinicId,
            total_amount: total,
            notes,
            expires_at: expiresAt,
            status: 'Draft'
        })
        .select()
        .single();

    if (quoteError) {
        console.error("Error creating quote:", quoteError);
        return { error: 'Error al crear el presupuesto.' };
    }

    // Insertar los items del presupuesto
    const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(
            items.map(item => ({
                quote_id: quote.id,
                description: item.description,
                cost: item.cost
            }))
        );

    if (itemsError) {
        console.error("Error creating quote items:", itemsError);
        // Intentar eliminar el presupuesto si falló la inserción de items
        await supabase.from('quotes').delete().eq('id', quote.id);
        return { error: 'Error al crear los items del presupuesto.' };
    }

        revalidatePath('/billing');
        return { error: null };
    }

    // Actualizar el estado de un presupuesto
    export async function updateQuoteStatus(quoteId: string, status: string) {
        const supabase = await createClient();
        
        console.log(`Actualizando presupuesto ${quoteId} a estado ${status}`);
        
        const { data, error } = await supabase
            .from('quotes')
            .update({ status })
            .eq('id', quoteId)
            .select()
            .single();

        if (error) {
            console.error('Error updating quote status:', error);
            return { error: 'Error al actualizar el estado del presupuesto.' };
        }

        console.log('Presupuesto actualizado:', data);
        revalidatePath('/billing');
        return { error: null, data };
    }
    
    // Obtener presupuestos para la clínica
    // Obtener detalles de un presupuesto específico
    export async function getQuoteDetails(quoteId: string) {
        const supabase = await createClient();
        
        const [quoteResult, itemsResult] = await Promise.all([
            // Obtener detalles del presupuesto
            supabase
                .from('quotes')
                .select(`
                    id,
                    patient_id,
                    total_amount,
                    status,
                    created_at,
                    expires_at,
                    notes,
                    patients:patient_id (id, first_name, last_name)
                `)
                .eq('id', quoteId)
                .single(),
            
            // Obtener los items del presupuesto
            supabase
                .from('quote_items')
                .select('*')
                .eq('quote_id', quoteId)
        ]);

        if (quoteResult.error || itemsResult.error) {
            console.error('Error fetching quote details:', quoteResult.error || itemsResult.error);
            return null;
        }

        return {
            ...quoteResult.data,
            items: itemsResult.data || [],
            patientName: Array.isArray(quoteResult.data.patients) && quoteResult.data.patients.length > 0
                ? `${quoteResult.data.patients[0].first_name} ${quoteResult.data.patients[0].last_name}`
                : ''
        };
    }
    
    export async function getQuotesForClinic() {
        const supabase = await createClient();
        // Obtener todos los presupuestos y datos del paciente
        const { data, error } = await supabase
            .from('quotes')
            .select(`
                id,
                patient_id,
                total_amount,
                status,
                created_at,
                expires_at,
                patients:patient_id (first_name, last_name)
            `)
            .order('created_at', { ascending: false });
    
        if (error) {
            console.error('Error fetching quotes:', error);
            return [];
        }
    
        // Mapear los datos al formato esperado por la UI
        return (data || []).map((q: any) => ({
            id: q.id,
            patientId: q.patient_id,
            patientName: q.patients ? `${q.patients.first_name} ${q.patients.last_name}` : '',
            total: q.total_amount,
            status: q.status,
            createdAt: q.created_at,
            expiresAt: q.expires_at
        }));
    }

    export async function getQuotesForPatient(patientId: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('quotes')
            .select(`id, total_amount, status, created_at, expires_at`)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching patient quotes:', error);
            return [];
        }
        return (data || []).map(q => ({
            id: q.id,
            total: (q as any).total_amount,
            status: (q as any).status,
            createdAt: (q as any).created_at,
            expiresAt: (q as any).expires_at,
        }));
    }
