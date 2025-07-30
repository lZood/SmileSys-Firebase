
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
import { Patient } from '../page'; // Re-using type from the list page for now

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  // TODO: Fetch patient data from Supabase using the ID
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [isConsentModalOpen, setIsConsentModalOpen] = React.useState(false);

  React.useEffect(() => {
    // This is a placeholder. In a real app, you would fetch this from Supabase.
    // const fetchedPatient = await supabase.from('patients').select('*').eq('id', params.id).single();
    // setPatient(fetchedPatient.data);
    if (!patient) {
        // For now, let's create a mock patient to avoid errors
        setPatient({
            id: params.id.toUpperCase(),
            name: 'Paciente de Ejemplo',
            email: 'test@example.com',
            phone: '123-456-7890',
            lastVisit: new Date().toISOString().split('T')[0],
            status: 'Active',
        });
    }
  }, [params.id, patient]);

  if (!patient) {
    // We can show a loading state here
    return <DashboardLayout><div>Loading patient data...</div></DashboardLayout>;
    // Or, if fetching fails, call notFound();
  }

  return (
    <DashboardLayout>
       {isConsentModalOpen && (
          <ConsentForm 
            patientName={patient.name} 
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
                <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{patient.name}</CardTitle>
              <CardDescription>{patient.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator />
              <div className="py-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium text-foreground">{patient.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="font-medium text-foreground">{patient.phone}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Last Visit:</span>
                  <span className="font-medium text-foreground">{patient.lastVisit}</span>
                </div>
                 <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-foreground">{patient.status}</span>
                </div>
              </div>
              <Separator />
               <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="w-full"><Pencil className="w-4 h-4 mr-2" /> Edit</Button>
                  <Button variant="destructive" className="w-full"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
           <Card className="mt-4">
              <CardHeader>
                <CardTitle>Digital Consents</CardTitle>
                 <CardDescription>Manage informed consent forms.</CardDescription>
              </Header>
              <CardContent>
                 <Button className="w-full" onClick={() => setIsConsentModalOpen(true)}>
                    <FileText className="w-4 h-4 mr-2" /> Generate New Consent
                 </Button>
                 <div className="text-xs text-muted-foreground mt-2 text-center">No consents found.</div>
              </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-5 md:col-span-4">
            <Tabs defaultValue="odontogram">
                <TabsList>
                    <TabsTrigger value="odontogram">Odontogram</TabsTrigger>
                    <TabsTrigger value="history">Clinical History</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
                <TabsContent value="odontogram">
                    <Card>
                        <CardHeader>
                        <CardTitle>Interactive Odontogram</CardTitle>
                        <CardDescription>Graphical representation of the patient's dentition.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Odontogram />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                     <Card>
                        <CardHeader>
                        <CardTitle>Clinical History</CardTitle>
                        <CardDescription>Timeline of all treatments and notes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">Clinical history feature coming soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="billing">
                     <Card>
                        <CardHeader>
                        <CardTitle>Billing & Payments</CardTitle>
                        <CardDescription>Record of all financial transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p className="text-muted-foreground">Billing feature coming soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
