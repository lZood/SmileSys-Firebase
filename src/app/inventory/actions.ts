
'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// --- Schema Definitions ---
const createItemSchema = z.object({
    name: z.string().min(1, "El nombre es requerido."),
    categoryId: z.string().uuid("Debe seleccionar una categoría válida."),
    stock: z.number().int().nonnegative("El stock no puede ser negativo."),
    minStock: z.number().int().nonnegative("El stock mínimo no puede ser negativo."),
    price: z.number().nonnegative("El precio no puede ser negativo."),
    provider: z.string().optional(),
});

const updateItemSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, "El nombre es requerido."),
    categoryId: z.string().uuid("Debe seleccionar una categoría válida."),
    minStock: z.number().int().nonnegative("El stock mínimo no puede ser negativo."),
    price: z.number().nonnegative("El precio no puede ser negativo."),
    provider: z.string().optional().nullable(),
});

const createCategorySchema = z.object({
    name: z.string().min(1, "El nombre de la categoría es requerido."),
});

const adjustStockSchema = z.object({
    itemId: z.string().uuid(),
    change: z.number().int().refine(val => val !== 0, "El cambio no puede ser cero."),
    notes: z.string().optional(),
});


// --- Helper function to get clinic_id ---
async function getClinicId(supabase: ReturnType<typeof createClient>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado.');

    const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', user.id)
        .single();
    
    if (!profile) throw new Error('Perfil de usuario no encontrado.');
    return { clinicId: profile.clinic_id, userId: user.id };
}

// --- Main Functions ---

export async function getInventoryItems() {
    const supabase = createClient();
    try {
        const { clinicId } = await getClinicId(supabase);
        const { data, error } = await supabase
            .from('inventory_items')
            .select(`
                *,
                inventory_categories ( id, name )
            `)
            .eq('clinic_id', clinicId)
            .order('name', { ascending: true });

        if (error) throw error;

        return data.map(item => ({
            ...item,
            category: item.inventory_categories?.name || 'Sin Categoría',
            categoryId: item.inventory_categories?.id,
            status: item.stock <= 0 ? 'Out of Stock' : (item.stock <= item.min_stock ? 'Low Stock' : 'In Stock')
        }));

    } catch (e: any) {
        console.error("Error fetching inventory items:", e.message);
        return [];
    }
}

export async function getInventoryCategories() {
    const supabase = createClient();
    try {
        const { clinicId } = await getClinicId(supabase);
        const { data, error } = await supabase
            .from('inventory_categories')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    } catch (e: any) {
        console.error("Error fetching inventory categories:", e.message);
        return [];
    }
}

export async function createInventoryCategory(formData: z.infer<typeof createCategorySchema>) {
    const supabase = createClient();
    const parsedData = createCategorySchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }

    try {
        const { clinicId } = await getClinicId(supabase);
        const { data: newCategory, error } = await supabase
            .from('inventory_categories')
            .insert({ name: parsedData.data.name, clinic_id: clinicId })
            .select()
            .single();

        if (error) throw error;
        
        revalidatePath('/inventory');
        return { data: newCategory, error: null };
    } catch (e: any) {
        return { error: e.message };
    }
}


export async function createInventoryItem(formData: z.infer<typeof createItemSchema>) {
    const supabase = createClient();
    const parsedData = createItemSchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }
    
    const { name, categoryId, stock, minStock, price, provider } = parsedData.data;

    try {
        const { clinicId, userId } = await getClinicId(supabase);

        // 1. Create the item
        const { data: newItem, error: itemError } = await supabase
            .from('inventory_items')
            .insert({
                name,
                category_id: categoryId,
                stock,
                min_stock: minStock,
                price,
                provider,
                clinic_id: clinicId,
            })
            .select()
            .single();

        if (itemError) throw itemError;

        // 2. Create the initial stock movement
        if (stock > 0) {
            await supabase.from('inventory_movements').insert({
                item_id: newItem.id,
                clinic_id: clinicId,
                user_id: userId,
                change: stock,
                new_stock: stock,
                type: 'initial',
                notes: 'Stock inicial al crear artículo.',
            });
        }
        
        revalidatePath('/inventory');
        return { error: null };
    } catch (e: any) {
        console.error("Error creating inventory item:", e.message);
        return { error: e.message };
    }
}

export async function updateInventoryItem(formData: z.infer<typeof updateItemSchema>) {
    const supabase = createClient();
    const parsedData = updateItemSchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }
    
    const { id, name, categoryId, minStock, price, provider } = parsedData.data;

    try {
        const { clinicId } = await getClinicId(supabase);
        const { error } = await supabase
            .from('inventory_items')
            .update({
                name,
                category_id: categoryId,
                min_stock: minStock,
                price,
                provider,
            })
            .eq('id', id)
            .eq('clinic_id', clinicId); // Security check

        if (error) throw error;
        
        revalidatePath('/inventory');
        return { error: null };
    } catch(e: any) {
        console.error("Error updating inventory item:", e.message);
        return { error: e.message };
    }
}


export async function adjustStock(formData: z.infer<typeof adjustStockSchema>) {
    const supabase = createClient();
    const parsedData = adjustStockSchema.safeParse(formData);
    if (!parsedData.success) {
        return { error: parsedData.error.errors.map(e => e.message).join(', ') };
    }
    const { itemId, change, notes } = parsedData.data;

    try {
        const { clinicId, userId } = await getClinicId(supabase);
        
        // Use RPC to handle stock update atomically
        const { data: updatedItem, error } = await supabase.rpc('adjust_inventory_stock', {
            p_item_id: itemId,
            p_change: change,
            p_clinic_id: clinicId
        }).select().single();

        if (error) throw new Error(`Error en RPC: ${error.message}`);
        if (!updatedItem) throw new Error('No se pudo actualizar el artículo. El artículo podría no existir.');

        // Log the movement
        await supabase.from('inventory_movements').insert({
            item_id: itemId,
            clinic_id: clinicId,
            user_id: userId,
            change: change,
            new_stock: updatedItem.stock,
            type: 'adjustment',
            notes: notes || 'Ajuste manual de stock.',
        });

        revalidatePath('/inventory');
        return { data: updatedItem, error: null };

    } catch (e: any) {
        console.error("Error adjusting stock:", e.message);
        return { error: e.message };
    }
}
