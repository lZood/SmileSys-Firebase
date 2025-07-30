
'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Step1PersonalInfo } from './patient-form/step1-personal-info';
import { Step2MedicalHistory } from './patient-form/step2-medical-history';
import { Step3VitalSigns } from './patient-form/step3-vital-signs';
import { Step4Odontogram } from './patient-form/step4-odontogram';
import { useToast } from '@/hooks/use-toast';
import { addPatient } from '@/app/patients/actions';

const totalSteps = 4;

const initialFormData = {
    // Step 1
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    occupation: '',
    phone: '',
    address: '',
    email: '',
    // Step 2
    medicalConditions: {
        diabetes: false,
        cardiopathy: false,
        hypertension: false,
        coagulationIssues: false,
        epilepsy: false,
        hepatitis: false,
        hiv: false,
        cancer: false,
        allergies: false,
    },
    pregnancyQuarter: '',
    currentMedications: '',
    // Step 3
    bloodPressure: '',
    pulse: '',
    temperature: '',
    medicalDiagnosis: '',
    // Step 4
    dentalChart: {},
};


export const NewPatientForm = ({ onClose }: { onClose: (wasSubmitted: boolean) => void }) => {
    const [currentStep, setCurrentStep] = React.useState(1);
    const [formData, setFormData] = React.useState(initialFormData);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    
    const validateStep = () => {
        if (currentStep === 1) {
            const { firstName, lastName, age, phone } = formData;
            if (!firstName || !lastName || !age || !phone) {
                toast({
                    variant: "destructive",
                    title: "Campos Incompletos",
                    description: "Por favor, llena los campos obligatorios de Nombre, Apellido, Edad y Teléfono.",
                });
                return false;
            }
        }
        if (currentStep === 3) {
             if (!formData.medicalDiagnosis) {
                toast({
                    variant: "destructive",
                    title: "Diagnóstico Requerido",
                    description: "Por favor, proporciona un diagnóstico médico.",
                });
                return false;
            }
        }
        return true;
    }

    const handleSubmit = async () => {
        if (!validateStep()) return;
        
        setIsLoading(true);
        const { error } = await addPatient(formData);
        setIsLoading(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: error,
            });
        } else {
            toast({
                title: "Paciente Guardado",
                description: `${formData.firstName} ${formData.lastName} ha sido guardado exitosamente.`,
            });
            onClose(true);
        }
    };

    const progress = (currentStep / totalSteps) * 100;
    
    const steps = [
        "Información Personal",
        "Antecedentes Médicos",
        "Signos Vitales y Diagnóstico",
        "Odontograma"
    ];


    return (
        <Dialog open onOpenChange={() => onClose(false)}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
                    <DialogDescription>
                        Sigue los pasos para registrar toda la información del paciente.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-primary">Paso {currentStep} de {totalSteps}</span>
                             <span className="text-sm text-muted-foreground">{steps[currentStep - 1]}</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                    </div>

                    <div className="min-h-[350px]">
                        {currentStep === 1 && <Step1PersonalInfo formData={formData} setFormData={setFormData} />}
                        {currentStep === 2 && <Step2MedicalHistory formData={formData} setFormData={setFormData} />}
                        {currentStep === 3 && <Step3VitalSigns formData={formData} setFormData={setFormData} />}
                        {currentStep === 4 && <Step4Odontogram formData={formData} setFormData={setFormData} />}
                    </div>
                </div>

                <DialogFooter className="justify-between">
                    <div>
                        {currentStep > 1 && (
                            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                                Anterior
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" onClick={() => onClose(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        {currentStep < totalSteps && (
                            <Button onClick={handleNext} disabled={isLoading}>
                                Siguiente
                            </Button>
                        )}
                        {currentStep === totalSteps && (
                            <Button onClick={handleSubmit} disabled={isLoading}>
                                {isLoading ? 'Guardando...' : 'Guardar Paciente'}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
