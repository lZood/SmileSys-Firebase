
'use client';

import * as React from 'react';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2, ChevronLeft, Download, MoreHorizontal, HandCoins, PlusCircle, AlertCircle, Calendar, Stethoscope } from "lucide-react";
import { Odontogram, ToothState } from "@/components/odontogram";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { ConsentForm } from '@/components/consent-form';
import { getPatientById, getConsentFormsForPatient, updatePatientDentalChart, getDentalUpdatesForPatient } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { getUserData } from '@/app/user/actions';
import { getTreatmentsForPatient, getPaymentsForPatient, addPaymentToTreatment, deleteTreatment, updateTreatment } from '@/app/billing/actions';
import { getAppointmentsForPatient } from '@/app/appointments/actions';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getPaymentMethodIcon } from '@/components/icons/payment-method-icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddGeneralPaymentModal } from '@/components/add-general-payment-modal';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { format, parseISO } from 'date-fns';
import { ToothIcon } from '@/components/icons/tooth-icon';


type Patient = NonNullable<Awaited<ReturnType<typeof getPatientById>>>;
type Clinic = NonNullable<Awaited<ReturnType<typeof getUserData>>['clinic']>;
type ConsentDocument = {
    id: string;
    file_path: string;
    created_at: string;
};
type Treatment = Awaited<ReturnType<typeof getTreatmentsForPatient>>[0];
type Payment = Awaited<ReturnType<typeof getPaymentsForPatient>>[0];
type Appointment = Awaited<ReturnType<typeof getAppointmentsForPatient>>[0];
type DentalUpdate = Awaited<ReturnType<typeof getDentalUpdatesForPatient>>[0];

type TimelineEvent = {
    date: string;
    type: 'appointment' | 'treatment' | 'dental_update';
    title: string;
    description: string;
    icon: React.ComponentType<any>;
};

const getStatusInSpanish = (status: any) => {
    const translations: Record<string, string> = {
        'Paid': 'Pagado', 'Pending': 'Pendiente', 'Canceled': 'Cancelado',
        'active': 'Activo', 'completed': 'Completado', 'cancelled': 'Cancelado'
    };
    return translations[status] || status;
}

const getStatusClass = (status: any) => {
  switch (status) {
    case 'Paid': case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Pending': case 'active':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Canceled': case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AddPaymentModal = ({
    treatment,
    isOpen,
    onClose,
    onPaymentAdded
} : {
    treatment: Treatment | null;
    isOpen: boolean;
    onClose: () => void;
    onPaymentAdded: () => void;
}) => {
    const { toast } = useToast();
    const [amount, setAmount] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState<'Card' | 'Cash' | 'Transfer'>();
    const [notes, setNotes] = React.useState('');
    const [paymentDate, setPaymentDate] = React.useState<Date|undefined>(new Date());

    if (!treatment) return null;
    
    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0 || !paymentMethod || !paymentDate) {
            toast({ variant: 'destructive', title: 'Campos Inválidos', description: 'Por favor, introduce un monto y método de pago válidos.' });
            return;
        }

        const result = await addPaymentToTreatment({
            treatmentId: treatment.id,
            amount: parseFloat(amount),
            paymentDate: format(paymentDate, 'yyyy-MM-dd'),
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
}

const EditTreatmentModal = ({
    treatment,
    isOpen,
    onClose,
    onTreatmentUpdated,
}: {
    treatment: Treatment | null;
    isOpen: boolean;
    onClose: () => void;
    onTreatmentUpdated: () => void;
}) => {
    const { toast } = useToast();
    const [formData, setFormData] = React.useState({
        description: '',
        totalCost: 0,
        paymentType: 'one_time' as 'one_time' | 'monthly',
        durationMonths: 0,
        monthlyPayment: 0,
        status: 'active' as 'active' | 'completed' | 'cancelled',
    });

    React.useEffect(() => {
        if (treatment) {
            setFormData({
                description: treatment.description,
                totalCost: treatment.total_cost,
                paymentType: treatment.payment_type,
                durationMonths: treatment.duration_months || 0,
                monthlyPayment: treatment.monthly_payment || 0,
                status: treatment.status,
            });
        }
    }, [treatment]);

    if (!treatment) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    }

    const handleSelectChange = (id: string, value: string) => {
         setFormData(prev => ({ ...prev, [id]: value }));
    }

    const handleSubmit = async () => {
        if (!treatment) return;
        const result = await updateTreatment({
            treatmentId: treatment.id,
            ...formData,
        });

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Tratamiento Actualizado', description: 'Los cambios han sido guardados.'});
            onTreatmentUpdated();
            onClose();
        }
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Plan de Tratamiento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" value={formData.description} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2">
                             <Label htmlFor="totalCost">Costo Total ($)</Label>
                             <Input id="totalCost" type="number" value={formData.totalCost} onChange={handleChange} />
                         </div>
                          <div className="grid gap-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="completed">Completado</SelectItem>
                                    <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label>Tipo de Pago</Label>
                        <RadioGroup value={formData.paymentType} onValueChange={(v: any) => handleSelectChange('paymentType', v)}>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="one_time" id="r1" /><Label htmlFor="r1">Pago Único</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="monthly" id="r2" /><Label htmlFor="r2">Plan Mensual</Label></div>
                        </RadioGroup>
                    </div>
                    {formData.paymentType === 'monthly' && (
                         <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="durationMonths">Duración (meses)</Label>
                                <Input id="durationMonths" type="number" value={formData.durationMonths} onChange={handleChange} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="monthlyPayment">Pago Mensual ($)</Label>
                                <Input id="monthlyPayment" type="number" value={formData.monthlyPayment} onChange={handleChange} />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const TreatmentsList = ({ treatments, onRefetch }: { treatments: Treatment[], onRefetch: () => void }) => {
    const { toast } = useToast();
    const [selectedTreatment, setSelectedTreatment] = React.useState<Treatment | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

    const handleRegisterPaymentClick = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setIsPaymentModalOpen(true);
    };

    const handleEditClick = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setIsEditModalOpen(true);
    }

    const handleDelete = async (treatmentId: string) => {
        const { error } = await deleteTreatment(treatmentId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
            toast({ title: 'Tratamiento Eliminado', description: 'El plan de tratamiento ha sido eliminado.' });
            onRefetch();
        }
    };
    
    return (
        <Card>
            <AddPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} treatment={selectedTreatment} onPaymentAdded={() => { onRefetch(); setIsPaymentModalOpen(false); }}/>
            <EditTreatmentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} treatment={selectedTreatment} onTreatmentUpdated={() => { onRefetch(); setIsEditModalOpen(false); }}/>

            <CardHeader>
                <CardTitle>Planes de Tratamiento</CardTitle>
                <CardDescription>Tratamientos activos y completados para este paciente.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Progreso de Pago</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {treatments.length > 0 ? treatments.map(treatment => {
                            const progress = treatment.total_cost > 0 ? (treatment.total_paid / treatment.total_cost) * 100 : 0;
                            return (
                                <TableRow key={treatment.id}>
                                    <TableCell className="font-medium">{treatment.description}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm">${treatment.total_paid.toFixed(2)} / ${treatment.total_cost.toFixed(2)}</span>
                                            <Progress value={progress} className="h-2" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className={cn('capitalize', getStatusClass(treatment.status))}>{getStatusInSpanish(treatment.status)}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleRegisterPaymentClick(treatment)}><HandCoins className="mr-2 h-4 w-4" />Registrar Pago</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditClick(treatment)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Se eliminará el plan de tratamiento y todos sus pagos asociados.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(treatment.id)}>Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            );
                        }) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No hay tratamientos registrados para este paciente.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const PaymentsHistory = ({ payments, onAddPaymentClick }: { payments: Payment[], onAddPaymentClick: () => void }) => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Historial de Pagos</CardTitle>
                    <CardDescription>Todos los pagos registrados para este paciente.</CardDescription>
                </div>
                 <Button size="sm" className="h-9 gap-2" onClick={onAddPaymentClick}>
                    <PlusCircle className="h-4 w-4" /> Añadir Pago General
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {payments.length > 0 ? payments.map(payment => (
                        <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.date).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</TableCell>
                            <TableCell>{payment.concept}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    {payment.method && getPaymentMethodIcon(payment.method as any)}
                                    <span>{payment.method}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">No hay pagos registrados para este paciente.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const ClinicalHistoryTimeline = ({ events }: { events: TimelineEvent[] }) => {
    if (events.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
                No hay eventos en la historia clínica del paciente.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {events.map((event, index) => (
                <div key={index} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <event.icon className="h-5 w-5" />
                        </span>
                        {index < events.length - 1 && <div className="w-px h-full bg-border flex-grow mt-2"></div>}
                    </div>
                    <div className="flex-1 pt-1.5">
                        <div className="flex items-center justify-between">
                             <p className="font-semibold">{event.title}</p>
                             <time className="text-sm text-muted-foreground">
                                {new Date(event.date).toLocaleDateString('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' })}
                             </time>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};


// Custom hook to handle "beforeunload" event
const useBeforeUnload = (isDirty: boolean) => {
    React.useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (isDirty) {
                event.preventDefault();
                // Browsers show a generic message, custom messages are deprecated
                event.returnValue = ''; 
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);
};


const PatientDetailView = ({ patientId }: { patientId: string }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [clinic, setClinic] = React.useState<Clinic | null>(null);
  const [consentForms, setConsentForms] = React.useState<ConsentDocument[]>([]);
  const [treatments, setTreatments] = React.useState<Treatment[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [timelineEvents, setTimelineEvents] = React.useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConsentModalOpen, setIsConsentModalOpen] = React.useState(false);
  const [isGeneralPaymentModalOpen, setIsGeneralPaymentModalOpen] = React.useState(false);
  const [consentFormsLoading, setConsentFormsLoading] = React.useState(true);
  const [dentalChartState, setDentalChartState] = React.useState<ToothState | null>(null);
  const [isChartDirty, setIsChartDirty] = React.useState(false);
  
  const supabase = createClient();
  const defaultTab = searchParams.get('tab') || 'odontogram';

  useBeforeUnload(isChartDirty);

  const fetchAllData = React.useCallback(async (id: string) => {
    setIsLoading(true);
    
    const [
        patientData,
        userData,
        treatmentsData,
        paymentsData,
        consentFormsData,
        appointmentsData,
        dentalUpdatesData
    ] = await Promise.all([
        getPatientById(id),
        getUserData(),
        getTreatmentsForPatient(id),
        getPaymentsForPatient(id),
        getConsentFormsForPatient(id),
        getAppointmentsForPatient(id),
        getDentalUpdatesForPatient(id)
    ]);
    
    if (patientData) {
        setPatient(patientData);
        setDentalChartState(patientData.dental_chart);
    } else {
        notFound();
    }
    
    if(userData && userData.clinic?.id === patientData?.clinic_id) {
        setClinic(userData.clinic);
    }

    setTreatments(treatmentsData as Treatment[]);
    setPayments(paymentsData as Payment[]);
    setConsentForms(consentFormsData as ConsentDocument[]);
    setConsentFormsLoading(false);

    // Process data for timeline
    const events: TimelineEvent[] = [];
    
    (appointmentsData as Appointment[]).forEach(app => {
        events.push({
            date: app.appointment_date,
            type: 'appointment',
            title: `Cita: ${app.service_description}`,
            description: `Con ${app.doctor_name || 'doctor sin asignar'} a las ${app.appointment_time}. Estado: ${app.status}`,
            icon: Calendar
        });
    });

    (treatmentsData as Treatment[]).forEach(t => {
        events.push({
            date: t.start_date,
            type: 'treatment',
            title: `Inicio de Tratamiento: ${t.description}`,
            description: `Costo total: $${t.total_cost}. Estado: ${getStatusInSpanish(t.status)}`,
            icon: Stethoscope
        });
    });

    (dentalUpdatesData as DentalUpdate[]).forEach(u => {
        events.push({
            date: u.created_at,
            type: 'dental_update',
            title: 'Actualización de Odontograma',
            description: u.notes || 'Se modificó el estado dental del paciente.',
            icon: ToothIcon
        });
    });
    
    setTimelineEvents(events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    fetchAllData(patientId);
  }, [patientId, fetchAllData]);
  
  const handleConsentModalClose = (wasSubmitted: boolean) => {
      setIsConsentModalOpen(false);
      if (wasSubmitted) {
          fetchAllData(patientId); // Refetch all data
      }
  }

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('consent-forms').getPublicUrl(filePath);
    return data.publicUrl;
  }

  const handleOdontogramChange = (newChartState: ToothState) => {
    setDentalChartState(newChartState);
    if (!isChartDirty) {
        setIsChartDirty(true);
    }
  };

  const handleCancelChartChanges = () => {
    if (patient) {
        setDentalChartState(patient.dental_chart);
    }
    setIsChartDirty(false);
  };

  const handleSaveChartChanges = async () => {
      if (!patient || !dentalChartState || !clinic) return;

      const { error } = await updatePatientDentalChart({
          patientId: patient.id,
          clinicId: clinic.id,
          dentalChart: dentalChartState
      });

      if (error) {
          toast({ variant: 'destructive', title: 'Error', description: error });
      } else {
          toast({ title: 'Odontograma Actualizado', description: 'Los cambios se han guardado correctamente.' });
          setIsChartDirty(false);
          fetchAllData(patientId); // Refetch to update patient state and timeline
      }
  };


  if (isLoading) {
    return (
        <div className="space-y-4">
            <div className="mb-4">
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
                <div className="lg:col-span-2 md:col-span-4 space-y-4">
                    <Card>
                    <CardHeader className="flex flex-col items-center text-center">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-8 w-40 mt-4" />
                        <Skeleton className="h-4 w-32 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-px w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-px w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    </Card>
                    <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40"/>
                        <Skeleton className="h-4 w-48"/>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-5 md:col-span-4">
                    <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
      </div>
    );
  }

  if (!patient || !clinic) {
    return notFound();
  }

  const patientFullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <div className="space-y-4">
       {isConsentModalOpen && (
          <ConsentForm 
            patientId={patient.id}
            patientName={patientFullName}
            clinic={clinic} 
            onClose={handleConsentModalClose}
          />
        )}
       <AddGeneralPaymentModal
            isOpen={isGeneralPaymentModalOpen}
            onClose={() => setIsGeneralPaymentModalOpen(false)}
            onPaymentAdded={() => fetchAllData(patientId)}
            patients={[{id: patient.id, first_name: patient.first_name, last_name: patient.last_name}]}
            clinic={clinic}
            preselectedPatientId={patient.id}
        />
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
            <Link href="/patients">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver a Pacientes
            </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="lg:col-span-2 md:col-span-4">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person" />
                <AvatarFallback>{patient.first_name.charAt(0)}{patient.last_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{patientFullName}</CardTitle>
              <CardDescription>ID: {patient.id.substring(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator />
              <div className="py-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium text-foreground">{patient.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span className="font-medium text-foreground">{patient.phone || 'N/A'}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Última Visita:</span>
                  <span className="font-medium text-foreground">{new Date(patient.created_at).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="font-medium text-foreground">{patient.status}</span>
                </div>
              </div>
              <Separator />
               <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="w-full"><Pencil className="w-4 h-4 mr-2" /> Editar</Button>
                  <Button variant="destructive" className="w-full"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</Button>
              </div>
            </CardContent>
          </Card>
           <Card className="mt-4">
              <CardHeader>
                <CardTitle>Consentimientos Digitales</CardTitle>
                 <CardDescription>Gestionar consentimientos informados.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Button className="w-full" onClick={() => setIsConsentModalOpen(true)}>
                    <FileText className="w-4 h-4 mr-2" /> Generar Nuevo Consentimiento
                 </Button>
                  <div className="text-sm space-y-2 mt-4">
                      {consentFormsLoading ? (
                          <Skeleton className="h-8 w-full" />
                      ) : consentForms.length > 0 ? (
                          consentForms.map(form => (
                              <div key={form.id} className="flex justify-between items-center p-2 rounded-md bg-muted">
                                  <span>Consentimiento - {new Date(form.created_at).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</span>
                                   <Button asChild variant="ghost" size="icon">
                                      <a href={getPublicUrl(form.file_path)} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                      </a>
                                  </Button>
                              </div>
                          ))
                      ) : (
                         <div className="text-xs text-muted-foreground mt-2 text-center">No se encontraron consentimientos.</div>
                      )}
                 </div>
              </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-5 md:col-span-4">
            <Tabs defaultValue={defaultTab}>
                <TabsList>
                    <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
                    <TabsTrigger value="history">Historia Clínica</TabsTrigger>
                    <TabsTrigger value="billing">Facturación</TabsTrigger>
                </TabsList>
                <TabsContent value="odontogram">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Odontograma Interactivo</CardTitle>
                                    <CardDescription>Representación gráfica de la dentición del paciente.</CardDescription>
                                </div>
                                {isChartDirty && (
                                     <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                                        <span className="text-sm text-yellow-600 font-medium">Cambios sin guardar</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Odontogram initialData={dentalChartState} onChange={handleOdontogramChange} />
                            {isChartDirty && (
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={handleCancelChartChanges}>Cancelar</Button>
                                    <Button onClick={handleSaveChartChanges}>Guardar Cambios</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                     <Card>
                        <CardHeader>
                        <CardTitle>Historia Clínica</CardTitle>
                        <CardDescription>Cronología de todos los tratamientos, citas y actualizaciones.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ClinicalHistoryTimeline events={timelineEvents} />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="billing">
                     <div className="space-y-4">
                        <TreatmentsList treatments={treatments} onRefetch={() => fetchAllData(patientId)} />
                        <PaymentsHistory payments={payments} onAddPaymentClick={() => setIsGeneralPaymentModalOpen(true)} />
                     </div>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  return (
    <DashboardLayout>
      <PatientDetailView patientId={params.id} />
    </DashboardLayout>
  );
}

    