
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { inviteClinicFlow } from '@/app/admin/actions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

type InviteClinicFormProps = {
    isOpen: boolean;
    onClose: () => void;
    onInvitationSent: () => void;
};

export function InviteClinicForm({ isOpen, onClose, onInvitationSent }: InviteClinicFormProps) {
    const { toast } = useToast();
    const [clinicName, setClinicName] = React.useState('');
    const [adminEmail, setAdminEmail] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clinicName || !adminEmail) {
            toast({
                variant: 'destructive',
                title: 'Campos Incompletos',
                description: 'Por favor, complete todos los campos para invitar a una nueva clínica.',
            });
            return;
        }

        setIsSubmitting(true);
        const { error } = await inviteClinicFlow({ clinicName, adminEmail });
        setIsSubmitting(false);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error al Invitar Clínica',
                description: error,
            });
        } else {
            toast({
                title: 'Invitación Enviada',
                description: `Se ha enviado una invitación a ${adminEmail} para la clínica ${clinicName}.`,
            });
            setClinicName('');
            setAdminEmail('');
            onInvitationSent();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invitar Nueva Clínica</DialogTitle>
                    <DialogDescription>
                        Completa los siguientes datos para registrar una nueva clínica y enviar una invitación a su administrador.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="clinicName">Nombre de la Clínica</Label>
                        <Input
                            id="clinicName"
                            placeholder="Ej. Dental Total"
                            value={clinicName}
                            onChange={(e) => setClinicName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email del Administrador</Label>
                        <Input
                            id="adminEmail"
                            type="email"
                            placeholder="doctor@dentaltotal.com"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando Invitación...' : 'Invitar y Crear Clínica'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
