
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
import { DollarSign, Receipt, Hourglass, PlusCircle, MoreHorizontal, FileText, Trash2 } from 'lucide-react';
import { getPaymentMethodIcon } from '@/components/icons/payment-method-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Types will be adapted for Supabase
export type Payment = {
    id: string;
    invoiceNumber: string;
    patientId: string;
    patientName: string;
    amount: number;
    date: string; // YYYY-MM-DD
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
    createdAt: string; // YYYY-MM-DD
    expiresAt: string; // YYYY-MM-DD
};

const getStatusInSpanish = (status: Payment['status'] | Quote['status']) => {
    const translations = {
        'Paid': 'Pagado',
        'Pending': 'Pendiente',
        'Canceled': 'Cancelado',
        'Draft': 'Borrador',
        'Presented': 'Presentado',
        'Accepted': 'Aceptado',
        'Expired': 'Expirado',
    };
    return translations[status] || status;
}

const getStatusClass = (status: Payment['status'] | Quote['status']) => {
  switch (status) {
    case 'Paid':
    case 'Accepted':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Pending':
    case 'Presented':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Canceled':
    case 'Expired':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Draft':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const NewPaymentForm = ({
  isOpen,
  onClose,
  onAddPayment,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddPayment: (payment: Omit<Payment, 'id' | 'invoiceNumber'>) => void;
}) => {
  const { toast } = useToast();
  const [patientId, setPatientId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState<Payment['method'] | ''>('');
  const [concept, setConcept] = React.useState('');

  const handleSubmit = () => {
    if (!patientId || !amount || !method || !concept) {
      toast({
        variant: 'destructive',
        title: 'Campos Incompletos',
        description: 'Por favor, complete todos los campos para registrar el pago.',
      });
      return;
    }

    // This part will need to fetch patients from Supabase
    const patientName = "Paciente de Ejemplo"; // Placeholder

    onAddPayment({
      patientId,
      patientName: patientName,
      amount: parseFloat(amount),
      concept,
      method: method as Payment['method'],
      date: new Date().toISOString().split('T')[0],
      status: 'Paid',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Pago</DialogTitle>
          <DialogDescription>
            Complete los detalles de la transacción.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="patient">Paciente</Label>
            <Select onValueChange={setPatientId}>
                <SelectTrigger id="patient">
                    <SelectValue placeholder="Seleccionar un paciente" />
                </SelectTrigger>
                <SelectContent>
                    {/* Patients will be fetched from Supabase */}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto ($)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="method">Método de Pago</Label>
               <Select onValueChange={(value) => setMethod(value as Payment['method'])}>
                <SelectTrigger id="method">
                    <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Card">Tarjeta</SelectItem>
                    <SelectItem value="Cash">Efectivo</SelectItem>
                    <SelectItem value="Transfer">Transferencia</SelectItem>
                </SelectContent>
            </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ej. Consulta de seguimiento"/>
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

const NewQuoteForm = ({
    isOpen,
    onClose,
    onAddQuote,
}: {
    isOpen: boolean;
    onClose: () => void;
    onAddQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'expiresAt' | 'total'>) => void;
}) => {
    const { toast } = useToast();
    const [patientId, setPatientId] = React.useState('');
    const [items, setItems] = React.useState<QuoteItem[]>([{ description: '', cost: 0 }]);
    
    const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { description: '', cost: 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const handleSubmit = () => {
        if (!patientId || items.some(item => !item.description || item.cost <= 0)) {
            toast({ variant: "destructive", title: "Campos Incompletos", description: "Seleccione un paciente y complete todos los campos de los servicios." });
            return;
        }

        const patientName = "Paciente de Ejemplo"; // Placeholder

        onAddQuote({
            patientId,
            patientName: patientName,
            items,
            status: 'Draft',
        });
        onClose();
    };

    const total = items.reduce((sum, item) => sum + Number(item.cost || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Presupuesto</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="patient-quote">Paciente</Label>
                        <Select onValueChange={setPatientId}>
                            <SelectTrigger id="patient-quote"><SelectValue placeholder="Seleccionar un paciente" /></SelectTrigger>
                            <SelectContent>{/* Patients will be fetched from Supabase */}</SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <Label>Servicios/Tratamientos</Label>
                        {items.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input placeholder="Descripción del servicio" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                                <Input type="number" placeholder="Costo" className="w-32" value={item.cost} onChange={(e) => handleItemChange(index, 'cost', Number(e.target.value))} />
                                <Button variant="outline" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                            </div>
                        ))}
                         <Button variant="outline" size="sm" onClick={addItem}><PlusCircle className="h-4 w-4 mr-2"/>Añadir Fila</Button>
                    </div>

                    <div className="flex justify-end items-center gap-4 pt-4 border-t">
                        <span className="font-semibold text-lg">Total:</span>
                        <span className="font-bold text-xl">${total.toFixed(2)}</span>
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar Presupuesto</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function BillingPage() {
    const { toast } = useToast();
    const [payments, setPayments] = React.useState<Payment[]>([]); // Data will be fetched from Supabase
    const [quotes, setQuotes] = React.useState<Quote[]>([]); // Data will be fetched from Supabase
    const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = React.useState(false);
    const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = React.useState(false);

    // TODO: Fetch data from Supabase

    // Stats calculation
    const today = new Date();
    const monthlyRevenue = payments
        .filter(p => p.status === 'Paid' && new Date(p.date).getMonth() === today.getMonth())
        .reduce((sum, p) => sum + p.amount, 0);
    const pendingInvoices = payments.filter(p => p.status === 'Pending').length;
    const activeQuotes = quotes.filter(q => q.status === 'Presented' || q.status === 'Draft').length;

    const handleAddPayment = (newPaymentData: Omit<Payment, 'id' | 'invoiceNumber'>) => {
        // TODO: Implement Supabase insert
        const newPayment: Payment = {
            id: `PAY${String(payments.length + 1).padStart(3, '0')}`,
            invoiceNumber: `INV-${new Date().getTime()}`,
            ...newPaymentData,
        };
        setPayments(prev => [newPayment, ...prev]);
        toast({ title: "Pago Registrado", description: `El pago de ${newPayment.patientName} ha sido guardado.` });
    };

    const handleAddQuote = (newQuoteData: Omit<Quote, 'id' | 'createdAt' | 'expiresAt' | 'total'>) => {
        const now = new Date();
        const expires = new Date();
        expires.setMonth(expires.getMonth() + 1);
        
        // TODO: Implement Supabase insert
        const newQuote: Quote = {
            id: `QUO${String(quotes.length + 1).padStart(3, '0')}`,
            ...newQuoteData,
            total: newQuoteData.items.reduce((sum, item) => sum + item.cost, 0),
            createdAt: now.toISOString().split('T')[0],
            expiresAt: expires.toISOString().split('T')[0],
        };
        setQuotes(prev => [newQuote, ...prev]);
        toast({ title: "Presupuesto Creado", description: `El presupuesto para ${newQuote.patientName} ha sido guardado.`});
    };

  return (
    <div className="space-y-6">
        {isNewPaymentModalOpen && <NewPaymentForm isOpen={isNewPaymentModalOpen} onClose={() => setIsNewPaymentModalOpen(false)} onAddPayment={handleAddPayment} />}
        {isNewQuoteModalOpen && <NewQuoteForm isOpen={isNewQuoteModalOpen} onClose={() => setIsNewQuoteModalOpen(false)} onAddQuote={handleAddQuote} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ingresos de pagos completados este mes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Facturas esperando pago.</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuestos Activos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeQuotes}</div>
            <p className="text-xs text-muted-foreground">Presupuestos en estado Borrador o Presentado.</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
            <TabsTrigger value="quotes">Presupuestos</TabsTrigger>
        </TabsList>
        <TabsContent value="payments">
            <Card>
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                    <CardTitle>Pagos</CardTitle>
                    <CardDescription>Un registro de todas las transacciones financieras.</CardDescription>
                    </div>
                    <Button size="sm" className="h-9 gap-2" onClick={() => setIsNewPaymentModalOpen(true)}>
                    <PlusCircle className="h-4 w-4" /><span>Registrar Pago</span>
                    </Button>
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
                    <Button size="sm" className="h-9 gap-2" onClick={() => setIsNewQuoteModalOpen(true)}>
                    <PlusCircle className="h-4 w-4" /><span>Crear Presupuesto</span>
                    </Button>
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

    