import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export type Treatment = {
    id: string;
    description: string;
    total_cost: number;
    payment_type: 'monthly' | 'one_time';
    status: 'active' | 'completed' | 'cancelled';
    patients: { id: string, first_name: string, last_name: string };
    total_paid: number;
};

export type AddPaymentProps = {
    treatment: Treatment | null;
    isOpen: boolean;
    onClose: () => void;
    onPaymentAdded: () => void;
    addPaymentToTreatment: (data: any) => Promise<any>;
};

export const AddTreatmentPaymentModal: React.FC<AddPaymentProps> = ({ treatment, isOpen, onClose, onPaymentAdded, addPaymentToTreatment }) => {
    const { toast } = useToast();
    const [amount, setAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState<'Card'|'Cash'|'Transfer'>();
    const [notes, setNotes] = React.useState('');
    const [paymentDate, setPaymentDate] = React.useState<Date | undefined>(new Date());

    React.useEffect(() => {
        if (isOpen) {
            setAmount('');
            setPaymentMethod(undefined);
            setNotes('');
            setPaymentDate(new Date());
        }
    }, [isOpen]);

    if (!treatment) return null;
    const remainingAmount = treatment.total_cost - treatment.total_paid;

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0 || !paymentMethod || !paymentDate) {
            toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Por favor, introduce un monto y método de pago válidos.' });
            return;
        }
        const paymentAmount = parseFloat(amount);
        if (paymentAmount > remainingAmount) {
            toast({ variant: 'destructive', title: 'Monto Inválido', description: `El monto máximo a pagar es $${remainingAmount.toFixed(2)}` });
            return;
        }
        try {
            const result = await addPaymentToTreatment({
                treatmentId: treatment.id,
                amount: parseFloat(amount),
                paymentDate: format(paymentDate, 'yyyy-MM-dd'),
                paymentMethod,
                notes
            });

            if (result.error) {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
                return;
            }

            const newTotal = treatment.total_paid + parseFloat(amount);
            const message = newTotal >= treatment.total_cost 
                ? '¡Tratamiento completado! El pago ha sido registrado y el tratamiento ha sido marcado como finalizado.'
                : 'El pago ha sido registrado exitosamente.';
            
            toast({ title: 'Pago Registrado', description: message, duration: 5000 });
            onPaymentAdded();
            onClose();
        } catch (error: any) {
            toast({ 
                variant: 'destructive', 
                title: 'Error al Registrar el Pago', 
                description: error.message || 'Ocurrió un error al procesar el pago' 
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago para Tratamiento</DialogTitle>
                    <DialogDescription>
                        Paciente: {treatment.patients.first_name} {treatment.patients.last_name}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Monto a Pagar ($)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => { const val = parseFloat(e.target.value); if (!isNaN(val) && val <= remainingAmount) { setAmount(e.target.value); } }} placeholder={`Monto máximo: $${remainingAmount.toFixed(2)}`} max={remainingAmount} />
                        <p className="text-xs text-muted-foreground">Monto restante: ${remainingAmount.toFixed(2)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="paymentDate">Fecha de Pago</Label>
                            <DatePicker date={paymentDate} setDate={setPaymentDate} />
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
                        <Label htmlFor="notes">Notas (Opcional)</Label>
                        <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Pago de la 3ra mensualidad" />
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
