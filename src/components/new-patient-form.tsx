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
import { addPatient, addTemporaryPatient, completePendingPatient } from '@/app/patients/actions';
import { Clock, UserPlus } from 'lucide-react';
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


type NewPatientMode = 'create' | 'complete';
type OnSubmitAction = (data: any) => Promise<{ error: string | null } | { error?: string | null }>;

export const NewPatientForm = ({
    onClose,
    allowedModes = 'all',
    mode = 'create',
    patientId,
    initialData,
    onSubmitAction,
}: {
    onClose: (wasSubmitted: boolean) => void;
    allowedModes?: 'all' | 'temporary-only';
    mode?: NewPatientMode;
    patientId?: string;
    initialData?: Partial<typeof initialFormData>;
    onSubmitAction?: OnSubmitAction;
}) => {
    const [patientType, setPatientType] = React.useState<'full' | 'temp' | null>(mode === 'complete' ? 'full' : null);
    const [currentStep, setCurrentStep] = React.useState(1);
    const [formData, setFormData] = React.useState({ ...initialFormData, ...(initialData || {}) });
    const [tempForm, setTempForm] = React.useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    // Sync incoming initialData (e.g., when opening in complete mode and data arrives async)
    React.useEffect(() => {
        if (mode === 'complete' && initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, initialData]);

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
        let error: string | null = null;
        if (mode === 'complete') {
            if (onSubmitAction) {
                const res = await onSubmitAction(formData);
                error = (res as any)?.error || null;
            } else if (patientId) {
                const res = await completePendingPatient(patientId, formData);
                error = (res as any)?.error || null;
            } else {
                error = 'Falta patientId para completar.';
            }
        } else {
            const res = await addPatient(formData);
            error = (res as any)?.error || null;
        }
        setIsLoading(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: error,
            });
        } else {
            toast({
                title: mode === 'complete' ? 'Paciente Completado' : 'Paciente Guardado',
                description: `${formData.firstName} ${formData.lastName} ${mode === 'complete' ? 'ha sido completado' : 'ha sido guardado'} exitosamente.`,
            });
            onClose(true);
        }
    };

    const handleTempSubmit = async () => {
        if (!tempForm.firstName || !tempForm.lastName) {
            toast({ variant: 'destructive', title: 'Datos requeridos', description: 'Nombre y Apellidos son obligatorios.' });
            return;
        }
        setIsLoading(true);
        const { error } = await addTemporaryPatient({ firstName: tempForm.firstName, lastName: tempForm.lastName, email: tempForm.email || undefined, phone: tempForm.phone || undefined });
        setIsLoading(false);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
            toast({ title: 'Paciente Temporal', description: `${tempForm.firstName} ${tempForm.lastName} creado como pendiente.` });
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
                    <DialogTitle className={cn(isMobile && 'text-lg')}>
                        {mode === 'complete' ? 'Completar Paciente' : (
                            <>
                                {patientType === null && 'Selecciona Tipo de Paciente'}
                                {patientType === 'full' && (isMobile ? 'Nuevo Paciente' : 'Agregar Nuevo Paciente')}
                                {patientType === 'temp' && 'Nuevo Paciente Temporal'}
                            </>
                        )}
                    </DialogTitle>
                    {patientType === 'full' && !isMobile && mode !== 'complete' && (
                        <DialogDescription>
                            Sigue los pasos para registrar toda la información del paciente.
                        </DialogDescription>
                    )}
                    {patientType === 'temp' && !isMobile && (
                        <DialogDescription>
                            Registra rápidamente un paciente temporal (pendiente) con datos mínimos. Podrás completarlo después.
                        </DialogDescription>
                    )}
                </DialogHeader>
                {patientType === null && mode !== 'complete' && (
                    <div className={cn('p-6 grid gap-6', isMobile && 'flex-1 overflow-y-auto')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <button
                                onClick={() => { if (allowedModes !== 'temporary-only') setPatientType('full'); }}
                                disabled={allowedModes === 'temporary-only'}
                                className={cn(
                                    'group rounded-xl border border-indigo-200 dark:border-indigo-800 p-6 text-left bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30 hover:shadow-md transition hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                                    allowedModes === 'temporary-only' && 'opacity-50 cursor-not-allowed hover:shadow-none hover:border-indigo-200'
                                )}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <UserPlus className="h-6 w-6 text-indigo-600" />
                                    <h3 className="font-semibold text-indigo-700 dark:text-indigo-300">Paciente Completo</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">Captura todas las secciones: datos personales, antecedentes, signos vitales y odontograma.</p>
                                {allowedModes === 'temporary-only' && (
                                    <p className="mt-2 text-xs text-muted-foreground">No disponible para tu rol.</p>
                                )}
                            </button>
                            <button onClick={() => setPatientType('temp')} className="group rounded-xl border border-amber-200 dark:border-amber-800 p-6 text-left bg-gradient-to-br from-white to-amber-50 dark:from-slate-900 dark:to-amber-950/30 hover:shadow-md transition hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500">
                                <div className="flex items-center gap-3 mb-3">
                                    <Clock className="h-6 w-6 text-amber-600" />
                                    <h3 className="font-semibold text-amber-700 dark:text-amber-300">Paciente Temporal</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">Solo nombre, apellidos y opcional email/teléfono. Estado inicial: Pending.</p>
                            </button>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => onClose(false)}>Cerrar</Button>
                        </div>
                    </div>
                )}
                {patientType === 'temp' && mode !== 'complete' && (
                    <div className={cn('p-6 space-y-6', isMobile && 'flex-1 overflow-y-auto')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Nombre *</label>
                                <input className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={tempForm.firstName} onChange={e => setTempForm(f => ({ ...f, firstName: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Apellidos *</label>
                                <input className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={tempForm.lastName} onChange={e => setTempForm(f => ({ ...f, lastName: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Email</label>
                                <input className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={tempForm.email} onChange={e => setTempForm(f => ({ ...f, email: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium">Teléfono</label>
                                <input className="w-full rounded-md border px-3 py-2 text-sm bg-background" value={tempForm.phone} onChange={e => setTempForm(f => ({ ...f, phone: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Button variant="outline" onClick={() => setPatientType(null)} disabled={isLoading}>Volver</Button>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => onClose(false)} disabled={isLoading}>Cancelar</Button>
                                <Button onClick={handleTempSubmit} disabled={isLoading}>{isLoading ? 'Creando...' : 'Crear Temporal'}</Button>
                            </div>
                        </div>
                    </div>
                )}
                {patientType === 'full' && (
                    <>
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
                                    {mode !== 'complete' && (
                                        <Button variant="outline" size="sm" onClick={() => setPatientType(null)} disabled={isLoading} className="flex-1">Tipo</Button>
                                    )}
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
                                    <div className="flex gap-2">
                                        {mode !== 'complete' && (
                                            <Button variant="outline" onClick={() => setPatientType(null)} disabled={isLoading}>Tipo</Button>
                                        )}
                                        {currentStep > 1 && (
                                            <Button variant="outline" onClick={handleBack} disabled={isLoading}>Anterior</Button>
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
                                                {isLoading ? 'Guardando...' : (mode === 'complete' ? 'Completar Paciente' : 'Guardar Paciente')}
                                            </Button>
                                        )}
                                    </div>
                                </DialogFooter>
                            </>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
