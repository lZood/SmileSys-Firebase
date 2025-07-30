
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
import { getUserData } from '@/app/user/actions';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';

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
    const [formData, setFormData] = React.useState({
        treatment: '',
        duration: '',
        totalCost: '',
        monthlyPayment: '',
    });
    const patientSignatureRef = React.useRef<SignatureCanvas>(null);
    const doctorSignatureRef = React.useRef<SignatureCanvas>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };
    
    const clearPatientSignature = () => patientSignatureRef.current?.clear();
    const clearDoctorSignature = () => doctorSignatureRef.current?.clear();

    const handleSave = async () => {
        if (!formData.treatment || !formData.duration || !formData.totalCost) {
             toast({ variant: "destructive", title: "Campos Incompletos", description: "Por favor, complete todos los campos del tratamiento." });
            return;
        }
        if (patientSignatureRef.current?.isEmpty() || doctorSignatureRef.current?.isEmpty()) {
             toast({ variant: "destructive", title: "Faltan Firmas", description: "Tanto el paciente como el doctor deben firmar el documento." });
            return;
        }
        if (!acceptedTerms) {
            toast({ variant: "destructive", title: "Términos no Aceptados", description: "El paciente debe aceptar los términos y condiciones para continuar." });
            return;
        }

        setIsLoading(true);

        try {
            const clinicName = clinic.name || "Clínica Dental";
            const clinicInfo = [clinic.address, clinic.phone].filter(Boolean).join(' | ');
            const termsAndConditions = clinic.terms_and_conditions || "No se han especificado términos y condiciones.";

            const doc = new jsPDF();
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            let cursorY = 20;

            // --- Header with Logo ---
            if (clinic.logo_url) {
                try {
                    const logoBase64 = await toBase64(clinic.logo_url);
                    doc.addImage(logoBase64 as string, 'PNG', margin, cursorY - 10, 30, 30);
                } catch (e) {
                    console.error("Error loading clinic logo:", e);
                }
            }
            doc.setFontSize(22);
            doc.text(clinicName, pageWidth / 2, cursorY, { align: 'center' });
            cursorY += 8;
            doc.setFontSize(10);
            doc.text(clinicInfo, pageWidth / 2, cursorY, { align: 'center' });
            cursorY += 15;
            
            // --- Document Title ---
            doc.setFontSize(18);
            doc.text('Consentimiento Informado de Tratamiento', pageWidth / 2, cursorY, { align: 'center' });
            cursorY += 15;

            // --- Patient Info ---
            doc.text(`Paciente: ${patientName}`, margin, cursorY);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, pageWidth - margin, cursorY, { align: 'right' });
            cursorY += 10;
            
            // --- Treatment Table ---
            doc.autoTable({
                startY: cursorY,
                head: [['Descripción del Tratamiento', 'Duración Estimada', 'Costo Total', 'Pago Mensual']],
                body: [[formData.treatment, formData.duration, `$${formData.totalCost}`, `$${formData.monthlyPayment || 'N/A'}`]],
                theme: 'grid',
                margin: { left: margin, right: margin }
            });
            cursorY = (doc as any).lastAutoTable.finalY + 15;

            // --- Terms and Conditions (with pagination) ---
            doc.setFontSize(12);
            doc.text("Términos y Condiciones", margin, cursorY);
            cursorY += 7;
            doc.setFontSize(10);
            const splitTerms = doc.splitTextToSize(termsAndConditions, pageWidth - (margin * 2));
            
            splitTerms.forEach((line: string) => {
                if (cursorY + 5 > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }
                doc.text(line, margin, cursorY);
                cursorY += 5;
            });

            // --- Acceptance Text ---
            cursorY += 10;
            if (cursorY + 15 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
            doc.text("Declaro que he leído y comprendido la información anterior y acepto los términos y condiciones del tratamiento.", margin, cursorY);
            cursorY += 20;

            // --- Signatures ---
            const sigHeight = 20;
            const sigWidth = 60;
            if (cursorY + sigHeight + 15 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
            
            const patientSig = patientSignatureRef.current.toDataURL('image/png');
            const doctorSig = doctorSignatureRef.current.toDataURL('image/png');

            doc.addImage(patientSig, 'PNG', margin, cursorY - 15, sigWidth, sigHeight);
            doc.line(margin, cursorY + sigHeight - 10, margin + sigWidth, cursorY + sigHeight - 10);
            doc.text('Firma del Paciente', margin + (sigWidth / 2), cursorY + sigHeight - 5, { align: 'center' });

            const doctorSigX = pageWidth - margin - sigWidth;
            doc.addImage(doctorSig, 'PNG', doctorSigX, cursorY - 15, sigWidth, sigHeight);
            doc.line(doctorSigX, cursorY + sigHeight - 10, doctorSigX + sigWidth, cursorY + sigHeight - 10);
            doc.text('Firma del Profesional', doctorSigX + (sigWidth / 2), cursorY + sigHeight - 5, { align: 'center' });

            // --- Upload PDF ---
            const pdfBlob = doc.output('blob');
            const fileName = `consentimiento-${patientId}-${Date.now()}.pdf`;
            
            const { error } = await uploadConsentForm(patientId, clinic.id, pdfBlob, fileName);
            
            if (error) {
                throw new Error(error);
            }
            
            toast({ title: 'Consentimiento Guardado', description: 'El documento ha sido guardado exitosamente.' });
            onClose(true);

        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error al Guardar', description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={() => onClose(false)}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Generar Consentimiento Informado</DialogTitle>
                    <DialogDescription>
                        Complete los detalles del tratamiento para {patientName} y recoja las firmas.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-8 py-4">
                    {/* Columna Izquierda: Formulario */}
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="treatment">Tratamiento</Label>
                            <Textarea id="treatment" placeholder="Describa el tratamiento a realizar..." value={formData.treatment} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2"><Label htmlFor="duration">Duración</Label><Input id="duration" placeholder="Ej. 12 meses" value={formData.duration} onChange={handleChange} /></div>
                            <div className="grid gap-2"><Label htmlFor="totalCost">Costo Total ($)</Label><Input id="totalCost" type="number" placeholder="2500" value={formData.totalCost} onChange={handleChange} /></div>
                            <div className="grid gap-2"><Label htmlFor="monthlyPayment">Pago Mensual ($)</Label><Input id="monthlyPayment" type="number" placeholder="200" value={formData.monthlyPayment} onChange={handleChange} /></div>
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
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                El paciente ha leído y acepta los términos y condiciones.
                            </label>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Generar y Guardar PDF'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
