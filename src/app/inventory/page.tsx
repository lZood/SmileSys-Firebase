
'use client';

import * as React from 'react';
import { PlusCircle, Edit, Minus, Plus, AlertTriangle, Package, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getInventoryItems, getInventoryCategories, createInventoryItem, createInventoryCategory, adjustStock } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Updated type to reflect the new structure from Supabase
export type InventoryItem = {
    id: string;
    name: string;
    category: string; 
    stock: number;
    min_stock: number;
    price: number | null;
    provider: string | null;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
};

export type InventoryCategory = {
    id: string;
    name: string;
};


const getStatusClass = (status: string) => {
    switch (status) {
        case 'In Stock': return 'bg-green-100 text-green-800 border-green-200';
        case 'Low Stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Out of Stock': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const CreateCategoryModal = ({
    isOpen,
    onClose,
    onCategoryCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCategoryCreated: (newCategory: InventoryCategory) => void;
}) => {
    const { toast } = useToast();
    const [name, setName] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    const handleCreate = async () => {
        if (!name) {
            toast({ variant: 'destructive', title: 'Error', description: 'El nombre de la categoría no puede estar vacío.' });
            return;
        }
        setIsLoading(true);
        const result = await createInventoryCategory({ name });
        setIsLoading(false);

        if (result.error || !result.data) {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'No se pudo crear la categoría.' });
        } else {
            toast({ title: 'Categoría Creada' });
            onCategoryCreated(result.data);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Categoría</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category-name">Nombre de la Categoría</Label>
                        <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading ? 'Creando...' : 'Crear'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const NewItemForm = ({ 
    isOpen, 
    onClose,
    categories,
    onItemAdded,
    onCategoryCreated
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    categories: InventoryCategory[];
    onItemAdded: () => void;
    onCategoryCreated: (newCategory: InventoryCategory) => void;
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
    
    const [newItem, setNewItem] = React.useState({
        name: '',
        categoryId: '',
        stock: 0,
        minStock: 5,
        price: 0,
        provider: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setNewItem(prev => ({ ...prev, [id]: type === 'number' ? Number(value) : value }));
    };

    const handleCategoryChange = (value: string) => {
        setNewItem(prev => ({ ...prev, categoryId: value }));
    };

    const handleSubmit = async () => {
        if (!newItem.name || !newItem.categoryId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, completa el nombre y la categoría.' });
            return;
        }
        setIsLoading(true);
        const result = await createInventoryItem(newItem);
        setIsLoading(false);

        if (result.error) {
             toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: "Artículo Agregado", description: `${newItem.name} ha sido añadido al inventario.` });
            onItemAdded();
            onClose();
        }
    };
    
    return (
        <>
        <CreateCategoryModal 
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            onCategoryCreated={(newCategory) => {
                onCategoryCreated(newCategory);
                handleCategoryChange(newCategory.id);
            }}
        />
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Artículo</DialogTitle>
                    <DialogDescription>Completa los detalles del nuevo producto de inventario.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="name">Nombre <span className="text-red-500">*</span></Label><Input id="name" value={newItem.name} onChange={handleChange} /></div>
                        <div className="grid gap-2">
                            <Label htmlFor="category">Categoría <span className="text-red-500">*</span></Label>
                             <div className="flex items-center gap-2">
                                <Select value={newItem.categoryId} onValueChange={handleCategoryChange}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="icon" onClick={() => setIsCategoryModalOpen(true)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="provider">Proveedor</Label><Input id="provider" value={newItem.provider} onChange={handleChange} /></div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2"><Label htmlFor="stock">Cantidad Inicial</Label><Input id="stock" type="number" value={newItem.stock} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="minStock">Alerta de Stock</Label><Input id="minStock" type="number" value={newItem.minStock} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="price">Precio Unitario ($)</Label><Input id="price" type="number" value={newItem.price} onChange={handleChange} /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Artículo'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

const AdjustStockModal = ({
    isOpen,
    onClose,
    item,
    onStockUpdated
}: {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    onStockUpdated: () => void;
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [amount, setAmount] = React.useState(1);
    const [notes, setNotes] = React.useState('');

    if (!item) return null;
    
    const handleUpdateStock = async (change: number) => {
        setIsLoading(true);
        const result = await adjustStock({ itemId: item.id, change, notes });
        setIsLoading(false);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error al ajustar stock', description: result.error });
        } else {
            toast({ title: 'Stock Actualizado', description: `Se ${change > 0 ? 'añadieron' : 'restaron'} ${Math.abs(change)} unidad(es).`});
            onStockUpdated();
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>Ajusta el stock del artículo. Cada movimiento quedará registrado.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Stock Actual</p>
                            <p className="text-2xl font-bold">{item.stock} unidades</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button size="icon" variant="outline" onClick={() => handleUpdateStock(-amount)} disabled={item.stock < amount || isLoading}><Minus className="h-4 w-4" /></Button>
                             <Input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center" />
                             <Button size="icon" variant="outline" onClick={() => handleUpdateStock(amount)} disabled={isLoading}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="notes">Notas del Ajuste (Opcional)</Label>
                        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Conteo físico, producto dañado..." />
                    </div>
                     <Button variant="outline" className="w-full" disabled>
                        <Edit className="w-4 h-4 mr-2" /> Editar Información (Próximamente)
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function InventoryPage() {
    const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
    const [categories, setCategories] = React.useState<InventoryCategory[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');

    const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);
    const [isNewItemModalOpen, setIsNewItemModalOpen] = React.useState(false);
    const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = React.useState(false);

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        const [itemsData, categoriesData] = await Promise.all([
            getInventoryItems(),
            getInventoryCategories()
        ]);
        setInventory(itemsData as InventoryItem[]);
        setCategories(categoriesData as InventoryCategory[]);
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const lowStockItems = inventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock');

    const handleRowClick = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsAdjustStockModalOpen(true);
    };
    
    const handleCategoryCreated = (newCategory: InventoryCategory) => {
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
    };

    const filteredInventory = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <DashboardLayout>
        <NewItemForm
            isOpen={isNewItemModalOpen} 
            onClose={() => setIsNewItemModalOpen(false)} 
            categories={categories}
            onItemAdded={fetchData}
            onCategoryCreated={handleCategoryCreated}
        />
        <AdjustStockModal
            isOpen={isAdjustStockModalOpen}
            onClose={() => setIsAdjustStockModalOpen(false)}
            item={selectedItem}
            onStockUpdated={() => {
                fetchData();
                // We need to update the selected item as well to reflect changes in the modal
                if (selectedItem) {
                    const updatedItem = inventory.find(i => i.id === selectedItem.id);
                     if (updatedItem) setSelectedItem(updatedItem);
                }
            }}
        />

      <div className="space-y-4">
        {lowStockItems.length > 0 && !isLoading && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alerta de Inventario</AlertTitle>
                <AlertDescription>
                   Hay {lowStockItems.length} artículo(s) con stock bajo o agotado. Considera reordenar pronto.
                </AlertDescription>
            </Alert>
        )}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventario</CardTitle>
                  <CardDescription>
                    Gestiona los materiales y productos de tu clínica.
                  </CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                     <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder="Buscar artículos..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button size="sm" className="h-9 gap-2" onClick={() => setIsNewItemModalOpen(true)}>
                        <PlusCircle className="h-4 w-4" />
                        <span>Agregar Artículo</span>
                    </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Alerta de Stock</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                      Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                      ))
                  ) : filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => (
                        <TableRow key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.stock} unidades</TableCell>
                        <TableCell>{item.min_stock} unidades</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn(getStatusClass(item.status), 'capitalize')}>
                            {item.status}
                            </Badge>
                        </TableCell>
                        </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                           {searchTerm ? `No se encontraron artículos para "${searchTerm}"` : "No hay artículos en el inventario. ¡Agrega el primero!"}
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </DashboardLayout>
  );
}
