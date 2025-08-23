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
    MoreHorizontal,
    Users
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
import { CreateQuoteModal } from '@/components/create-quote-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { deletePatient, getPatients, getPatientsPaginated } from './actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { addTemporaryPatient, updatePatientStatus, completePendingPatient, getPatientById } from './actions';
import { useUserData } from '@/context/UserDataProvider';

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
  const { userData } = useUserData();
    const [patients, setPatients] = React.useState<Patient[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = React.useState(false);
    const [statusFilter, setStatusFilter] = React.useState<string>('all');
    const [totalCount, setTotalCount] = React.useState<number>(0);
    const PAGE_SIZE = 12;
    const [offset, setOffset] = React.useState<number>(0);
    const [showQuickAdd, setShowQuickAdd] = React.useState(false);
    const [tempFirst, setTempFirst] = React.useState('');
    const [tempLast, setTempLast] = React.useState('');
    const [tempEmail, setTempEmail] = React.useState('');
    const [tempPhone, setTempPhone] = React.useState('');
    const [isQuoteModalOpen, setIsQuoteModalOpen] = React.useState(false);
    const [quotePatientId, setQuotePatientId] = React.useState<string | null>(null);
    const [completeId, setCompleteId] = React.useState<string | null>(null);
    const [completeInitial, setCompleteInitial] = React.useState<any>(null);
    const [isCompleting, setIsCompleting] = React.useState(false);

  const fetchPatients = React.useCallback(async (reset = false) => {
    setIsLoading(true);
    const { items, total }: any = await getPatientsPaginated({ limit: PAGE_SIZE, offset: reset ? 0 : offset, searchTerm, status: statusFilter });
    setTotalCount(total || 0);
    if (reset) {
      setPatients(items as Patient[]);
      setOffset(items.length);
    } else {
      setPatients(prev => [...prev, ...(items as Patient[])]);
      setOffset(prev => prev + (items?.length || 0));
    }
    setIsLoading(false);
  }, [offset, searchTerm, statusFilter]);

  React.useEffect(() => {
    // initial load
    fetchPatients(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When search/status changes, reset list and reload from start
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setOffset(0);
      fetchPatients(true);
    }, 300);
    return () => clearTimeout(timeout);
    // Intentionally omit fetchPatients (changes when offset updates) to avoid unwanted resets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

    const handleFormClose = (wasSubmitted: boolean) => {
        setIsNewPatientModalOpen(false);
    if (wasSubmitted) {
      fetchPatients(true);
        }
    };

    const handleDelete = async (patientId: string) => {
        const { error } = await deletePatient(patientId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
            toast({ title: 'Paciente Eliminado', description: 'El paciente ha sido eliminado exitosamente.' });
            fetchPatients(true); // Refetch patients after deletion
        }
    };

    const handleQuickAdd = async () => {
        if (!tempFirst || !tempLast) {
            toast({ variant: 'destructive', title: 'Faltan datos', description: 'Nombre y Apellidos requeridos.' });
            return;
        }
        const { error } = await addTemporaryPatient({ firstName: tempFirst, lastName: tempLast, email: tempEmail || undefined, phone: tempPhone || undefined });
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
            toast({ title: 'Paciente Temporal', description: 'Paciente temporal creado.' });
            setTempFirst(''); setTempLast(''); setTempEmail(''); setTempPhone('');
            fetchPatients(true);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        const { error } = await updatePatientStatus(id, status);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: error });
        } else {
            toast({ title: 'Estado actualizado', description: `Nuevo estado: ${status}` });
            fetchPatients(true);
        }
    };

  const filteredPatients = patients; // server-side filters applied
  const canLoadMore = patients.length < totalCount;

  const roles = (userData?.profile?.roles as string[] | undefined) || [];
  const isStaffOnly = roles.includes('staff') && !roles.includes('admin') && !roles.includes('doctor');

  return (
    <DashboardLayout>
        {isNewPatientModalOpen && <NewPatientForm onClose={handleFormClose} allowedModes={isStaffOnly ? 'temporary-only' : 'all'} />}
        {isQuoteModalOpen && quotePatientId && (
          <CreateQuoteModal
            isOpen={isQuoteModalOpen}
            onClose={() => { setIsQuoteModalOpen(false); setQuotePatientId(null); }}
            onQuoteCreated={() => { /* optional refresh */ }}
            patients={patients as any}
            clinic={null as any}
            preselectedPatientId={quotePatientId}
          />
        )}
        {/* Simple complete pending flow: reuse NewPatientForm full path by forcing type and submit to server action */}
        {completeId && (
          <NewPatientForm
            mode="complete"
            patientId={completeId}
            initialData={completeInitial || undefined}
            onSubmitAction={async (data) => completePendingPatient(completeId, data)}
            onClose={async (submitted) => {
              setCompleteId(null);
              setCompleteInitial(null);
              if (submitted) await fetchPatients(true);
            }}
            allowedModes={isStaffOnly ? 'temporary-only' : 'all'}
          />
        )}

      <Card className="bg-gradient-to-br from-indigo-50/60 dark:from-indigo-900/20 border border-indigo-100 dark:border-transparent">
        <CardHeader>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-indigo-600" />
                    <div>
            <CardTitle>Pacientes</CardTitle>
            <CardDescription>
              Mostrando {patients.length} de {totalCount}
            </CardDescription>
                    </div>
                </div>
                 <div className="flex-1 flex justify-end gap-2">
                     <Button size="sm" className="h-9 gap-2 bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => setIsNewPatientModalOpen(true)}>
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
                        className="pl-8 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800" 
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
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Pending'} onSelect={() => setStatusFilter('Pending')}>Pendiente</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Inactive'} onSelect={() => setStatusFilter('Inactive')}>Inactivo</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Archived'} onSelect={() => setStatusFilter('Archived')}>Archivado</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
         </CardHeader>
         <CardContent className="p-0">
           {showQuickAdd && (
             <div className="p-4 border-b bg-indigo-50/40 dark:bg-slate-800/40 flex flex-col gap-3 md:flex-row md:items-end">
               <div className="flex flex-col gap-1 flex-1">
                 <label className="text-xs font-medium">Nombre</label>
                 <Input value={tempFirst} onChange={e => setTempFirst(e.target.value)} placeholder="Nombre" />
               </div>
               <div className="flex flex-col gap-1 flex-1">
                 <label className="text-xs font-medium">Apellidos</label>
                 <Input value={tempLast} onChange={e => setTempLast(e.target.value)} placeholder="Apellidos" />
               </div>
               <div className="flex flex-col gap-1 flex-1">
                 <label className="text-xs font-medium">Email (opcional)</label>
                 <Input value={tempEmail} onChange={e => setTempEmail(e.target.value)} placeholder="email@ejemplo.com" />
               </div>
               <div className="flex flex-col gap-1 flex-1">
                 <label className="text-xs font-medium">Teléfono (opcional)</label>
                 <Input value={tempPhone} onChange={e => setTempPhone(e.target.value)} placeholder="Teléfono" />
               </div>
               <div className="flex gap-2">
                 <Button size="sm" onClick={handleQuickAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">Crear</Button>
                 <Button size="sm" variant="ghost" onClick={() => setShowQuickAdd(false)}>Cerrar</Button>
               </div>
             </div>
           )}
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
               {isLoading && patients.length === 0 ? (
                 <TableRow><TableCell colSpan={6} className="h-24 text-center">Cargando pacientes...</TableCell></TableRow>
               ) : filteredPatients.length > 0 ? (
                 filteredPatients.map((patient) => (
                   <TableRow key={patient.id} className="group transition-colors hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40">
                     <TableCell className="font-medium">
                       <div className="hover:underline cursor-pointer" onClick={() => router.push(`/patients/${patient.id}`)}>{patient.first_name} {patient.last_name}</div>
                       <div className="text-xs text-muted-foreground">ID: {patient.id.substring(0,8)}</div>
                     </TableCell>
                     <TableCell className="hidden lg:table-cell">{patient.email || 'N/A'}</TableCell>
                     <TableCell className="hidden md:table-cell">{patient.phone || 'N/A'}</TableCell>
                     <TableCell className="hidden lg:table-cell">{new Date(patient.created_at).toLocaleDateString('es-MX')}</TableCell>
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
                             <DropdownMenuItem onClick={() => router.push(`/appointments?patientId=${patient.id}`)}>
                               <Calendar className="mr-2 h-4 w-4" /> Citas
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => router.push(`/patients/${patient.id}?tab=billing`)}>
                               <FileText className="mr-2 h-4 w-4" /> Pagos
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => { setQuotePatientId(patient.id); setIsQuoteModalOpen(true); }}>
                               <PlusCircle className="mr-2 h-4 w-4" /> Generar Presupuesto
                             </DropdownMenuItem>
                             {patient.status === 'Pending' && (
                               <DropdownMenuItem onClick={async () => {
                                 setCompleteId(patient.id);
                                 // Prefill from DB
                                 const p = await getPatientById(patient.id);
                                 if (p) {
                                   const defaultMedical = { diabetes:false, cardiopathy:false, hypertension:false, coagulationIssues:false, epilepsy:false, hepatitis:false, hiv:false, cancer:false, allergies:false };
                                   setCompleteInitial({
                                     firstName: p.first_name || '',
                                     lastName: p.last_name || '',
                                     age: p.age || '',
                                     gender: p.gender || '',
                                     occupation: p.occupation || '',
                                     phone: p.phone || '',
                                     address: p.address || '',
                                     email: p.email || '',
                                     medicalConditions: p.medical_conditions || defaultMedical,
                                     pregnancyQuarter: p.pregnancy_quarter || '',
                                     currentMedications: p.current_medications || '',
                                     bloodPressure: p.blood_pressure || '',
                                     pulse: p.pulse || '',
                                     temperature: p.temperature || '',
                                     medicalDiagnosis: p.medical_diagnosis || '',
                                     dentalChart: p.dental_chart || {},
                                   });
                                 }
                               }}>
                                 <Users className="mr-2 h-4 w-4" /> Completar Paciente
                               </DropdownMenuItem>
                             )}
                             <DropdownMenuSeparator />
                             <DropdownMenuSub>
                               <DropdownMenuSubTrigger>Estado</DropdownMenuSubTrigger>
                               <DropdownMenuSubContent>
                                 <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'Active')}>Activo</DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'Pending')}>Pendiente</DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'Inactive')}>Inactivo</DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleStatusChange(patient.id, 'Archived')}>Archivado</DropdownMenuItem>
                               </DropdownMenuSubContent>
                             </DropdownMenuSub>
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
                 ))
               ) : (
                 <TableRow>
                   <TableCell colSpan={6} className="h-24 text-center">
                     No se encontraron pacientes. Agrega tu primer paciente para empezar.
                   </TableCell>
                 </TableRow>
               )}
             </TableBody>
           </Table>
           {/* Load more - centered footer */}
           <div className="p-6 flex flex-col items-center justify-center gap-2">
             <div className="text-sm text-muted-foreground">Mostrando {patients.length} de {totalCount}</div>
             {canLoadMore && (
               <Button
                 className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-6"
                 size="default"
                 onClick={() => fetchPatients(false)}
                 disabled={isLoading}
               >
                 {isLoading ? 'Cargando...' : 'Mostrar más'}
               </Button>
             )}
           </div>
         </CardContent>
       </Card>
     </DashboardLayout>
   );
}
