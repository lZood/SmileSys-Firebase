'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createQuote } from '@/app/billing/quote-actions';
import { DatePicker } from '@/components/ui/date-picker';
import { addDays, format } from 'date-fns';
import { Combobox } from '@/components/ui/combobox';

type Patient = {
    id: string;
    first_name: string;
    last_name: string;
};

type TreatmentItem = {
    description: string;
    cost: number;
};

type CreateQuoteModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onQuoteCreated: () => void;
    patients: Patient[];
    clinic: { id: string } | null;
    preselectedPatientId?: string;
};

export function CreateQuoteModal({ isOpen, onClose, onQuoteCreated, patients, clinic, preselectedPatientId }: CreateQuoteModalProps) {
    const { toast } = useToast();
    const [patientId, setPatientId] = React.useState<string>(preselectedPatientId || '');
    const [items, setItems] = React.useState<TreatmentItem[]>([{ description: '', cost: 0 }]);
    const [notes, setNotes] = React.useState('');
    const [expirationDate, setExpirationDate] = React.useState<Date | undefined>(addDays(new Date(), 30));
    const patientOptions = patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }));

    React.useEffect(() => {
        if (preselectedPatientId) setPatientId(preselectedPatientId);
    }, [preselectedPatientId]);

    const totalCost = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

    const handleAddItem = () => {
        setItems([...items, { description: '', cost: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof TreatmentItem, value: string) => {
        const newItems = [...items];
        if (field === 'cost') {
            newItems[index][field] = parseFloat(value) || 0;
        } else {
            newItems[index][field] = value;
        }
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!patientId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor selecciona un paciente.' });
            return;
        }

        if (!clinic?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se encontró la clínica.' });
            return;
        }

        if (items.some(item => !item.description || item.cost <= 0)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Todos los tratamientos deben tener descripción y costo.' });
            return;
        }

        const result = await createQuote({
            patientId,
            clinicId: clinic.id,
            items,
            total: totalCost,
            notes,
            expiresAt: format(expirationDate ?? new Date(), 'yyyy-MM-dd')
        });

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Presupuesto Creado', description: 'El presupuesto ha sido creado exitosamente.' });
            onQuoteCreated();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
                    <DialogDescription>
                        Crea un presupuesto detallado para el paciente.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <div className="grid gap-2">
                          <Label>Paciente</Label>
                          {preselectedPatientId ? (
                            <Input disabled value={patientOptions.find(o=>o.value===preselectedPatientId)?.label || ''} />
                          ) : (
                            <Combobox
                              options={patientOptions}
                              value={patientId}
                              onChange={setPatientId}
                              placeholder="Seleccionar paciente..."
                              emptyMessage="No se encontraron pacientes."
                            />
                          )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Tratamientos</Label>
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Descripción del tratamiento"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                    />
                                </div>
                                <div className="w-32">
                                    <Input
                                        type="number"
                                        placeholder="Costo"
                                        value={item.cost}
                                        onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                                    />
                                </div>
                                {items.length > 1 && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleRemoveItem(index)}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={handleAddItem}>
                            Agregar Tratamiento
                        </Button>
                    </div>

                    <div className="grid gap-2">
                        <Label>Notas Adicionales</Label>
                        <Textarea
                            placeholder="Agregar notas o comentarios adicionales..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Fecha de Expiración</Label>
                        <DatePicker date={expirationDate} setDate={setExpirationDate} />
                    </div>

                    <div className="flex justify-between items-center py-2">
                        <span className="font-semibold">Total:</span>
                        <span className="text-lg">${totalCost.toFixed(2)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Crear Presupuesto</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
