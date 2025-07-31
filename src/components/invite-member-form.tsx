

'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { inviteMember } from '@/app/settings/actions';

export const InviteMemberForm = ({ clinicId, onClose }: { clinicId: string; onClose: (wasSubmitted: boolean) => void }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        jobTitle: '',
        email: '',
        password: '',
        role: '' as 'admin' | 'doctor' | 'staff',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };
    
    const handleSelectChange = (value: 'admin' | 'doctor' | 'staff') => {
        setFormData({ ...formData, role: value });
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        const result = await inviteMember({ ...formData, clinicId });
        setIsLoading(false);

        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error al invitar miembro',
                description: result.error,
            });
        } else {
            toast({
                title: 'Miembro Invitado',
                description: `${formData.firstName} ha sido añadido a tu clínica.`,
            });
            onClose(true);
        }
    };

    return (
        <Dialog open onOpenChange={() => onClose(false)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                    <DialogDescription>
                        Crea una cuenta para un nuevo miembro del equipo. Podrán iniciar sesión con el email y contraseña que definas.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">Nombre(s)</Label>
                            <Input id="firstName" value={formData.firstName} onChange={handleChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Apellido(s)</Label>
                            <Input id="lastName" value={formData.lastName} onChange={handleChange} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="jobTitle">Puesto en la Clínica</Label>
                        <Input id="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="Ej. Dentista, Asistente, Recepcionista"/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña Temporal</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleChange} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="role">Rol en la Aplicación</Label>
                        <Select onValueChange={handleSelectChange} value={formData.role}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="staff">Staff (Acceso Básico)</SelectItem>
                                <SelectItem value="doctor">Doctor (Gestión de Pacientes/Citas)</SelectItem>
                                <SelectItem value="admin">Admin (Acceso Total)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Creando...' : 'Crear y Añadir Miembro'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
