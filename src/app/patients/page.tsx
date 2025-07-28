
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
    Trash2 
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
import { patients as initialPatients, Patient } from "@/lib/data";
import { cn } from '@/lib/utils';
import { NewPatientForm } from '@/components/new-patient-form';

type PatientStatus = 'Active' | 'Inactive' | 'Pending' | 'Archived';

const statusStyles: Record<PatientStatus, string> = {
    Active: "bg-green-100 text-green-800 border-green-200",
    Inactive: "bg-gray-100 text-gray-800 border-gray-200",
    Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Archived: "bg-red-100 text-red-800 border-red-200",
};


export default function PatientsPage() {
    const [patients, setPatients] = React.useState<(Patient & { status: PatientStatus })[]>(() => 
        initialPatients.map((p, i) => ({
            ...p,
            status: i % 4 === 0 ? 'Pending' : i % 4 === 1 ? 'Active' : i % 4 === 2 ? 'Inactive' : 'Archived'
        }))
    );
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = React.useState(false);

    const filteredPatients = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        placeholder="Buscar pacientes..." 
                        className="pl-8" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Filtros</span>
                </Button>
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
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <div>{patient.name}</div>
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
                    <Badge variant="outline" className={cn("capitalize", statusStyles[patient.status])}>
                      {patient.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600">
                            <Calendar className="h-4 w-4" />
                             <span className="sr-only">Appointments</span>
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-500 hover:text-purple-600">
                            <FileText className="h-4 w-4" />
                             <span className="sr-only">Payments</span>
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500 hover:text-indigo-600">
                            <FilePlus className="h-4 w-4" />
                             <span className="sr-only">Consent</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600">
                            <UserCog className="h-4 w-4" />
                             <span className="sr-only">Change Status</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
