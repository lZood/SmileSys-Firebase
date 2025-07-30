
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getClinicsWithAdmin, ClinicWithAdmin, deleteClinicFlow } from './actions';
import { PlusCircle, Building, Users, MoreHorizontal, Eye, UserCog, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InviteClinicForm } from '@/components/admin/invite-clinic-form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DeleteClinicDialog } from '@/components/admin/delete-clinic-dialog';

export default function AdminDashboardPage() {
    const { toast } = useToast();
    const [clinics, setClinics] = React.useState<ClinicWithAdmin[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [selectedClinic, setSelectedClinic] = React.useState<ClinicWithAdmin | null>(null);

    const loadClinics = React.useCallback(async () => {
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
    }, [toast]);

    React.useEffect(() => {
        loadClinics();
    }, [loadClinics]);

    const handleInvitationSent = () => {
        loadClinics(); // Refresh the list
    };

    const openDeleteDialog = (clinic: ClinicWithAdmin) => {
        setSelectedClinic(clinic);
        setIsDeleteModalOpen(true);
    }
    
    const handleDeleteClinic = async () => {
        if (!selectedClinic) return;

        const { error } = await deleteClinicFlow(selectedClinic.id);

        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error al Eliminar Clínica',
                description: error,
            });
        } else {
            toast({
                title: 'Clínica Eliminada',
                description: `La clínica "${selectedClinic.name}" y todos sus datos han sido eliminados.`,
            });
            loadClinics(); // Refresh the list
        }
        setIsDeleteModalOpen(false);
        setSelectedClinic(null);
    }
    
    const totalClinics = clinics.length;
    const activeSubscriptions = clinics.filter(c => c.subscription_status === 'active').length;

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
            <InviteClinicForm 
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInvitationSent={handleInvitationSent}
            />
            
             <DeleteClinicDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteClinic}
                clinicName={selectedClinic?.name || ''}
            />


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
                                <TableHead>Estado</TableHead>
                                <TableHead>Registro</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
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
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver Detalles
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <UserCog className="mr-2 h-4 w-4" />
                                                        Gestionar Usuarios
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600"
                                                        onClick={() => openDeleteDialog(clinic)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar Clínica
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
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
