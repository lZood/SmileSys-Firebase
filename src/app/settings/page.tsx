
'use client';

import * as React from 'react';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { getUserData } from '../user/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { AppearanceForm } from './appearance-form';

type UserData = Awaited<ReturnType<typeof getUserData>>;

export default function SettingsPage() {
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    getUserData().then(data => {
      if (data) {
        setUserData(data);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
      return (
          <DashboardLayout>
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Ajustes</h1>
                    <p className="text-muted-foreground">Gestiona tu perfil, clínica e integraciones.</p>
                </div>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                        <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
                         <Skeleton className="h-10 w-32 mt-4" />
                    </CardContent>
                 </Card>
            </div>
          </DashboardLayout>
      )
  }

  const { user, profile, clinic, teamMembers } = userData || {};

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Ajustes</h1>
          <p className="text-muted-foreground">
            Gestiona tu perfil, clínica e integraciones.
          </p>
        </div>
        <Tabs defaultValue="profile" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="clinic">Clínica</TabsTrigger>
            <TabsTrigger value="members">Miembros</TabsTrigger>
            <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Mi Perfil</CardTitle>
                <CardDescription>
                  Actualiza tu información personal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input id="firstName" defaultValue={profile?.first_name || ''} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input id="lastName" defaultValue={profile?.last_name || ''} />
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ''} readOnly />
                </div>
                <Button>Guardar Cambios</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="clinic">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Clínica</CardTitle>
                <CardDescription>
                  Gestiona los detalles de tu clínica para la generación de PDF (solo Admin).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid gap-2">
                  <Label htmlFor="clinic-name">Nombre de la Clínica</Label>
                  <Input id="clinic-name" defaultValue={clinic?.name || ''} />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="clinic-address">Dirección</Label>
                  <Input id="clinic-address" placeholder="Av. Dental 123, Sonrisas" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clinic-logo">URL del Logo de la Clínica</Label>
                  <Input id="clinic-logo" placeholder="https://tu-clinica.com/logo.png" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="terms">Términos y Condiciones para Consentimientos</Label>
                    <Textarea id="terms" placeholder="Introduce los términos y condiciones que aparecerán en cada PDF de consentimiento..." className="min-h-[150px]" />
                </div>
                <Button>Guardar Cambios</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="members">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Miembros del Equipo</CardTitle>
                            <CardDescription>Gestiona el personal de tu clínica (solo Admin).</CardDescription>
                        </div>
                         <Button size="sm" className="h-8 gap-1">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Invitar Miembro
                            </span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers && teamMembers.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                                    <TableCell>{member.user_email}</TableCell>
                                    <TableCell className="capitalize">{member.role}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem>Editar Rol</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integraciones</CardTitle>
                <CardDescription>
                  Conecta SmileSys con otros servicios.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Google Calendar</CardTitle>
                            <CardDescription>Sincroniza citas con tu calendario personal.</CardDescription>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Notificaciones por SMS (Twilio)</CardTitle>
                            <CardDescription>Envía recordatorios de citas por SMS.</CardDescription>
                        </div>
                        <Button variant="outline">Conectar</Button>
                    </CardHeader>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

    