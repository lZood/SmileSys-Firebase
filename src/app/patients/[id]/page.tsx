
'use client';

import * as React from 'react';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2, ChevronLeft, Download } from "lucide-react";
import { Odontogram } from "@/components/odontogram";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import { ConsentForm } from '@/components/consent-form';
import { getPatientById, getConsentFormsForPatient } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { getUserData } from '@/app/user/actions';

type Patient = Awaited<ReturnType<typeof getPatientById>>;
type Clinic = Awaited<ReturnType<typeof getUserData>>['clinic'];

type ConsentDocument = {
    id: string;
    file_path: string;
    created_at: string;
};

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [clinic, setClinic] = React.useState<Clinic | null>(null);
  const [consentForms, setConsentForms] = React.useState<ConsentDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isConsentModalOpen, setIsConsentModalOpen] = React.useState(false);
  const [consentFormsLoading, setConsentFormsLoading] = React.useState(true);
  const supabase = createClient();

  const fetchPatientAndClinicData = React.useCallback(async () => {
    setIsLoading(true);
    const fetchedPatient = await getPatientById(params.id);
    if (fetchedPatient) {
      setPatient(fetchedPatient);
      // Once we have the patient, we can get clinic data
      const userData = await getUserData();
      if(userData && userData.clinic?.id === fetchedPatient.clinic_id) {
          setClinic(userData.clinic);
      }
    } else {
      notFound();
    }
    setIsLoading(false);
  }, [params.id]);

  const fetchConsentForms = React.useCallback(async () => {
    setConsentFormsLoading(true);
    const forms = await getConsentFormsForPatient(params.id);
    setConsentForms(forms as ConsentDocument[]);
    setConsentFormsLoading(false);
  }, [params.id]);


  React.useEffect(() => {
    fetchPatientAndClinicData();
    fetchConsentForms();
  }, [fetchPatientAndClinicData, fetchConsentForms]);
  
  const handleConsentModalClose = (wasSubmitted: boolean) => {
      setIsConsentModalOpen(false);
      if(wasSubmitted) {
          fetchConsentForms(); // Refresh the list
      }
  }

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('consent-forms').getPublicUrl(filePath);
    return data.publicUrl;
  }

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

  if (!patient || !clinic) {
    return notFound();
  }

  const patientFullName = `${patient.first_name} ${patient.last_name}`;

  return (
    <DashboardLayout>
       {isConsentModalOpen && (
          <ConsentForm 
            patientId={patient.id}
            patientName={patientFullName}
            clinic={clinic} 
            onClose={handleConsentModalClose}
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
                  <div className="text-sm space-y-2 mt-4">
                      {consentFormsLoading ? (
                          <Skeleton className="h-8 w-full" />
                      ) : consentForms.length > 0 ? (
                          consentForms.map(form => (
                              <div key={form.id} className="flex justify-between items-center p-2 rounded-md bg-muted">
                                  <span>Consentimiento - {new Date(form.created_at).toLocaleDateString()}</span>
                                   <Button asChild variant="ghost" size="icon">
                                      <a href={getPublicUrl(form.file_path)} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4" />
                                      </a>
                                  </Button>
                              </div>
                          ))
                      ) : (
                         <div className="text-xs text-muted-foreground mt-2 text-center">No se encontraron consentimientos.</div>
                      )}
                 </div>
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

    
