
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
import { Combobox } from '@/components/ui/combobox';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Define the type for Clinic based on the actual structure returned by getUserData
type UserData = NonNullable<Awaited<ReturnType<typeof getUserData>>>;
type Clinic = NonNullable<UserData['clinic']>;

type ConsentFormProps = {
    patientId: string;
    patientName: string;
    clinic: Clinic;
    doctors: { id: string; first_name: string; last_name: string; roles: string[] }[];
    onClose: (wasSubmitted: boolean) => void;
    initialData?: {
        treatments: { description: string; cost: string; }[];
        totalCost: string;
        paymentType: 'one_time' | 'monthly';
        duration?: string;
        monthlyPayment?: string;
        doctorId?: string;
    };
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

export const ConsentForm = ({ patientId, patientName, clinic, doctors, onClose, initialData }: ConsentFormProps) => {
    type Treatment = {
        description: string;
        cost: string;
    };
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [acceptedTerms, setAcceptedTerms] = React.useState(false);
    const [showAddToBillingDialog, setShowAddToBillingDialog] = React.useState(false);

    const [formData, setFormData] = React.useState({
        treatments: initialData?.treatments || [{ 
            description: '',
            cost: ''
        }],
        duration: initialData?.duration || '',
        totalCost: initialData?.totalCost || '',
        monthlyPayment: initialData?.monthlyPayment || '',
        paymentType: initialData?.paymentType || 'one_time' as 'one_time' | 'monthly',
        doctorId: initialData?.doctorId || '',
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
        const hasEmptyTreatments = formData.treatments.some(t => !t.description || !t.cost);
        if (hasEmptyTreatments) {
            toast({ variant: "destructive", title: "Tratamientos Incompletos", description: "Por favor, complete la descripción y el costo de todos los tratamientos." });
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
        if (!formData.doctorId) {
            toast({ variant: "destructive", title: "Doctor no Seleccionado", description: "Por favor, seleccione el profesional que realiza el tratamiento." });
            return false;
        }

        setIsLoading(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const currentDate = new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            });

            // Función helper para agregar texto con salto de línea automático
            const addWrappedText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, x, y);
                return y + (lines.length * lineHeight);
            };

            // Header con logo y título
            if (clinic.logo_url) {
                try {
                    const logoData = await toBase64(clinic.logo_url);
                    doc.addImage(logoData as string, 'PNG', margin, margin, 40, 40);
                } catch (error) {
                    console.error('Error loading clinic logo:', error);
                }
            }

            // Configuración inicial y título
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.text("Consentimiento Informado", pageWidth / 2, margin + 10, { align: "center" });

            // Información de la clínica
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            let yPos = margin + 30;
            
            doc.text(`${clinic.name || 'Clínica Dental'}`, pageWidth - margin - 100, yPos);
            yPos += 7;
            doc.text(`${clinic.address || 'Dirección no especificada'}`, pageWidth - margin - 100, yPos);
            yPos += 7;
            doc.text(`Tel: ${clinic.phone || 'No especificado'}`, pageWidth - margin - 100, yPos);
            yPos += 7;

            // Información del paciente y fecha
            doc.setFont("helvetica", "bold");
            yPos = margin + 60;
            doc.text("INFORMACIÓN DEL PACIENTE", margin, yPos);
            doc.setFont("helvetica", "normal");
            
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPos + 5, pageWidth - (margin * 2), 30, 'F');
            
            yPos += 15;
            doc.text(`Paciente: ${patientName}`, margin + 5, yPos);
            doc.text(`Fecha: ${currentDate}`, pageWidth - margin - 80, yPos);
            yPos += 10;
            doc.text(`ID: ${patientId}`, margin + 5, yPos);

            // Detalles del tratamiento
            yPos += 20;
            doc.setFont("helvetica", "bold");
            doc.text("PLAN DE TRATAMIENTO", margin, yPos);
            doc.setFont("helvetica", "normal");

            // Tabla de tratamientos
            const treatmentsTableData = formData.treatments
                .filter(t => t.description.trim() && t.cost)
                .map(t => [
                    t.description,
                    formData.paymentType === 'monthly' ? `${formData.duration} meses` : 'N/A',
                    `$${parseFloat(t.cost).toFixed(2)}`,
                    formData.paymentType === 'monthly' ? `$${(parseFloat(t.cost) / parseInt(formData.duration)).toFixed(2)}` : 'N/A'
                ]);

            doc.autoTable({
                startY: yPos + 5,
                head: [['Descripción del Tratamiento', 'Duración Estimada', 'Costo Total', 'Pago Mensual']],
                body: treatmentsTableData,
                theme: 'grid',
                headStyles: { 
                    fillColor: [66, 66, 66],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: {
                    cellPadding: 5,
                    fontSize: 10
                },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 30 },
                    3: { cellWidth: 30 }
                },
                margin: { left: margin, right: margin }
            });

            // Información de pago
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFont("helvetica", "bold");
            doc.text("RESUMEN DE PAGO", margin, finalY);
            doc.setFont("helvetica", "normal");
            
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, finalY + 5, pageWidth - (margin * 2), 40, 'F');
            
            let paymentY = finalY + 15;
            doc.text(`Costo Total: $${formData.totalCost}`, margin + 5, paymentY);
            paymentY += 10;
            
            if (formData.paymentType === 'monthly') {
                doc.text(`Plan de Pagos Mensuales:`, margin + 5, paymentY);
                paymentY += 10;
                doc.text(`Duración: ${formData.duration} meses`, margin + 15, paymentY);
                doc.text(`Pago Mensual: $${formData.monthlyPayment}`, margin + 120, paymentY);
            } else {
                doc.text(`Tipo de Pago: Pago Único`, margin + 5, paymentY);
            }

            // Términos y condiciones en nueva página
            doc.addPage();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("TÉRMINOS Y CONDICIONES", margin, margin);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const terms = clinic.terms_and_conditions || 'No se han especificado términos y condiciones.';
            const maxWidth = pageWidth - (margin * 2);
            const lines = doc.splitTextToSize(terms, maxWidth);
            
            let currentY = margin + 10;
            // Reducimos el espacio entre líneas a 5 puntos (antes era 12)
            const lineSpacing = 5;
            const linesPerPage = Math.floor((pageHeight - (margin * 2)) / lineSpacing);

            // Dividir las líneas en páginas
            for (let i = 0; i < lines.length; i += linesPerPage) {
                if (i !== 0) {
                    doc.addPage();
                    currentY = margin;
                }
                const pageLines = lines.slice(i, i + linesPerPage);
                // Dibujamos las líneas con menos espacio entre ellas
                pageLines.forEach((line: string, index: number) => {
                    doc.text(line, margin, currentY + (index * lineSpacing));
                });
            }

            // Nueva página para las firmas
            doc.addPage();
            yPos = margin;

            // Sección de firmas
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("FIRMAS DE CONFORMIDAD", margin, yPos);
            yPos += 10;

            // Firmas
            if (patientSignatureRef.current) {
                const patientSignatureData = patientSignatureRef.current.toDataURL();
                doc.addImage(patientSignatureData, 'PNG', margin, yPos, 70, 30);
                doc.setFont("helvetica", "normal");
                doc.text("Firma del Paciente", margin, yPos + 40);
                doc.text(patientName, margin, yPos + 47);
            }

            if (doctorSignatureRef.current) {
                const doctorSignatureData = doctorSignatureRef.current.toDataURL();
                doc.addImage(doctorSignatureData, 'PNG', pageWidth - margin - 70, yPos, 70, 30);
                doc.setFont("helvetica", "normal");
                doc.text("Firma del Profesional", pageWidth - margin - 70, yPos + 40);
                const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
                const doctorName = selectedDoctor ? `Dr. ${selectedDoctor.first_name} ${selectedDoctor.last_name}` : "Dr./Dra.";
                doc.text(doctorName, pageWidth - margin - 70, yPos + 47);
            }

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
        try {
            // Filtrar los tratamientos válidos
            const validTreatments = formData.treatments.filter(t => t.description.trim() && t.cost);
            
            // Calcular el pago mensual por tratamiento si es plan mensual
            const totalCostSum = validTreatments.reduce((sum, t) => sum + parseFloat(t.cost), 0);
            const monthlyPaymentPerTreatment = formData.paymentType === 'monthly' 
                ? parseFloat(formData.monthlyPayment) / validTreatments.length 
                : null;
            
            // Crear un tratamiento por cada uno en la lista
            for (const treatment of validTreatments) {
                const treatmentData = {
                    patientId,
                    clinicId: clinic.id,
                    description: treatment.description,
                    totalCost: parseFloat(treatment.cost),
                    paymentType: formData.paymentType,
                    durationMonths: formData.paymentType === 'monthly' ? parseInt(formData.duration) : null,
                    monthlyPayment: monthlyPaymentPerTreatment,
                };

                const result = await createTreatment(treatmentData);
                if (result.error) throw new Error(result.error);
            }
            
            toast({ 
                title: 'Tratamientos Creados', 
                description: `Se han añadido ${validTreatments.length} tratamiento(s) a la sección de facturación.` 
            });
            setShowAddToBillingDialog(false);
            onClose(true);
        } catch (error: any) {
            toast({ 
                variant: 'destructive', 
                title: 'Error al crear tratamientos', 
                description: error.message 
            });
        } finally {
            setIsLoading(false);
        }
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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Tratamientos</Label>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            treatments: [...prev.treatments, { description: '', cost: '' }]
                                        }))}
                                    >
                                        Agregar Tratamiento
                                    </Button>
                                </div>
                                {formData.treatments.map((treatment, index) => (
                                    <div key={index} className="grid gap-4 p-4 border rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <Label>Tratamiento {index + 1}</Label>
                                            {index > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            treatments: prev.treatments.filter((_, i) => i !== index)
                                                        }))
                                                    }}
                                                >
                                                    Eliminar
                                                </Button>
                                            )}
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor={`treatment-${index}`}>Descripción</Label>
                                                <Textarea
                                                    id={`treatment-${index}`}
                                                    placeholder="Describa el tratamiento a realizar..."
                                                    value={treatment.description}
                                                    onChange={(e) => {
                                                        const newTreatments = [...formData.treatments];
                                                        newTreatments[index].description = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            treatments: newTreatments
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor={`cost-${index}`}>Costo ($)</Label>
                                                <Input
                                                    id={`cost-${index}`}
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={treatment.cost}
                                                    onChange={(e) => {
                                                        const newTreatments = [...formData.treatments];
                                                        newTreatments[index].cost = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            treatments: newTreatments,
                                                            totalCost: newTreatments.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0).toString()
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
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

                            <div className="grid gap-2">
                                <Label htmlFor="doctor">Profesional que realiza el tratamiento</Label>
                                <Combobox 
                                    options={doctors
                                        .filter(d => d.roles.includes('doctor'))
                                        .map(d => ({
                                            label: `Dr. ${d.first_name} ${d.last_name}`,
                                            value: d.id,
                                            data: d
                                        }))}
                                    value={formData.doctorId}
                                    onChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
                                    placeholder="Seleccionar doctor..."
                                    emptyMessage="No se encontraron doctores."
                                />
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
