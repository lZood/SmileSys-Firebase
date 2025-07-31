
'use client';

import * as React from 'react';
import { PlusCircle, Edit, Minus, Plus, AlertTriangle, X } from "lucide-react";
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

// Type will be adapted for Supabase
export type InventoryItem = {
    id: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    price: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    provider: string;
    lastOrdered: string; // YYYY-MM-DD
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'In Stock': return 'bg-green-100 text-green-800 border-green-200';
        case 'Low Stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Out of Stock': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const NewItemForm = ({ 
    isOpen, 
    onClose, 
    onAddItem 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onAddItem: (item: Omit<InventoryItem, 'id' | 'status'>) => void;
}) => {
    const { toast } = useToast();
    const [newItem, setNewItem] = React.useState({
        name: '',
        category: '',
        stock: 0,
        minStock: 5,
        price: 0,
        provider: '',
        lastOrdered: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setNewItem(prev => ({ ...prev, [id]: type === 'number' ? Number(value) : value }));
    };

    const handleSubmit = () => {
        if (!newItem.name || !newItem.category || !newItem.provider || newItem.stock < 0 || newItem.minStock < 0 || newItem.price < 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, completa todos los campos requeridos.' });
            return;
        }
        onAddItem(newItem);
        onClose();
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Artículo</DialogTitle>
                    <DialogDescription>Completa los detalles del nuevo producto de inventario.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="name">Nombre</Label><Input id="name" value={newItem.name} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="category">Categoría</Label><Input id="category" value={newItem.category} onChange={handleChange} /></div>
                    </div>
                    <div className="grid gap-2"><Label htmlFor="provider">Proveedor</Label><Input id="provider" value={newItem.provider} onChange={handleChange} /></div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2"><Label htmlFor="stock">Cantidad Inicial</Label><Input id="stock" type="number" value={newItem.stock} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="minStock">Cantidad Mínima</Label><Input id="minStock" type="number" value={newItem.minStock} onChange={handleChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="price">Precio Unitario ($)</Label><Input id="price" type="number" value={newItem.price} onChange={handleChange} /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar Artículo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const InventoryActionsModal = ({
    isOpen,
    onClose,
    item,
    onUpdateStock,
    onEdit
}: {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    onUpdateStock: (itemId: string, amount: number) => void;
    onEdit: (item: InventoryItem) => void;
}) => {
    const [amount, setAmount] = React.useState(1);
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>Gestionar el stock o editar la información del artículo.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="text-sm text-muted-foreground">Stock Actual</p>
                            <p className="text-2xl font-bold">{item.stock} unidades</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button size="icon" variant="outline" onClick={() => onUpdateStock(item.id, -amount)} disabled={item.stock < amount}><Minus className="h-4 w-4" /></Button>
                             <Input type="number" value={amount} onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center" />
                             <Button size="icon" variant="outline" onClick={() => onUpdateStock(item.id, amount)}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                     <Button variant="outline" className="w-full" onClick={() => { onEdit(item); onClose(); }}>
                        <Edit className="w-4 h-4 mr-2" /> Editar Información
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
    const { toast } = useToast();
    const [inventory, setInventory] = React.useState<InventoryItem[]>([]); // Data will be fetched from Supabase
    const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);
    const [isNewItemModalOpen, setIsNewItemModalOpen] = React.useState(false);
    const [isActionsModalOpen, setIsActionsModalOpen] = React.useState(false);

    // TODO: Fetch inventory from Supabase

    const lowStockItems = inventory.filter(item => item.status === 'Low Stock' || item.status === 'Out of Stock');

    const handleAddItem = (newItemData: Omit<InventoryItem, 'id' | 'status'>) => {
        let status: 'In Stock' | 'Low Stock' | 'Out of Stock';
        if (newItemData.stock <= 0) {
            status = 'Out of Stock';
        } else if (newItemData.stock <= newItemData.minStock) {
            status = 'Low Stock';
        } else {
            status = 'In Stock';
        }

        // TODO: Implement Supabase insert
        const newItem: InventoryItem = {
            id: `INV${String(inventory.length + 1).padStart(3, '0')}`,
            ...newItemData,
            status: status
        };

        setInventory(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Artículo Agregado", description: `${newItem.name} ha sido añadido al inventario.` });
    };

    const handleUpdateStock = (itemId: string, amount: number) => {
        // TODO: Implement Supabase update
        setInventory(prev => prev.map(item => {
            if (item.id === itemId) {
                const newStock = Math.max(0, item.stock + amount);
                let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
                if (newStock <= 0) {
                    newStatus = 'Out of Stock';
                } else if (newStock <= item.minStock) {
                    newStatus = 'Low Stock';
                } else {
                    newStatus = 'In Stock';
                }
                
                const updatedItem = { ...item, stock: newStock, status: newStatus };

                // Also update the selected item if it's the one being changed
                if (selectedItem?.id === itemId) {
                    setSelectedItem(updatedItem);
                }

                return updatedItem;
            }
            return item;
        }));
        toast({ title: 'Stock Actualizado', description: `El stock de ${amount > 0 ? 'añadió' : 'restó'} ${Math.abs(amount)} unidad(es).`});
    };
    
    const handleRowClick = (item: InventoryItem) => {
        setSelectedItem(item);
        setIsActionsModalOpen(true);
    };

  return (
    <DashboardLayout>
        {isNewItemModalOpen && (
            <NewItemForm 
                isOpen={isNewItemModalOpen} 
                onClose={() => setIsNewItemModalOpen(false)} 
                onAddItem={handleAddItem} 
            />
        )}
        {isActionsModalOpen && (
            <InventoryActionsModal
                isOpen={isActionsModalOpen}
                onClose={() => setIsActionsModalOpen(false)}
                item={selectedItem}
                onUpdateStock={handleUpdateStock}
                onEdit={(item) => console.log('Editing', item)} // Replace with actual edit modal logic
            />
        )}
      <div className="space-y-4">
        {lowStockItems.length > 0 && (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alerta de Inventario</AlertTitle>
                <AlertDescription>
                   Hay {lowStockItems.length} artículo(s) con stock bajo o agotado. Es necesario reordenar pronto.
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
                <Button size="sm" className="h-9 gap-2" onClick={() => setIsNewItemModalOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                  <span>Agregar Artículo</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden sm:table-cell">Precio Unit.</TableHead>
                    <TableHead className="hidden md:table-cell">Último Pedido</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id} onClick={() => handleRowClick(item)} className="cursor-pointer">
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{item.category}</TableCell>
                      <TableCell>{item.stock} unidades</TableCell>
                       <TableCell className="hidden sm:table-cell">${item.price.toFixed(2)}</TableCell>
                       <TableCell className="hidden md:table-cell">{new Date(item.lastOrdered).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getStatusClass(item.status), 'capitalize')}>
                          {item.status.replace(/-/g, ' ').toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>
    </DashboardLayout>
  );
}

    

    