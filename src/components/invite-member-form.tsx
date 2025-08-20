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
import { useToast } from '@/hooks/use-toast';
import { inviteMember } from '@/app/settings/actions';
import { Checkbox } from './ui/checkbox';

export const InviteMemberForm = ({ clinicId, onClose }: { clinicId: string; onClose: (wasSubmitted: boolean) => void }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        jobTitle: '',
        email: '',
        roles: [] as string[],
    });
    
    const allRoles = ['admin', 'doctor', 'staff'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };
    
    const handleRoleChange = (role: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            roles: checked ? [...prev.roles, role] : prev.roles.filter((r: string) => r !== role)
        }));
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
            // Show invitation sent message; if email wasn't sent, inform admin to notify user manually
            if ((result as any).emailSent) {
                toast({
                    title: 'Invitación enviada',
                    description: `Se ha enviado un correo a ${formData.email} para que cree su contraseña. Aparecerá como pendiente hasta que confirme su cuenta.`,
                });
            } else {
                toast({
                    title: 'Invitación creada',
                    description: `${formData.firstName} ha sido añadido y aparece como pendiente. No se pudo enviar el correo automáticamente, por favor comparte el enlace de activación manualmente.`,
                });
            }
            onClose(true);
        }
    };

    return (
        <Dialog open onOpenChange={() => onClose(false)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                    <DialogDescription>
                        Se enviará un correo al usuario para que establezca su propia contraseña al activar la cuenta.
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
                        <Label>Roles en la Aplicación</Label>
                        <div className="flex flex-col space-y-2">
                            {allRoles.map(role => (
                                <div key={role} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`role-${role}`}
                                        checked={formData.roles.includes(role)}
                                        onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                                    />
                                    <Label htmlFor={`role-${role}`} className="capitalize font-normal">{role}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onClose(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Creando...' : 'Crear y Enviar Invitación'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
