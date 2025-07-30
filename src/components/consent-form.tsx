
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

        const clinicName = clinic.name || "Clínica Dental";
        const clinicInfo = [clinic.address, clinic.phone].filter(Boolean).join(' | ');
        const termsAndConditions = clinic.terms_and_conditions || "No se han especificado términos y condiciones.";

        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.text(clinicName, 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(clinicInfo, 105, 28, { align: 'center' });
        doc.setFontSize(18);
        doc.text('Consentimiento Informado de Tratamiento', 105, 45, { align: 'center' });
        doc.text(`Paciente: ${patientName}`, 20, 60);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 60);

        doc.autoTable({
            startY: 70,
            head: [['Descripción del Tratamiento', 'Duración Estimada', 'Costo Total', 'Pago Mensual']],
            body: [[formData.treatment, formData.duration, `$${formData.totalCost}`, `$${formData.monthlyPayment || 'N/A'}`]],
            theme: 'grid',
        });
        
        const autoTableFinalY = (doc as any).lastAutoTable.finalY || 85;
        doc.setFontSize(12);
        doc.text("Términos y Condiciones", 20, autoTableFinalY + 15);
        const splitTerms = doc.splitTextToSize(termsAndConditions, 170);
        doc.text(splitTerms, 20, autoTableFinalY + 22);
        
        const termsFinalY = autoTableFinalY + 22 + (splitTerms.length * 5);
        doc.setFontSize(10);
        doc.text("Declaro que he leído y comprendido la información anterior y acepto los términos y condiciones del tratamiento.", 20, termsFinalY + 15);

        const finalY = termsFinalY + 40;
        
        const patientSig = patientSignatureRef.current.toDataURL('image/png');
        const doctorSig = doctorSignatureRef.current.toDataURL('image/png');

        doc.addImage(patientSig, 'PNG', 20, finalY - 15, 60, 20);
        doc.line(20, finalY + 5, 80, finalY + 5);
        doc.text('Firma del Paciente', 45, finalY + 10, { align: 'center' });

        doc.addImage(doctorSig, 'PNG', 130, finalY - 15, 60, 20);
        doc.line(130, finalY + 5, 190, finalY + 5);
        doc.text('Firma del Profesional', 160, finalY + 10, { align: 'center' });

        const pdfBlob = doc.output('blob');
        const fileName = `consentimiento-${patientId}-${Date.now()}.pdf`;
        
        const { error } = await uploadConsentForm(patientId, clinic.id, pdfBlob, fileName);
        
        setIsLoading(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Error al Guardar', description: error });
        } else {
            toast({ title: 'Consentimiento Guardado', description: 'El documento ha sido guardado exitosamente.' });
            onClose(true);
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
