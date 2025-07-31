
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
import { DollarSign, Receipt, Hourglass, PlusCircle, MoreHorizontal, FileText, Trash2, TrendingUp, HandCoins } from 'lucide-react';
import { getPaymentMethodIcon } from '@/components/icons/payment-method-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { getTreatmentsForClinic, addPaymentToTreatment } from './actions';

// Types
export type Payment = {
    id: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    amount: number;
    date: string; 
    status: 'Paid' | 'Pending' | 'Canceled';
    method: 'Card' | 'Cash' | 'Transfer';
    concept: string;
};
export type QuoteItem = { description: string; cost: number; };
export type Quote = {
    id: string;
    patientId: string;
    patientName: string;
    items: QuoteItem[];
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
    patients: { first_name: string, last_name: string };
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
    const [notes, setNotes] = React.useState('');
    
    if (!treatment) return null;

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast({ variant: 'destructive', title: 'Monto Inválido', description: 'Por favor, introduce un monto de pago válido.' });
            return;
        }

        const result = await addPaymentToTreatment({
            treatmentId: treatment.id,
            amount: parseFloat(amount),
            paymentDate,
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
                    <div className="grid gap-2">
                        <Label htmlFor="paymentDate">Fecha de Pago</Label>
                        <Input id="paymentDate" type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
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
    const { toast } = useToast();
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const [quotes, setQuotes] = React.useState<Quote[]>([]);
    const [treatments, setTreatments] = React.useState<Treatment[]>([]);
    const [isLoadingTreatments, setIsLoadingTreatments] = React.useState(true);
    const [selectedTreatment, setSelectedTreatment] = React.useState<Treatment | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    
    const fetchTreatments = React.useCallback(async () => {
        setIsLoadingTreatments(true);
        const data = await getTreatmentsForClinic();
        setTreatments(data as Treatment[]);
        setIsLoadingTreatments(false);
    }, []);

    React.useEffect(() => {
        fetchTreatments();
    }, [fetchTreatments]);

    const handleRegisterPaymentClick = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setIsPaymentModalOpen(true);
    };

  return (
    <div className="space-y-6">
        <AddTreatmentPaymentModal 
            treatment={selectedTreatment}
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            onPaymentAdded={fetchTreatments}
        />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
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
                            {isLoadingTreatments ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Cargando tratamientos...</TableCell></TableRow>
                            ) : treatments.length > 0 ? (
                                treatments.map((treatment) => {
                                    const progress = treatment.total_cost > 0 ? (treatment.total_paid / treatment.total_cost) * 100 : 0;
                                    return (
                                    <TableRow key={treatment.id}>
                                        <TableCell className="font-medium">{treatment.patients.first_name} {treatment.patients.last_name}</TableCell>
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
                    <CardTitle>Pagos</CardTitle>
                    <CardDescription>Un registro de todas las transacciones financieras.</CardDescription>
                    </div>
                </div>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead className="hidden sm:table-cell">Nº Factura</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead className="hidden md:table-cell">Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {payments.map((payment) => (
                        <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.patientName}</TableCell>
                        <TableCell className="hidden sm:table-cell">{payment.invoiceNumber}</TableCell>
                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">{getPaymentMethodIcon(payment.method)}<span>{payment.method}</span></div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={cn('capitalize', getStatusClass(payment.status))}>{getStatusInSpanish(payment.status)}</Badge></TableCell>
                        <TableCell>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                                <DropdownMenuItem>Marcar como Pagado</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
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
                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {quotes.map((quote) => (
                        <TableRow key={quote.id}>
                        <TableCell className="font-medium">{quote.patientName}</TableCell>
                        <TableCell>${quote.total.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">{quote.createdAt}</TableCell>
                        <TableCell className="hidden md:table-cell">{quote.expiresAt}</TableCell>
                        <TableCell><Badge variant="outline" className={cn('capitalize', getStatusClass(quote.status))}>{getStatusInSpanish(quote.status)}</Badge></TableCell>
                        <TableCell>
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuItem>Ver/Editar</DropdownMenuItem>
                                <DropdownMenuItem>Marcar como Presentado</DropdownMenuItem>
                                <DropdownMenuItem>Marcar como Aceptado</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
