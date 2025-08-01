
'use client';

import * as React from 'react';
import { 
    PlusCircle, 
    Search, 
    SlidersHorizontal, 
    Eye, 
    Calendar, 
    FileText, 
    Trash2,
    MoreHorizontal
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { NewPatientForm } from '@/components/new-patient-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { deletePatient, getPatients } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  status: string;
};

const statusStyles: Record<string, string> = {
    Active: "bg-green-100 text-green-800 border-green-200",
    Inactive: "bg-gray-100 text-gray-800 border-gray-200",
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Archived: "bg-red-100 text-red-800 border-red-200",
};

export default function PatientsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [patients, setPatients] = React.useState<Patient[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<string>('all');

    const fetchPatients = React.useCallback(async () => {
        setIsLoading(true);
        const fetchedPatients = await getPatients();
        setPatients(fetchedPatients as Patient[]);
        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handleFormClose = (wasSubmitted: boolean) => {
        setIsNewPatientModalOpen(false);
        if (wasSubmitted) {
            fetchPatients();
        }
    };

    const handleDelete = async (patientId: string) => {
        const { error } = await deletePatient(patientId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
            toast({ title: 'Paciente Eliminado', description: 'El paciente ha sido eliminado exitosamente.' });
            fetchPatients(); // Refetch patients after deletion
        }
    };

    const filteredPatients = patients.filter(patient => {
        const fullName = `${patient.first_name} ${patient.last_name}`;
        const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

  return (
    <DashboardLayout>
        {isNewPatientModalOpen && <NewPatientForm onClose={handleFormClose} />}

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <CardTitle>Pacientes</CardTitle>
                    <CardDescription>Gestiona la lista de pacientes de tu clínica.</CardDescription>
                </div>
                <div className="flex-1 flex justify-end">
                     <Button size="sm" className="h-9 gap-2" onClick={() => setIsNewPatientModalOpen(true)}>
                        <PlusCircle className="h-4 w-4" />
                        <span className="hidden sm:inline-block">Agregar Paciente</span>
                    </Button>
                </div>
            </div>
             <div className="flex items-center justify-between gap-4 mt-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Buscar pacientes por nombre o email..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline-block">Filtros</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={statusFilter === 'all'} onSelect={() => setStatusFilter('all')}>Todos</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Active'} onSelect={() => setStatusFilter('Active')}>Activo</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Inactive'} onSelect={() => setStatusFilter('Inactive')}>Inactivo</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha de Registro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando pacientes...</TableCell></TableRow>
              ) : filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <div className="hover:underline cursor-pointer" onClick={() => router.push(`/patients/${patient.id}`)}>{patient.first_name} {patient.last_name}</div>
                    <div className="text-xs text-muted-foreground">ID: {patient.id.substring(0,8)}</div>
                  </TableCell>
                   <TableCell className="hidden lg:table-cell">{patient.email || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {patient.phone || 'N/A'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {new Date(patient.created_at.replace(/-/g, '/')).toLocaleDateString('es-MX')}
                  </TableCell>
                   <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusStyles[patient.status as keyof typeof statusStyles])}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/patients/${patient.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/appointments?patient_id=${patient.id}`)}>
                                <Calendar className="mr-2 h-4 w-4" /> Citas
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/patients/${patient.id}?tab=billing`)}>
                                <FileText className="mr-2 h-4 w-4" /> Pagos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente al paciente y todos sus datos asociados.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(patient.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No se encontraron pacientes. Agrega tu primer paciente para empezar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
