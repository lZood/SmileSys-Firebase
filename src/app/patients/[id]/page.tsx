
'use client';

import * as React from 'react';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2, ChevronLeft } from "lucide-react";
import { Odontogram } from "@/components/odontogram";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { ConsentForm } from '@/components/consent-form';
import { getPatientById } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';

// Define a more complete type based on the DB schema
type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string; // Assuming last visit is creation date for now
  status: string;
  dental_chart: any; // The odontogram data
};


export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConsentModalOpen, setIsConsentModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      const fetchedPatient = await getPatientById(params.id);
      if (fetchedPatient) {
        setPatient(fetchedPatient as Patient);
      } else {
        // Handle case where patient is not found
        notFound();
      }
      setIsLoading(false);
    };

    fetchPatient();
  }, [params.id]);
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mb-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <div className="lg:col-span-2 md:col-span-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-col items-center text-center">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-8 w-40 mt-4" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
               <CardHeader>
                <Skeleton className="h-6 w-40"/>
                <Skeleton className="h-4 w-48"/>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-5 md:col-span-4">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return notFound();
  }

  const patientFullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <DashboardLayout>
       {isConsentModalOpen && (
          <ConsentForm 
            patientName={patientFullName} 
            onClose={() => setIsConsentModalOpen(false)}
          />
        )}
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
            <Link href="/patients">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver a Pacientes
            </Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="lg:col-span-2 md:col-span-4">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person" />
                <AvatarFallback>{patient.first_name.charAt(0)}{patient.last_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{patientFullName}</CardTitle>
              <CardDescription>ID: {patient.id.substring(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator />
              <div className="py-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium text-foreground">{patient.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Teléfono:</span>
                  <span className="font-medium text-foreground">{patient.phone || 'N/A'}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Última Visita:</span>
                  <span className="font-medium text-foreground">{new Date(patient.created_at).toLocaleDateString()}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Estado:</span>
                  <span className="font-medium text-foreground">{patient.status}</span>
                </div>
              </div>
              <Separator />
               <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="w-full"><Pencil className="w-4 h-4 mr-2" /> Editar</Button>
                  <Button variant="destructive" className="w-full"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</Button>
              </div>
            </CardContent>
          </Card>
           <Card className="mt-4">
              <CardHeader>
                <CardTitle>Consentimientos Digitales</CardTitle>
                 <CardDescription>Gestionar consentimientos informados.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Button className="w-full" onClick={() => setIsConsentModalOpen(true)}>
                    <FileText className="w-4 h-4 mr-2" /> Generar Nuevo Consentimiento
                 </Button>
                 <div className="text-xs text-muted-foreground mt-2 text-center">No se encontraron consentimientos.</div>
              </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-5 md:col-span-4">
            <Tabs defaultValue="odontogram">
                <TabsList>
                    <TabsTrigger value="odontogram">Odontograma</TabsTrigger>
                    <TabsTrigger value="history">Historia Clínica</TabsTrigger>
                    <TabsTrigger value="billing">Facturación</TabsTrigger>
                </TabsList>
                <TabsContent value="odontogram">
                    <Card>
                        <CardHeader>
                        <CardTitle>Odontograma Interactivo</CardTitle>
                        <CardDescription>Representación gráfica de la dentición del paciente.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Odontogram initialData={patient.dental_chart} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                     <Card>
                        <CardHeader>
                        <CardTitle>Historia Clínica</CardTitle>
                        <CardDescription>Cronología de todos los tratamientos y notas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">La función de historia clínica estará disponible pronto.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="billing">
                     <Card>
                        <CardHeader>
                        <CardTitle>Facturación y Pagos</CardTitle>
                        <CardDescription>Registro de todas las transacciones financieras.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">La función de facturación estará disponible pronto.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
