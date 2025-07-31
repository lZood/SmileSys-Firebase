
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
import { useToast } from '@/hooks/use-toast';
import { createGeneralPayment } from '@/app/billing/actions';
import { getUserData } from '@/app/user/actions';

type Clinic = NonNullable<Awaited<ReturnType<typeof getUserData>>['clinic']>;
type BillingPatient = { id: string; first_name: string; last_name: string; };

export const AddGeneralPaymentModal = ({
    isOpen,
    onClose,
    onPaymentAdded,
    patients,
    clinic,
    preselectedPatientId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onPaymentAdded: () => void;
    patients: BillingPatient[];
    clinic: Clinic | null;
    preselectedPatientId?: string;
}) => {
    const { toast } = useToast();
    const [patientId, setPatientId] = React.useState<string | undefined>(preselectedPatientId);
    const [amount, setAmount] = React.useState('');
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = React.useState<'Card' | 'Cash' | 'Transfer'>();
    const [description, setDescription] = React.useState('');

    React.useEffect(() => {
        if (preselectedPatientId) {
            setPatientId(preselectedPatientId);
        }
    }, [preselectedPatientId]);
    
    if (!clinic) return null;

    const handleSubmit = async () => {
        if (!patientId || !amount || !paymentMethod || !description) {
            toast({ variant: 'destructive', title: 'Campos Incompletos', description: 'Por favor, complete todos los campos.' });
            return;
        }

        const result = await createGeneralPayment({
            patientId,
            clinicId: clinic.id,
            amount: parseFloat(amount),
            paymentDate,
            paymentMethod,
            description,
        });
        
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Pago Registrado', description: 'El pago general se ha guardado.' });
            onPaymentAdded();
            onClose();
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago General</DialogTitle>
                    <DialogDescription>Registra un pago que no esté asociado a un plan de tratamiento.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="patientId">Paciente</Label>
                        <Select onValueChange={setPatientId} value={patientId} disabled={!!preselectedPatientId}>
                            <SelectTrigger><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
                            <SelectContent>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Concepto</Label>
                        <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej. Limpieza dental" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Monto ($)</Label>
                            <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="paymentMethod">Método de Pago</Label>
                            <Select onValueChange={(value: 'Card'|'Cash'|'Transfer') => setPaymentMethod(value)}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Efectivo</SelectItem>
                                    <SelectItem value="Card">Tarjeta</SelectItem>
                                    <SelectItem value="Transfer">Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="paymentDate">Fecha de Pago</Label>
                        <Input id="paymentDate" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </div>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar Pago</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
