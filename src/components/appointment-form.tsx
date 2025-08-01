
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import type { Appointment } from '@/app/appointments/page';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type Patient = { id: string; first_name: string; last_name: string };
type Doctor = { id: string; first_name: string; last_name: string; roles: string[] };

const commonServices = [
    'Consulta / Revisión',
    'Limpieza Dental',
    'Blanqueamiento Dental',
    'Relleno de Caries (Restauración)',
    'Extracción Dental',
    'Tratamiento de Conducto (Endodoncia)',
    'Corona Dental',
    'Ortodoncia (Ajuste)',
];
const OTHER_SERVICE = 'Otro';


export const AppointmentForm = ({
  isOpen, 
  onClose, 
  selectedDate, 
  onSubmit,
  existingAppointment,
  patients,
  doctors
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  selectedDate: Date, 
  onSubmit: (data: any) => Promise<void>,
  existingAppointment?: Appointment | null,
  patients: Patient[],
  doctors: Doctor[],
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [patientId, setPatientId] = React.useState('');
    const [doctorId, setDoctorId] = React.useState('');
    const [time, setTime] = React.useState('10:00');
    
    // State for the service dropdown and the custom service input
    const [service, setService] = React.useState('');
    const [customService, setCustomService] = React.useState('');

    React.useEffect(() => {
        if (existingAppointment) {
            setPatientId(existingAppointment.patientId);
            setDoctorId(existingAppointment.doctorId);
            setTime(existingAppointment.time ? existingAppointment.time.substring(0, 5) : '10:00');

            // Logic to set service state when editing
            const existingService = existingAppointment.service;
            if (commonServices.includes(existingService)) {
                setService(existingService);
                setCustomService('');
            } else {
                setService(OTHER_SERVICE);
                setCustomService(existingService);
            }
        } else {
            // Reset fields for new appointment
             setPatientId('');
             setDoctorId('');
             setTime('10:00');
             setService('');
             setCustomService('');
        }
    }, [existingAppointment, isOpen]);


    const patientOptions = patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }));
    const doctorOptions = doctors
        .filter(d => d.roles.includes('doctor'))
        .map(d => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }));

    const handleSubmit = async () => {
        const finalService = service === OTHER_SERVICE ? customService : service;

        if (!patientId || !doctorId || !time || !finalService) {
            toast({
                variant: "destructive",
                title: "Campos Incompletos",
                description: "Por favor, complete todos los campos para guardar la cita.",
            });
            return;
        }
        setIsLoading(true);
        
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        
        const data = {
            id: existingAppointment?.id,
            patient_id: patientId,
            doctor_id: doctorId,
            service_description: finalService,
            appointment_date: dateString,
            appointment_time: time,
            status: existingAppointment?.status || 'Scheduled',
        };

        await onSubmit(data);
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{existingAppointment ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
                    <DialogDescription>
                        {existingAppointment ? 'Editando' : 'Agendando'} cita para el {format(selectedDate, 'd \'de\' MMMM \'de\' yyyy', { locale: es })}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid gap-2">
                        <Label htmlFor="patient-name">Nombre del Paciente</Label>
                        <Combobox 
                            options={patientOptions}
                            value={patientId}
                            onChange={setPatientId}
                            placeholder="Seleccionar paciente..."
                            emptyMessage="No se encontraron pacientes."
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="time">Hora</Label>
                            <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="service">Servicio</Label>
                            <Select value={service} onValueChange={setService}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar servicio..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {commonServices.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    <SelectItem value={OTHER_SERVICE}>{OTHER_SERVICE}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {service === OTHER_SERVICE && (
                        <div className="grid gap-2">
                            <Label htmlFor="customService">Especificar Otro Servicio</Label>
                            <Input 
                                id="customService" 
                                value={customService} 
                                onChange={e => setCustomService(e.target.value)} 
                                placeholder="Ej. Implante unitario"
                            />
                        </div>
                    )}

                     <div className="grid gap-2">
                        <Label htmlFor="doctor">Doctor</Label>
                         <Combobox 
                            options={doctorOptions}
                            value={doctorId}
                            onChange={setDoctorId}
                            placeholder="Seleccionar doctor..."
                            emptyMessage="No se encontraron doctores."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? (existingAppointment ? 'Guardando...' : 'Creando...') : (existingAppointment ? 'Guardar Cambios' : 'Crear Cita')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
