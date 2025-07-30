
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClinicsWithAdmin, ClinicWithAdmin } from './actions';
import { PlusCircle, Building, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InviteClinicForm } from '@/components/admin/invite-clinic-form';

export default function AdminDashboardPage() {
    const { toast } = useToast();
    const [clinics, setClinics] = React.useState<ClinicWithAdmin[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);

    React.useEffect(() => {
        async function loadClinics() {
            setIsLoading(true);
            const { data, error } = await getClinicsWithAdmin();
            if (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error al Cargar Clínicas',
                    description: error,
                });
            } else {
                setClinics(data || []);
            }
            setIsLoading(false);
        }
        loadClinics();
    }, [toast]);

    const handleInvitationSent = () => {
        // Refresh the list of clinics after a new one is invited
        async function refreshClinics() {
            const { data, error } = await getClinicsWithAdmin();
            if (!error) {
                setClinics(data || []);
            }
        }
        refreshClinics();
    };
    
    const totalClinics = clinics.length;
    const activeSubscriptions = clinics.filter(c => c.subscription_status === 'active').length;

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
            {isInviteModalOpen && (
                <InviteClinicForm 
                    isOpen={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    onInvitationSent={handleInvitationSent}
                />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Panel de Super-Admin</h1>
                    <p className="text-muted-foreground">Gestiona todas las clínicas y suscripciones del sistema.</p>
                </div>
                 <Button onClick={() => setIsInviteModalOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Invitar Nueva Clínica
                </Button>
            </div>
            
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Clínicas</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClinics}</div>
                        <p className="text-xs text-muted-foreground">Clínicas registradas en el sistema.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubscriptions}</div>
                        <p className="text-xs text-muted-foreground">Actualmente con un plan activo.</p>
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Clínicas Registradas</CardTitle>
                    <CardDescription>Una lista de todas las clínicas en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre de la Clínica</TableHead>
                                <TableHead>Administrador</TableHead>
                                <TableHead>Estado de Suscripción</TableHead>
                                <TableHead>Fecha de Registro</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Cargando clínicas...
                                    </TableCell>
                                </TableRow>
                            ) : clinics.length > 0 ? (
                                clinics.map((clinic) => (
                                    <TableRow key={clinic.id}>
                                        <TableCell className="font-medium">{clinic.name}</TableCell>
                                        <TableCell>{clinic.adminEmail || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={clinic.subscription_status === 'active' ? 'default' : 'secondary'}>
                                                {clinic.subscription_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{new Date(clinic.created_at).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No se encontraron clínicas. Invita a la primera.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
