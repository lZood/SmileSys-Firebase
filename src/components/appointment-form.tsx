
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

type Patient = { id: string; first_name: string; last_name: string };
type Doctor = { id: string; first_name: string; last_name: string; roles: string[] };


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
    const [patientId, setPatientId] = React.useState(existingAppointment?.patientId || '');
    const [doctorId, setDoctorId] = React.useState(existingAppointment?.doctorId || '');
    
    // Ensure time is always in HH:mm format for the input
    const initialTime = existingAppointment?.time ? existingAppointment.time.substring(0, 5) : '10:00';
    const [time, setTime] = React.useState(initialTime);

    const [service, setService] = React.useState(existingAppointment?.service || '');

    const patientOptions = patients.map(p => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }));
    const doctorOptions = doctors
        .filter(d => d.roles.includes('doctor'))
        .map(d => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }));

    const handleSubmit = async () => {
        if (!patientId || !doctorId || !time || !service) {
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
            service_description: service,
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
                            <Input id="service" value={service} onChange={e => setService(e.target.value)} placeholder="e.g. Check-up" />
                        </div>
                    </div>
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
