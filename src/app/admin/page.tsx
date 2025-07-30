
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { inviteClinicFlow } from './actions';

export default function AdminPage() {
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
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Panel de Super-Admin</CardTitle>
                    <CardDescription>Invita a nuevas clínicas a unirse a SmileSys.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando Invitación...' : 'Invitar Nueva Clínica'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
