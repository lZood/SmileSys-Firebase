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
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
    const isMobile = useIsMobile();

    const handleNext = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    
    const validateStep = () => {
        if (currentStep === 1) {
            const { firstName, lastName, age, phone, email } = formData;
            if (!firstName || !lastName || !age || !phone || !email) {
                toast({
                    variant: "destructive",
                    title: "Campos Incompletos",
                    description: "Por favor, llena los campos obligatorios de Nombre, Apellido, Edad, Teléfono y Email.",
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
        'Información Personal',
        'Antecedentes Médicos',
        'Signos Vitales y Diagnóstico',
        'Odontograma'
    ];


    return (
        <Dialog open onOpenChange={() => onClose(false)}>
            <DialogContent className={cn('sm:max-w-4xl', isMobile && 'p-0 max-w-[100vw] w-[100vw] h-[100dvh] sm:h-[100dvh] flex flex-col')}>
                <DialogHeader className={cn(isMobile && 'px-4 pt-4 pb-2 border-b')}>                   
                    <DialogTitle className={cn(isMobile && 'text-lg')}>{isMobile ? 'Nuevo Paciente' : 'Agregar Nuevo Paciente'}</DialogTitle>
                    {!isMobile && (
                        <DialogDescription>
                            Sigue los pasos para registrar toda la información del paciente.
                        </DialogDescription>
                    )}
                </DialogHeader>
                {isMobile ? (
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* Mobile progress + step label */}
                        <div className="px-4 pt-2 pb-3 space-y-2">
                            <div className="flex items-center justify-between text-xs font-medium">
                                <span>Paso {currentStep}/{totalSteps}</span>
                                <span className="text-muted-foreground truncate max-w-[55%]">{steps[currentStep-1]}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                        {/* Step body scrollable */}
                        <div className="flex-1 overflow-y-auto px-4 pb-28">
                            <div className="space-y-6">
                                {currentStep === 1 && <Step1PersonalInfo formData={formData} setFormData={setFormData} />}
                                {currentStep === 2 && <Step2MedicalHistory formData={formData} setFormData={setFormData} />}
                                {currentStep === 3 && <Step3VitalSigns formData={formData} setFormData={setFormData} />}
                                {currentStep === 4 && <Step4Odontogram formData={formData} setFormData={setFormData} compact />}
                            </div>
                        </div>
                        {/* Bottom nav */}
                        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t p-3 flex items-center justify-between gap-2">
                            <Button variant="outline" size="sm" onClick={() => onClose(false)} disabled={isLoading} className="flex-1">Cancelar</Button>
                            <div className="flex-1 flex gap-2">
                                {currentStep > 1 && (
                                    <Button variant="secondary" size="sm" onClick={handleBack} disabled={isLoading} className="flex-1">Atrás</Button>
                                )}
                                {currentStep < totalSteps && (
                                    <Button size="sm" onClick={handleNext} disabled={isLoading} className="flex-1">Siguiente</Button>
                                )}
                                {currentStep === totalSteps && (
                                    <Button size="sm" onClick={handleSubmit} disabled={isLoading} className="flex-1">{isLoading ? 'Guardando...' : 'Guardar'}</Button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Desktop original layout
                    <>
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
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
