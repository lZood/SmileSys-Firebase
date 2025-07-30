
'use client';

import * as React from 'react';
import { 
    PlusCircle, 
    Search, 
    SlidersHorizontal, 
    Eye, 
    Calendar, 
    FileText, 
    FilePlus, 
    UserCog, 
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

// This type will eventually come from Supabase generated types
export type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Archived';
};


type PatientStatus = 'Active' | 'Inactive' | 'Pending' | 'Archived';

const statusStyles: Record<PatientStatus, string> = {
    Active: "bg-green-100 text-green-800 border-green-200",
    Inactive: "bg-gray-100 text-gray-800 border-gray-200",
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Archived: "bg-red-100 text-red-800 border-red-200",
};


export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = React.useState<Patient[]>([]); // Data will be fetched from Supabase
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<PatientStatus | 'all'>('all');

    // TODO: Fetch patients from Supabase based on clinic_id

    const handleStatusFilterChange = (status: PatientStatus | 'all') => {
        setStatusFilter(status === statusFilter ? 'all' : status);
    };

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

  return (
    <DashboardLayout>

        {isNewPatientModalOpen && <NewPatientForm onClose={() => setIsNewPatientModalOpen(false)} />}

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <CardTitle>Pacientes</CardTitle>
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
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Pending'} onSelect={() => setStatusFilter('Pending')}>Pendiente</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Archived'} onSelect={() => setStatusFilter('Archived')}>Archivado</DropdownMenuCheckboxItem>
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
                <TableHead className="hidden lg:table-cell">Última Visita</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <div className="hover:underline cursor-pointer" onClick={() => router.push(`/patients/${patient.id}`)}>{patient.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {patient.id}</div>
                  </TableCell>
                   <TableCell className="hidden lg:table-cell">{patient.email}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {patient.phone}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {patient.lastVisit}
                  </TableCell>
                   <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusStyles[patient.status as PatientStatus])}>
                      {patient.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
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
                         <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" /> Citas
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Pagos
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                             <FilePlus className="mr-2 h-4 w-4" /> Consentimiento
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                             <UserCog className="mr-2 h-4 w-4" /> Cambiar Estado
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                             <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
