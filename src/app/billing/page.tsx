
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DollarSign, Receipt, PlusCircle, FileText, TrendingUp, HandCoins } from 'lucide-react';
import { getPaymentMethodIcon } from '@/components/icons/payment-method-icons';
import { Progress } from '@/components/ui/progress';
import { getTreatmentsForClinic, addPaymentToTreatment, getPaymentsForClinic, getPatientsForBilling, createGeneralPayment } from './actions';
import { getUserData } from '../user/actions';
import { useRouter } from 'next/navigation';
import { AddGeneralPaymentModal } from '@/components/add-general-payment-modal';

// Types
type Clinic = NonNullable<Awaited<ReturnType<typeof getUserData>>['clinic']>;
type BillingPatient = { id: string; first_name: string; last_name: string };

export type Payment = {
    id: string;
    patientId?: string;
    patientName: string;
    amount: number;
    date: string; 
    status: 'Paid' | 'Pending' | 'Canceled';
    method?: 'Card' | 'Cash' | 'Transfer';
    concept: string;
};
export type Quote = {
    id: string;
    patientId: string;
    patientName: string;
    total: number;
    status: 'Draft' | 'Presented' | 'Accepted' | 'Expired';
    createdAt: string; 
    expiresAt: string;
};
export type Treatment = {
    id: string;
    description: string;
    total_cost: number;
    payment_type: 'monthly' | 'one_time';
    status: 'active' | 'completed' | 'cancelled';
    patients: { id: string, first_name: string, last_name: string };
    total_paid: number;
};


const getStatusInSpanish = (status: any) => {
    const translations: Record<string, string> = {
        'Paid': 'Pagado', 'Pending': 'Pendiente', 'Canceled': 'Cancelado',
        'Draft': 'Borrador', 'Presented': 'Presentado', 'Accepted': 'Aceptado', 'Expired': 'Expirado',
        'active': 'Activo', 'completed': 'Completado', 'cancelled': 'Cancelado'
    };
    return translations[status] || status;
}

const getStatusClass = (status: any) => {
  switch (status) {
    case 'Paid': case 'Accepted': case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Pending': case 'Presented': case 'active':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Canceled': case 'Expired': case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Draft':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AddTreatmentPaymentModal = ({ 
    treatment, 
    isOpen, 
    onClose, 
    onPaymentAdded 
}: { 
    treatment: Treatment | null; 
    isOpen: boolean;
    onClose: () => void;
    onPaymentAdded: () => void;
}) => {
    const { toast } = useToast();
    const [amount, setAmount] = React.useState('');
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = React.useState<'Card'|'Cash'|'Transfer'>();
    const [notes, setNotes] = React.useState('');
    
    if (!treatment) return null;

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0 || !paymentMethod) {
            toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Por favor, introduce un monto y método de pago válidos.' });
            return;
        }

        const result = await addPaymentToTreatment({
            treatmentId: treatment.id,
            amount: parseFloat(amount),
            paymentDate,
            paymentMethod,
            notes
        });

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Pago Registrado', description: 'El pago ha sido añadido al tratamiento.' });
            onPaymentAdded();
            onClose();
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
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={String(treatment.total_cost - treatment.total_paid)} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="paymentDate">Fecha de Pago</Label>
                            <Input id="paymentDate" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
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


export default function BillingPage() {
    const router = useRouter();
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const [quotes] = React.useState<Quote[]>([]);
    const [treatments, setTreatments] = React.useState<Treatment[]>([]);
    const [clinic, setClinic] = React.useState<Clinic | null>(null);
    const [billingPatients, setBillingPatients] = React.useState<BillingPatient[]>([]);

    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedTreatment, setSelectedTreatment] = React.useState<Treatment | null>(null);
    const [isTreatmentPaymentModalOpen, setIsTreatmentPaymentModalOpen] = React.useState(false);
    const [isGeneralPaymentModalOpen, setIsGeneralPaymentModalOpen] = React.useState(false);

    
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        const [treatmentsData, paymentsData, patientsData, userData] = await Promise.all([
            getTreatmentsForClinic(),
            getPaymentsForClinic(),
            getPatientsForBilling(),
            getUserData()
        ]);
        
        setTreatments(treatmentsData as Treatment[]);
        if (paymentsData.data) {
            setPayments(paymentsData.data as Payment[]);
        }
        setBillingPatients(patientsData as BillingPatient[]);
        if (userData?.clinic) {
            setClinic(userData.clinic);
        }

        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRegisterPaymentClick = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setIsTreatmentPaymentModalOpen(true);
    };

    const totalIncomeThisMonth = payments
        .filter(p => {
            const paymentDate = new Date(p.date);
            const today = new Date();
            // Compare year and month to be precise
            return paymentDate.getFullYear() === today.getFullYear() && paymentDate.getMonth() === today.getMonth();
        })
        .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
        <AddTreatmentPaymentModal 
            treatment={selectedTreatment}
            isOpen={isTreatmentPaymentModalOpen}
            onClose={() => setIsTreatmentPaymentModalOpen(false)}
            onPaymentAdded={fetchData}
        />
        <AddGeneralPaymentModal
            isOpen={isGeneralPaymentModalOpen}
            onClose={() => setIsGeneralPaymentModalOpen(false)}
            onPaymentAdded={fetchData}
            patients={billingPatients}
            clinic={clinic}
        />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncomeThisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ingresos de pagos completados este mes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tratamientos Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treatments.filter(t => t.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Planes de tratamiento en curso.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuestos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Presupuestos en estado Borrador o Presentado.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="treatments">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="treatments">Planes de Tratamiento</TabsTrigger>
            <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
            <TabsTrigger value="quotes">Presupuestos</TabsTrigger>
        </TabsList>
        <TabsContent value="treatments">
            <Card>
                 <CardHeader>
                    <CardTitle>Planes de Tratamiento</CardTitle>
                    <CardDescription>Seguimiento de los planes de tratamiento activos y completados.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Paciente</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Progreso de Pago</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Cargando tratamientos...</TableCell></TableRow>
                            ) : treatments.length > 0 ? (
                                treatments.map((treatment) => {
                                    const progress = treatment.total_cost > 0 ? (treatment.total_paid / treatment.total_cost) * 100 : 0;
                                    return (
                                    <TableRow key={treatment.id}>
                                        <TableCell className="font-medium hover:underline cursor-pointer" onClick={() => router.push(`/patients/${treatment.patients.id}`)}>
                                            {treatment.patients.first_name} {treatment.patients.last_name}
                                        </TableCell>
                                        <TableCell>{treatment.description}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm">${treatment.total_paid.toFixed(2)} / ${treatment.total_cost.toFixed(2)}</span>
                                                <Progress value={progress} className="h-2" />
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className={cn('capitalize', getStatusClass(treatment.status))}>{getStatusInSpanish(treatment.status)}</Badge></TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => handleRegisterPaymentClick(treatment)}>
                                                <HandCoins className="h-4 w-4 mr-2" /> Registrar Pago
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    )
                                })
                            ) : (
                                 <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay planes de tratamiento activos.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="payments">
            <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                    <CardTitle>Historial de Pagos</CardTitle>
                    <CardDescription>Un registro de todas las transacciones financieras.</CardDescription>
                    </div>
                    <Button size="sm" className="h-9 gap-2" onClick={() => setIsGeneralPaymentModalOpen(true)}>
                        <PlusCircle className="h-4 w-4" /> Registrar Pago General
                    </Button>
                </div>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando pagos...</TableCell></TableRow>
                    ) : payments.length > 0 ? (
                        payments.map((payment) => (
                        <TableRow key={payment.id}>
                            <TableCell className="font-medium hover:underline cursor-pointer" onClick={() => router.push(`/patients/${payment.patientId}`)}>{payment.patientName}</TableCell>
                            <TableCell>{payment.concept}</TableCell>
                            <TableCell>${payment.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                {payment.method && (
                                    <div className="flex items-center gap-2">{getPaymentMethodIcon(payment.method)}<span>{payment.method}</span></div>
                                )}
                            </TableCell>
                            <TableCell>{new Date(payment.date).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</TableCell>
                            <TableCell><Badge variant="outline" className={cn('capitalize', getStatusClass(payment.status))}>{getStatusInSpanish(payment.status)}</Badge></TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay pagos registrados.</TableCell></TableRow>
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="quotes">
             <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                    <CardTitle>Presupuestos</CardTitle>
                    <CardDescription>Planes de tratamiento y sus costos estimados.</CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="hidden md:table-cell">Creado</TableHead>
                        <TableHead className="hidden md:table-cell">Vence</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No se encontraron presupuestos.
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    