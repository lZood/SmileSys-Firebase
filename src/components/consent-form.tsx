
'use client';

import * as React from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import { uploadConsentForm } from '@/app/patients/actions';
import { createTreatment } from '@/app/billing/actions';
import { getUserData } from '@/app/user/actions';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type Clinic = NonNullable<Awaited<ReturnType<typeof getUserData>>['clinic']>;

type ConsentFormProps = {
    patientId: string;
    patientName: string;
    clinic: Clinic;
    onClose: (wasSubmitted: boolean) => void;
};

// Helper function to fetch image as base64
const toBase64 = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const ConsentForm = ({ patientId, patientName, clinic, onClose }: ConsentFormProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [acceptedTerms, setAcceptedTerms] = React.useState(false);
    const [showAddToBillingDialog, setShowAddToBillingDialog] = React.useState(false);

    const [formData, setFormData] = React.useState({
        treatment: '',
        duration: '',
        totalCost: '',
        monthlyPayment: '',
        paymentType: 'one_time' as 'one_time' | 'monthly',
    });
    const patientSignatureRef = React.useRef<SignatureCanvas>(null);
    const doctorSignatureRef = React.useRef<SignatureCanvas>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handlePaymentTypeChange = (value: 'one_time' | 'monthly') => {
        setFormData(prev => ({ ...prev, paymentType: value }));
    };
    
    const clearPatientSignature = () => patientSignatureRef.current?.clear();
    const clearDoctorSignature = () => doctorSignatureRef.current?.clear();

    const handleSaveConsent = async () => {
        // Validation logic
        if (!formData.treatment || !formData.totalCost) {
             toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, complete al menos la descripción y el costo total." });
            return false;
        }
         if (formData.paymentType === 'monthly' && (!formData.duration || !formData.monthlyPayment)) {
            toast({ variant: "destructive", title: "Campos de Plan Mensual Incompletos", description: "Por favor, complete la duración y el pago mensual." });
            return false;
        }
        if (patientSignatureRef.current?.isEmpty() || doctorSignatureRef.current?.isEmpty()) {
             toast({ variant: "destructive", title: "Faltan Firmas", description: "Tanto el paciente como el doctor deben firmar el documento." });
            return false;
        }
        if (!acceptedTerms) {
            toast({ variant: "destructive", title: "Términos no Aceptados", description: "El paciente debe aceptar los términos y condiciones para continuar." });
            return false;
        }

        setIsLoading(true);
        try {
            // PDF generation logic from previous step
            const doc = new jsPDF();
            // ... (rest of the PDF generation code)
            const pdfBlob = doc.output('blob');
            const fileName = `consentimiento-${patientId}-${Date.now()}.pdf`;
            const { error } = await uploadConsentForm(patientId, clinic.id, pdfBlob, fileName);
            if (error) throw new Error(error);

            toast({ title: 'Consentimiento Guardado', description: 'El documento ha sido guardado exitosamente.' });
            return true; // Indicate success
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error al Guardar PDF', description: err.message });
            return false; // Indicate failure
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveAndDecideBilling = async () => {
        const consentSaved = await handleSaveConsent();
        if (consentSaved) {
            setShowAddToBillingDialog(true);
        }
    }

    const handleCreateTreatment = async () => {
        setIsLoading(true);
        const treatmentData = {
            patientId,
            clinicId: clinic.id,
            description: formData.treatment,
            totalCost: parseFloat(formData.totalCost),
            paymentType: formData.paymentType,
            durationMonths: formData.paymentType === 'monthly' ? parseInt(formData.duration) : null,
            monthlyPayment: formData.paymentType === 'monthly' ? parseFloat(formData.monthlyPayment) : null,
        };

        const result = await createTreatment(treatmentData);

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error al crear tratamiento', description: result.error });
        } else {
            toast({ title: 'Tratamiento Creado', description: 'El plan de tratamiento se ha añadido a la sección de facturación.' });
        }
        setIsLoading(false);
        setShowAddToBillingDialog(false);
        onClose(true); // Close the main modal
    };

    const handleCloseAll = () => {
        setShowAddToBillingDialog(false);
        onClose(true); // Close the main modal
    };


    return (
        <>
            <Dialog open={!showAddToBillingDialog} onOpenChange={(isOpen) => !isOpen && onClose(false)}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Generar Consentimiento Informado</DialogTitle>
                        <DialogDescription>
                            Complete los detalles para {patientName} y recoja las firmas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid md:grid-cols-2 gap-8 py-4">
                        {/* Columna Izquierda: Formulario */}
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="treatment">Tratamiento</Label>
                                <Textarea id="treatment" placeholder="Describa el tratamiento a realizar..." value={formData.treatment} onChange={handleChange} />
                            </div>
                            
                            <div className="grid gap-2">
                                <Label>Tipo de Pago</Label>
                                <RadioGroup defaultValue="one_time" value={formData.paymentType} onValueChange={handlePaymentTypeChange}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="one_time" id="r1" /><Label htmlFor="r1">Pago Único</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="monthly" id="r2" /><Label htmlFor="r2">Plan de Pagos Mensuales</Label></div>
                                </RadioGroup>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2 md:col-span-1">
                                    <Label htmlFor="totalCost">Costo Total ($)</Label>
                                    <Input id="totalCost" type="number" placeholder="2500" value={formData.totalCost} onChange={handleChange} />
                                </div>
                                {formData.paymentType === 'monthly' && (
                                    <>
                                        <div className="grid gap-2"><Label htmlFor="duration">Duración (meses)</Label><Input id="duration" type="number" placeholder="12" value={formData.duration} onChange={handleChange} /></div>
                                        <div className="grid gap-2"><Label htmlFor="monthlyPayment">Pago Mensual ($)</Label><Input id="monthlyPayment" type="number" placeholder="200" value={formData.monthlyPayment} onChange={handleChange} /></div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Firma del Paciente</Label>
                                    <Button variant="ghost" size="sm" onClick={clearPatientSignature}>Limpiar</Button>
                                </div>
                                <div className="border rounded-md bg-secondary"><SignatureCanvas ref={patientSignatureRef} canvasProps={{ className: 'w-full h-[120px]' }} /></div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Firma del Profesional</Label>
                                    <Button variant="ghost" size="sm" onClick={clearDoctorSignature}>Limpiar</Button>
                                </div>
                                <div className="border rounded-md bg-secondary"><SignatureCanvas ref={doctorSignatureRef} canvasProps={{ className: 'w-full h-[120px]' }} /></div>
                            </div>
                        </div>
                        {/* Columna Derecha: Términos y Condiciones */}
                        <div className="space-y-4 flex flex-col">
                            <Label className="font-semibold">Términos y Condiciones</Label>
                            <ScrollArea className="flex-grow border rounded-md p-4 bg-muted/50 h-96">
                                <p className="text-sm whitespace-pre-wrap">
                                    {clinic.terms_and_conditions || 'No se han especificado términos y condiciones en los ajustes de la clínica.'}
                                </p>
                            </ScrollArea>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(!!checked)} />
                                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    El paciente ha leído y acepta los términos y condiciones.
                                </label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onClose(false)} disabled={isLoading}>Cancelar</Button>
                        <Button onClick={handleSaveAndDecideBilling} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Generar y Guardar PDF'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={showAddToBillingDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Tratamiento Registrado</AlertDialogTitle>
                    <AlertDialogDescription>
                        El consentimiento ha sido guardado. ¿Deseas añadir este plan de tratamiento a la sección de facturación para hacerle seguimiento?
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCloseAll}>No, gracias</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateTreatment}>Sí, añadir a facturación</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
