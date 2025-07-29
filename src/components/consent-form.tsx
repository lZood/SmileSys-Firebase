
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

type ConsentFormProps = {
    patientName: string;
    onClose: () => void;
};

export const ConsentForm = ({ patientName, onClose }: ConsentFormProps) => {
    const { toast } = useToast();
    const [formData, setFormData] = React.useState({
        treatment: '',
        duration: '',
        totalCost: '',
        monthlyPayment: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const generatePdf = () => {
        // These would be fetched from your settings/context
        const clinicName = "SmileSys Dental Care";
        const clinicAddress = "123 Dental Ave, Smiletown";
        const clinicLogoUrl = "https://placehold.co/100x40.png"; // Replace with your actual logo URL from settings
        const termsAndConditions = "1. Los pagos deben realizarse mensualmente. 2. Cualquier cita cancelada con menos de 24 horas de antelación incurrirá en un cargo. 3. Este plan de tratamiento es una estimación y puede cambiar según la respuesta del paciente.";

        const doc = new jsPDF();

        // Add Logo
        // Note: jsPDF might have trouble with remote images due to CORS.
        // A common solution is to convert the image to a base64 data URI first.
        // For this example, we'll assume a placeholder or a working image URL.
        doc.setFontSize(22);
        doc.text(clinicName, 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(clinicAddress, 105, 28, { align: 'center' });
        doc.setFontSize(18);
        doc.text('Consentimiento Informado de Tratamiento', 105, 45, { align: 'center' });

        // Patient and Treatment Info
        doc.setFontSize(12);
        doc.text(`Paciente: ${patientName}`, 20, 60);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 60);

        doc.autoTable({
            startY: 70,
            head: [['Descripción del Tratamiento', 'Duración Estimada', 'Costo Total', 'Pago Mensual']],
            body: [[formData.treatment, formData.duration, `$${formData.totalCost}`, `$${formData.monthlyPayment}`]],
            theme: 'grid',
        });
        
        // Terms and Conditions
        const autoTableFinalY = (doc as any).lastAutoTable.finalY || 85;
        doc.setFontSize(12);
        doc.text("Términos y Condiciones", 20, autoTableFinalY + 15);
        const splitTerms = doc.splitTextToSize(termsAndConditions, 170);
        doc.text(splitTerms, 20, autoTableFinalY + 22);

        // Signature Area
        const finalY = autoTableFinalY + 22 + (splitTerms.length * 7) + 20;
        doc.line(40, finalY, 100, finalY);
        doc.text('Firma del Paciente', 55, finalY + 5);

        doc.line(130, finalY, 190, finalY);
        doc.text('Firma del Dentista', 145, finalY + 5);

        doc.save(`consentimiento-${patientName.replace(/\s/g, '_')}.pdf`);
    };

    const handleSave = () => {
        // Simple validation
        if (!formData.treatment || !formData.duration || !formData.totalCost || !formData.monthlyPayment) {
             toast({
                variant: "destructive",
                title: "Campos Incompletos",
                description: "Por favor, complete todos los campos del formulario.",
            });
            return;
        }
        
        generatePdf();
        toast({
            title: "PDF Generado",
            description: "El consentimiento informado ha sido generado y descargado.",
        });
        onClose();
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Generar Consentimiento Informado</DialogTitle>
                    <DialogDescription>
                        Complete los detalles del tratamiento para {patientName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="treatment">Tratamiento</Label>
                            <Textarea id="treatment" placeholder="Describa el tratamiento a realizar..." value={formData.treatment} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duración</Label>
                            <Input id="duration" placeholder="Ej. 12 meses" value={formData.duration} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="totalCost">Costo Total ($)</Label>
                            <Input id="totalCost" type="number" placeholder="2500" value={formData.totalCost} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="monthlyPayment">Pago Mensual ($)</Label>
                            <Input id="monthlyPayment" type="number" placeholder="200" value={formData.monthlyPayment} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Generar y Guardar PDF</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
