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
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DollarSign, Receipt, PlusCircle, FileText, TrendingUp, HandCoins, SlidersHorizontal } from 'lucide-react';
import { getPaymentMethodIcon } from '@/components/icons/payment-method-icons';
import { Progress } from '@/components/ui/progress';
import { addPaymentToTreatment, getTreatmentsForClinic, getPaymentsForClinic, getPatientsForBilling, createGeneralPayment } from './actions';
import { getQuotesForClinic, getQuoteDetails, updateQuoteStatus } from './quote-actions';
import { getUserData } from '../user/actions';
import { useRouter } from 'next/navigation';
import { AddGeneralPaymentModal } from '@/components/add-general-payment-modal';
import { AddTreatmentPaymentModal } from '@/components/add-treatment-payment-modal';
import { CreateQuoteModal } from '@/components/create-quote-modal';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';
import { ConsentForm } from '@/components/consent-form';
import { useIsMobile } from '@/hooks/use-mobile';

// Types
type UserData = Awaited<ReturnType<typeof getUserData>>;
type Clinic = {
  id: string;
  name: string;
  // ...other clinic fields
  doctors?: { id: string; first_name: string; last_name: string; roles: string[] }[];
};
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


// Simulación de función para crear tratamiento desde presupuesto
async function createTreatmentFromQuote(quote: Quote, signature: string) {
    // Aquí deberías llamar a tu API o acción server para crear el tratamiento
    // y guardar la firma digital
    // Ejemplo:
    // await createTreatment({ ...datos del quote, signature })
    return { success: true };
}

// Removed old ConsentModal component


export default function BillingPage() {
  const isMobile = useIsMobile();
     // Estado para modal de consentimiento digital y quote seleccionado
    const [isConsentModalOpen, setIsConsentModalOpen] = React.useState(false);
    const [selectedQuote, setSelectedQuote] = React.useState<Quote | null>(null);

    const [quoteDetails, setQuoteDetails] = React.useState<any>(null);

    const handleConvertQuote = async (quote: Quote) => {
        const details = await getQuoteDetails(quote.id);
        if (details) {
            setQuoteDetails(details);
            setSelectedQuote(quote);
            setIsConsentModalOpen(true);
        }
    };

    const { toast } = useToast();

    const handleConsentCreated = async (wasSubmitted: boolean) => {
        try {
            if (wasSubmitted && selectedQuote) {
                console.log('Actualizando estado del presupuesto...', selectedQuote.id);
                const result = await updateQuoteStatus(selectedQuote.id, 'Accepted');
                if (result.error) {
                    console.error('Error al actualizar el estado:', result.error);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'No se pudo actualizar el estado del presupuesto'
                    });
                } else {
                    console.log('Estado actualizado correctamente');
                }
            }
        } catch (error) {
            console.error('Error en handleConsentCreated:', error);
        }
        
        setIsConsentModalOpen(false);
        setSelectedQuote(null);
        fetchData(); // Refresca los datos
    };
    const router = useRouter();
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const [quotes, setQuotes] = React.useState<Quote[]>([]);
    const [treatments, setTreatments] = React.useState<Treatment[]>([]);
    const [clinic, setClinic] = React.useState<Clinic | null>(null);
    const [billingPatients, setBillingPatients] = React.useState<BillingPatient[]>([]);

    // Filtros para tratamientos
    const [treatmentStatusFilter, setTreatmentStatusFilter] = React.useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
    const [treatmentSearchTerm, setTreatmentSearchTerm] = React.useState('');
    const [treatmentSort, setTreatmentSort] = React.useState<'remaining_desc' | 'remaining_asc' | 'total_desc' | 'total_asc' | 'patient_asc' | 'status_asc'>('remaining_desc');

    // Filtros para pagos
    const [paymentStatusFilter, setPaymentStatusFilter] = React.useState<'all' | 'Paid' | 'Pending' | 'Canceled'>('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = React.useState<'all' | 'Cash' | 'Card' | 'Transfer'>('all');
    const [paymentSearchTerm, setPaymentSearchTerm] = React.useState('');
    const [paymentSort, setPaymentSort] = React.useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'status_asc'>('date_desc');

    // Filtros para presupuestos
    const [quoteStatusFilter, setQuoteStatusFilter] = React.useState<'all' | 'Draft' | 'Presented' | 'Accepted' | 'Expired'>('all');
    // Orden de presupuestos
    const [quoteSort, setQuoteSort] = React.useState<'created_desc' | 'created_asc' | 'total_desc' | 'total_asc' | 'status_asc'>('created_desc');
    const [quoteSearchTerm, setQuoteSearchTerm] = React.useState('');

    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedTreatment, setSelectedTreatment] = React.useState<Treatment | null>(null);
    const [isTreatmentPaymentModalOpen, setIsTreatmentPaymentModalOpen] = React.useState(false);
    const [isGeneralPaymentModalOpen, setIsGeneralPaymentModal] = React.useState(false);
    const [isNewQuoteModalOpen, setIsNewQuoteModalOpen] = React.useState(false);

    const [showTreatmentFilters, setShowTreatmentFilters] = React.useState(false);
    const [showPaymentFilters, setShowPaymentFilters] = React.useState(false);
    const [showQuoteFilters, setShowQuoteFilters] = React.useState(false);

    const [isRestricted, setIsRestricted] = React.useState(false);

    
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        // Obtener primero userData para validar acceso
        const userData = await getUserData();
        const roles: string[] = userData?.profile?.roles || [];
        if (roles.includes('staff') && !roles.includes('admin')) {
            setIsRestricted(true);
            setIsLoading(false);
            return; // No continuar cargando datos
        }
        const [treatmentsData, paymentsData, patientsData, quotesData] = await Promise.all([
            getTreatmentsForClinic(),
            getPaymentsForClinic(),
            getPatientsForBilling(),
            getQuotesForClinic()
        ]);
        
        setTreatments(treatmentsData as Treatment[]);
        if (paymentsData.data) setPayments(paymentsData.data as Payment[]);
        setBillingPatients(patientsData as BillingPatient[]);
        if (userData?.clinic) setClinic(userData.clinic);
        setQuotes(quotesData || []);

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
            const paymentDate = new Date(p.date.replace(/-/g, '/'));
            const today = new Date();
            return paymentDate.getFullYear() === today.getFullYear() && paymentDate.getMonth() === today.getMonth();
        })
        .reduce((sum, p) => sum + p.amount, 0);

  // Pre-cálculos de listas filtradas y ordenadas
  const filteredSortedTreatments = React.useMemo(() => {
    return [...treatments]
      .filter(t => {
        if (treatmentStatusFilter !== 'all' && t.status !== treatmentStatusFilter) return false;
        if (treatmentSearchTerm) {
          const s = treatmentSearchTerm.toLowerCase();
            return (
              t.description.toLowerCase().includes(s) ||
              t.patients.first_name.toLowerCase().includes(s) ||
              t.patients.last_name.toLowerCase().includes(s)
            );
        }
        return true;
      })
      .sort((a,b) => {
        const remainingA = a.total_cost - a.total_paid;
        const remainingB = b.total_cost - b.total_paid;
        switch (treatmentSort) {
          case 'remaining_desc': return remainingB - remainingA;
          case 'remaining_asc': return remainingA - remainingB;
          case 'total_desc': return b.total_cost - a.total_cost;
          case 'total_asc': return a.total_cost - b.total_cost;
          case 'patient_asc': {
            const nameA = `${a.patients.first_name} ${a.patients.last_name}`.toLowerCase();
            const nameB = `${b.patients.first_name} ${b.patients.last_name}`.toLowerCase();
            return nameA.localeCompare(nameB);
          }
          case 'status_asc': return a.status.localeCompare(b.status);
          default: return 0;
        }
      });
  }, [treatments, treatmentStatusFilter, treatmentSearchTerm, treatmentSort]);

  const filteredSortedPayments = React.useMemo(() => {
    return [...payments]
      .filter(p => {
        if (paymentStatusFilter !== 'all' && p.status !== paymentStatusFilter) return false;
        if (paymentMethodFilter !== 'all' && p.method !== paymentMethodFilter) return false;
        if (paymentSearchTerm) {
          const s = paymentSearchTerm.toLowerCase();
          return p.concept.toLowerCase().includes(s) || p.patientName.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a,b) => {
        switch (paymentSort) {
          case 'date_desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'date_asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'amount_desc': return b.amount - a.amount;
            case 'amount_asc': return a.amount - b.amount;
          case 'status_asc': return a.status.localeCompare(b.status);
          default: return 0;
        }
      });
  }, [payments, paymentStatusFilter, paymentMethodFilter, paymentSearchTerm, paymentSort]);

  const filteredSortedQuotes = React.useMemo(() => {
    return [...quotes]
      .filter(q => {
        if (quoteStatusFilter !== 'all' && q.status !== quoteStatusFilter) return false;
        if (quoteSearchTerm) {
          const s = quoteSearchTerm.toLowerCase();
          return q.patientName.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a,b) => {
        switch (quoteSort) {
          case 'created_desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created_asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'total_desc': return b.total - a.total;
          case 'total_asc': return a.total - b.total;
          case 'status_asc': return a.status.localeCompare(b.status);
          default: return 0;
        }
      });
  }, [quotes, quoteStatusFilter, quoteSearchTerm, quoteSort]);

  if (isRestricted) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>No tienes permiso para usar esta área.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-6">
         {isConsentModalOpen && selectedQuote && quoteDetails && (
            <ConsentForm 
                patientId={selectedQuote.patientId}
                patientName={selectedQuote.patientName}
                clinic={clinic!}
                doctors={clinic?.doctors || []}
                onClose={handleConsentCreated}
                initialData={{
                    treatments: quoteDetails.items.map((item: { description: string; cost: number }) => ({
                        description: item.description,
                        cost: item.cost.toString()
                    })),
                    totalCost: selectedQuote.total.toString(),
                    paymentType: 'one_time'
                }}
            />
        )}
        <AddTreatmentPaymentModal 
            treatment={selectedTreatment}
            isOpen={isTreatmentPaymentModalOpen}
            onClose={() => setIsTreatmentPaymentModalOpen(false)}
            onPaymentAdded={fetchData}
            addPaymentToTreatment={addPaymentToTreatment}
        />
        <AddGeneralPaymentModal
            isOpen={isGeneralPaymentModalOpen}
            onClose={() => setIsGeneralPaymentModal(false)}
            onPaymentAdded={fetchData}
            patients={billingPatients}
            clinic={clinic}
        />
        <CreateQuoteModal
            isOpen={isNewQuoteModalOpen}
            onClose={() => setIsNewQuoteModalOpen(false)}
            onQuoteCreated={fetchData}
            patients={billingPatients}
            clinic={clinic}
        />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
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
       </div>

      <Tabs defaultValue="treatments">
        <TabsList className={isMobile ? 'flex gap-2 overflow-x-auto' : 'grid w-full grid-cols-3'}>
             <TabsTrigger value="treatments">{isMobile ? 'Tratamiento' : 'Planes de Tratamiento'}</TabsTrigger>
             <TabsTrigger value="payments">{isMobile ? 'Pagos' : 'Historial de Pagos'}</TabsTrigger>
             <TabsTrigger value="quotes">{isMobile ? 'Presupuestos' : 'Presupuestos'}</TabsTrigger>
         </TabsList>
         <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Planes de Tratamiento</CardTitle>
                  <CardDescription className="hidden md:block">Seguimiento de los planes de tratamiento activos y completados.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* espacio para botones a la derecha si necesario en el futuro */}
                </div>
              </div>

              {/* Fila separada: búsqueda + botón filtros */}
              <div className="mt-3 flex items-center gap-2">
                <Input
                  placeholder="Buscar por descripción..."
                  className="flex-1 md:w-[200px]"
                  value={treatmentSearchTerm}
                  onChange={(e) => setTreatmentSearchTerm(e.target.value)}
                />
                <Button size="sm" className="h-9" onClick={() => setShowTreatmentFilters(prev => {
                  const next = !prev;
                  if (!next) {
                    setTreatmentStatusFilter('all');
                    setTreatmentSort('remaining_desc');
                  }
                  return next;
                })} aria-label="Abrir filtros">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className={`mt-3 space-y-2 flex flex-col md:flex-row md:space-y-0 md:gap-2 ${showTreatmentFilters ? '' : 'hidden'}`}>
                <Select onValueChange={(value) => setTreatmentStatusFilter(value as 'all' | 'active' | 'completed' | 'cancelled')}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="cancelled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={treatmentSort} onValueChange={(v: any) => setTreatmentSort(v)}>
                  <SelectTrigger className="w-[220px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remaining_desc">Restante (mayor a menor)</SelectItem>
                    <SelectItem value="remaining_asc">Restante (menor a mayor)</SelectItem>
                    <SelectItem value="total_desc">Total (mayor a menor)</SelectItem>
                    <SelectItem value="total_asc">Total (menor a mayor)</SelectItem>
                    <SelectItem value="patient_asc">Paciente (A-Z)</SelectItem>
                    <SelectItem value="status_asc">Estado (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isMobile ? (
                <div className="space-y-3 p-2">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}><CardContent><Skeleton className="h-6 w-full" /></CardContent></Card>
                    ))
                  ) : filteredSortedTreatments.length > 0 ? (
                    filteredSortedTreatments.map(treatment => (
                      <Card key={treatment.id} className="p-2 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 pr-1">
                            <div className="font-medium text-sm truncate">{treatment.patients.first_name} {treatment.patients.last_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{treatment.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">${treatment.total_paid.toFixed(2)} / ${treatment.total_cost.toFixed(2)}</div>
                          </div>
                          <div className="flex flex-col items-end ml-2 space-y-1 w-20">
                            <div className="font-semibold text-sm">${Math.max(0, treatment.total_cost - treatment.total_paid).toFixed(2)}</div>
                            <Badge variant="outline" className={cn('capitalize text-xs', getStatusClass(treatment.status))}>{getStatusInSpanish(treatment.status)}</Badge>
                            <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleRegisterPaymentClick(treatment)}>
                              <HandCoins className="h-3 w-3 mr-1" /> Pago
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="p-4 text-center">No hay planes de tratamiento activos.</div>
                  )}
                </div>
              ) : (
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
                    ) : filteredSortedTreatments.length > 0 ? (
                      filteredSortedTreatments.map(treatment => {
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
                        );
                      })
                    ) : (
                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No hay planes de tratamiento activos.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
         </TabsContent>
        <TabsContent value="payments">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between">
                        <div>
                            <CardTitle>Historial de Pagos</CardTitle>
                            <CardDescription className="hidden md:block">Un registro de todas las transacciones financieras.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="h-9 gap-2" onClick={() => setIsGeneralPaymentModal(true)}>
                                <PlusCircle className="h-4 w-4" /> Registrar Pago General
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <Input
                            placeholder="Buscar por concepto..."
                            className="flex-1 md:w-[200px]"
                            value={paymentSearchTerm}
                            onChange={(e) => setPaymentSearchTerm(e.target.value)}
                        />
                        <Button size="sm" className="h-9" onClick={() => setShowPaymentFilters(prev => {
                          const next = !prev;
                          if (!next) {
                            setPaymentStatusFilter('all');
                            setPaymentMethodFilter('all');
                            setPaymentSort('date_desc');
                          }
                          return next;
                        })} aria-label="Abrir filtros">
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                       </div>

                       <div className={`mt-3 space-y-2 flex flex-col md:flex-row md:space-y-0 md:gap-2 ${showPaymentFilters ? '' : 'hidden'}`}>
                        <Select
                            value={paymentStatusFilter}
                            onValueChange={(value: any) => setPaymentStatusFilter(value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Estado del pago" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="Paid">Pagados</SelectItem>
                                <SelectItem value="Pending">Pendientes</SelectItem>
                                <SelectItem value="Canceled">Cancelados</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={paymentMethodFilter}
                            onValueChange={(value: any) => setPaymentMethodFilter(value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Método de pago" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los métodos</SelectItem>
                                <SelectItem value="Cash">Efectivo</SelectItem>
                                <SelectItem value="Card">Tarjeta</SelectItem>
                                <SelectItem value="Transfer">Transferencia</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={paymentSort}
                            onValueChange={(v: any) => setPaymentSort(v)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date_desc">Fecha (reciente)</SelectItem>
                                <SelectItem value="date_asc">Fecha (antigua)</SelectItem>
                                <SelectItem value="amount_desc">Monto (mayor a menor)</SelectItem>
                                <SelectItem value="amount_asc">Monto (menor a mayor)</SelectItem>
                                <SelectItem value="status_asc">Estado (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>
                       </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isMobile ? (
                    <div className="space-y-3 p-2">
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <Card key={i}><CardContent><Skeleton className="h-6 w-full" /></CardContent></Card>
                        ))
                      ) : filteredSortedPayments.length > 0 ? (
                        filteredSortedPayments.map(payment => (
                          <Card key={payment.id} className="p-3 cursor-pointer" onClick={() => router.push(`/patients/${payment.patientId}`)}>
                            <div className="flex justify-between">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{payment.patientName}</div>
                                <div className="text-sm text-muted-foreground truncate">{payment.concept}</div>
                              </div>
                              <div className="text-right ml-3">
                                <div className="font-bold">${payment.amount.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">{getStatusInSpanish(payment.status)}</div>
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="p-4 text-center">No hay pagos registrados.</div>
                      )}
                    </div>
                  ) : (
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
                      ) : filteredSortedPayments.length > 0 ? (
                          filteredSortedPayments.map(payment => (
                          <TableRow key={payment.id}>
                              <TableCell className="font-medium hover:underline cursor-pointer" onClick={() => router.push(`/patients/${payment.patientId}`)}>{payment.patientName}</TableCell>
                              <TableCell>{payment.concept}</TableCell>
                              <TableCell>${payment.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                  {payment.method && (
                                      <div className="flex items-center gap-2">{getPaymentMethodIcon(payment.method)}<span>{payment.method}</span></div>
                                  )}
                              </TableCell>
                              <TableCell>{new Date(payment.date.replace(/-/g, '/')).toLocaleDateString('es-MX')}</TableCell>
                              <TableCell><Badge variant="outline" className={cn('capitalize', getStatusClass(payment.status))}>{getStatusInSpanish(payment.status)}</Badge></TableCell>
                          </TableRow>
                      ))
                      ) : (
                          <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay pagos registrados.</TableCell></TableRow>
                      )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
            </Card>
         </TabsContent>
        <TabsContent value="quotes">
             <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between">
                        <div>
                            <CardTitle>Presupuestos</CardTitle>
                            <CardDescription className="hidden md:block">Planes de tratamiento y sus costos estimados.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="h-9 gap-2" onClick={() => setIsNewQuoteModalOpen(true)}>
                                <PlusCircle className="h-4 w-4" /> Crear Presupuesto
                            </Button>
                        </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <Input
                            placeholder="Buscar..."
                            className="flex-1 md:w-[200px]"
                            value={quoteSearchTerm}
                            onChange={(e) => setQuoteSearchTerm(e.target.value)}
                        />
                        <Button size="sm" className="h-9" onClick={() => setShowQuoteFilters(prev => {
                          const next = !prev;
                          if (!next) {
                            setQuoteStatusFilter('all');
                            setQuoteSort('created_desc');
                          }
                          return next;
                        })} aria-label="Abrir filtros">
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                       </div>

                       <div className={`mt-3 space-y-2 md:space-y-0 flex flex-col md:flex-row md:gap-2 ${showQuoteFilters ? '' : 'hidden'}`}>
                        <Select
                            value={quoteStatusFilter}
                            onValueChange={(value: any) => setQuoteStatusFilter(value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Estado del presupuesto" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="Draft">Borrador</SelectItem>
                                <SelectItem value="Presented">Presentado</SelectItem>
                                <SelectItem value="Accepted">Aceptado</SelectItem>
                                <SelectItem value="Expired">Expirado</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={quoteSort}
                            onValueChange={(value: any) => setQuoteSort(value)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_desc">Creación (reciente)</SelectItem>
                                <SelectItem value="created_asc">Creación (antigua)</SelectItem>
                                <SelectItem value="total_desc">Total (mayor a menor)</SelectItem>
                                <SelectItem value="total_asc">Total (menor a mayor)</SelectItem>
                                <SelectItem value="status_asc">Estado (A-Z)</SelectItem>
                            </SelectContent>
                        </Select>
                       </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isMobile ? (
                    <div className="space-y-3 p-2">
                      {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <Card key={i}><CardContent><Skeleton className="h-6 w-full" /></CardContent></Card>
                        ))
                      ) : filteredSortedQuotes.length > 0 ? (
                        filteredSortedQuotes.map(quote => (
                          <Card key={quote.id} className="p-3 cursor-pointer">
                            <div className="flex justify-between">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{quote.patientName}</div>
                                <div className="text-sm text-muted-foreground">Total: ${quote.total.toFixed(2)}</div>
                              </div>
                              <div className="ml-3 text-right">
                                <Badge variant="outline" className={cn('capitalize', getStatusClass(quote.status))}>{getStatusInSpanish(quote.status)}</Badge>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <Button size="sm" variant="secondary" onClick={() => handleConvertQuote(quote)} disabled={quote.status === 'Accepted'}>
                                Firmar y Crear
                              </Button>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="p-4 text-center">No se encontraron presupuestos.</div>
                      )}
                    </div>
                  ) : (
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
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">Cargando presupuestos...</TableCell></TableRow>
                        ) : filteredSortedQuotes.length > 0 ? (
                            filteredSortedQuotes.map(quote => (
                                <TableRow key={quote.id}>
                                    <TableCell className="font-medium hover:underline cursor-pointer" onClick={() => router.push(`/patients/${quote.patientId}`)}>
                                        {quote.patientName}
                                    </TableCell>
                                    <TableCell>${quote.total.toFixed(2)}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'numeric', day: 'numeric' }) : ''}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {new Date(quote.expiresAt.replace(/-/g, '/')).toLocaleDateString('es-MX')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn('capitalize', getStatusClass(quote.status))}>
                                            {getStatusInSpanish(quote.status)}
                                        </Badge>
                                        <Button 
                                            size="sm" 
                                            className="ml-2" 
                                            variant="secondary" 
                                            onClick={() => handleConvertQuote(quote)}
                                            disabled={quote.status === 'Accepted'}
                                            title={quote.status === 'Accepted' ? 'Este presupuesto ya ha sido convertido a tratamiento' : 'Firmar y crear tratamiento'}
                                        >
                                            Firmar y Crear Tratamiento
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron presupuestos.
                                </TableCell>
                            </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
            </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }
