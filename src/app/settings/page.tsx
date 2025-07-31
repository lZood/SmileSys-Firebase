

'use client';

import * as React from 'react';
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, PlusCircle, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { getUserData } from '../user/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateClinicInfo, uploadClinicLogo, updateUserPassword, updateUserProfile, updateMemberRoles, deleteMember } from './actions';
import Image from 'next/image';
import { InviteMemberForm } from '@/components/invite-member-form';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';


type UserData = Awaited<ReturnType<typeof getUserData>>;
type TeamMember = NonNullable<UserData>['teamMembers'][0];

const ClinicInfoForm = ({ clinic, isAdmin }: { clinic: NonNullable<UserData['clinic']>, isAdmin: boolean }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [logoFile, setLogoFile] = React.useState<File | null>(null);
    const [logoPreview, setLogoPreview] = React.useState<string | null>(clinic?.logo_url || null);
    
    const [clinicData, setClinicData] = React.useState({
        name: clinic?.name || '',
        address: clinic?.address || '',
        phone: clinic?.phone || '',
        logo_url: clinic?.logo_url || '',
        terms_and_conditions: clinic?.terms_and_conditions || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setClinicData({ ...clinicData, [e.target.id]: e.target.value });
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        let finalLogoUrl = clinicData.logo_url;

        if (logoFile) {
            const uploadResult = await uploadClinicLogo(logoFile, clinic.id);
            if (uploadResult.error) {
                toast({ variant: 'destructive', title: 'Error al subir el logo', description: uploadResult.error });
                setIsLoading(false);
                return;
            }
            finalLogoUrl = uploadResult.publicUrl!;
        }

        const result = await updateClinicInfo({ 
            clinicId: clinic.id, 
            ...clinicData,
            logo_url: finalLogoUrl
        });

        setIsLoading(false);

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Información Actualizada', description: 'Los datos de la clínica han sido guardados.' });
        }
    };

    return (
         <CardContent className="space-y-4">
             <div className="grid gap-2">
                <Label>Logo de la Clínica</Label>
                 <div className="flex items-center gap-4">
                    {logoPreview ? (
                        <Image src={logoPreview} alt="Logo Preview" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                        <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">Sin Logo</div>
                    )}
                    <Input id="logo-upload" type="file" onChange={handleFileChange} className="max-w-xs" disabled={!isAdmin || isLoading} accept="image/*"/>
                 </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre de la Clínica</Label>
                    <Input id="name" value={clinicData.name} onChange={handleChange} disabled={!isAdmin || isLoading} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" value={clinicData.phone || ''} onChange={handleChange} placeholder="+52 55 1234 5678" disabled={!isAdmin || isLoading} />
                </div>
            </div>
             <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={clinicData.address || ''} onChange={handleChange} placeholder="Av. Dental 123, Sonrisas" disabled={!isAdmin || isLoading} />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="terms_and_conditions">Términos y Condiciones para Consentimientos</Label>
                <Textarea 
                    id="terms_and_conditions" 
                    value={clinicData.terms_and_conditions || ''} 
                    onChange={handleChange} 
                    placeholder="Introduce los términos y condiciones que aparecerán en cada PDF de consentimiento..." 
                    className="min-h-[150px]" 
                    disabled={!isAdmin || isLoading}
                />
            </div>
            {isAdmin && <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>}
        </CardContent>
    );
};

const ProfileInfoForm = ({ profile }: { profile: NonNullable<UserData['profile']> }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [formData, setFormData] = React.useState({
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };
    
    const handleSaveProfile = async () => {
        setIsLoading(true);
        const result = await updateUserProfile(formData);
        setIsLoading(false);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Perfil Actualizado', description: 'Tus datos han sido guardados.' });
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu nombre y apellido. Tu email no se puede cambiar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input id="firstName" value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input id="lastName" value={formData.lastName} onChange={handleChange} />
                    </div>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={profile?.user_email || ''} readOnly className="cursor-not-allowed bg-muted/50" />
                </div>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </CardContent>
        </Card>
    );
}

const PasswordForm = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [passwords, setPasswords] = React.useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = React.useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setPasswords(prev => ({...prev, [id]: value}));
        setError(null);
    };

    const handlePasswordChange = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
         if (passwords.newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setIsLoading(true);
        setError(null);
        const result = await updateUserPassword(passwords);
        setIsLoading(false);

        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Contraseña Actualizada', description: 'Tu contraseña ha sido cambiada exitosamente.' });
            setPasswords({ newPassword: '', confirmPassword: '' });
        }
    };

    const canSubmit = passwords.newPassword.length >= 8 && passwords.newPassword === passwords.confirmPassword;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Actualizar Contraseña</CardTitle>
                <CardDescription>Asegúrate de que tu cuenta utiliza una contraseña larga y aleatoria para mantenerse segura.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input id="newPassword" type="password" value={passwords.newPassword} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                    <Input id="confirmPassword" type="password" value={passwords.confirmPassword} onChange={handleChange} />
                </div>
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                <Button onClick={handlePasswordChange} disabled={isLoading || !canSubmit}>
                    {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
            </CardContent>
        </Card>
    );
};

const EditRolesModal = ({
    member,
    isOpen,
    onClose,
    onRolesUpdated
}: {
    member: TeamMember | null;
    isOpen: boolean;
    onClose: () => void;
    onRolesUpdated: () => void;
}) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);
    const [roles, setRoles] = React.useState<string[]>([]);
    const allRoles = ['admin', 'doctor', 'staff'];

    React.useEffect(() => {
        if (member) {
            setRoles(member.roles || []);
        }
    }, [member]);
    
    if (!member) return null;

    const handleRoleChange = (role: string, checked: boolean) => {
        setRoles(prev => 
            checked ? [...prev, role] : prev.filter(r => r !== role)
        );
    };

    const handleSave = async () => {
        setIsLoading(true);
        const result = await updateMemberRoles({ memberId: member.id, roles });
        setIsLoading(false);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Roles Actualizados', description: `Los roles de ${member.first_name} han sido actualizados.` });
            onRolesUpdated();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Roles de {member.first_name} {member.last_name}</DialogTitle>
                    <DialogDescription>Selecciona los roles que este miembro debe tener.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {allRoles.map(role => (
                        <div key={role} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`role-${role}`} 
                                checked={roles.includes(role)} 
                                onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                            />
                            <Label htmlFor={`role-${role}`} className="capitalize font-normal">{role}</Label>
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Cambios'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function SettingsPage() {
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [isEditRolesModalOpen, setIsEditRolesModalOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const { toast } = useToast();

  const fetchUserData = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getUserData();
     if (data) {
        setUserData(data);
      }
      setIsLoading(false);
  }, [])

  React.useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);
  
  const handleModalClose = (wasSubmitted: boolean) => {
    setIsInviteModalOpen(false);
    setIsEditRolesModalOpen(false);
    if(wasSubmitted) {
        fetchUserData();
    }
  }

  const handleEditClick = (member: TeamMember) => {
      setSelectedMember(member);
      setIsEditRolesModalOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
      const { error } = await deleteMember(memberId);
      if (error) {
          toast({ variant: 'destructive', title: 'Error al eliminar', description: error });
      } else {
          toast({ title: 'Miembro Eliminado', description: 'El usuario ha sido eliminado exitosamente.' });
          fetchUserData();
      }
  }

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
  const isAdmin = profile?.roles?.includes('admin');

  return (
    <DashboardLayout>
       {isInviteModalOpen && clinic && <InviteMemberForm clinicId={clinic.id} onClose={(s) => handleModalClose(s)}/>}
       <EditRolesModal 
            member={selectedMember} 
            isOpen={isEditRolesModalOpen} 
            onClose={() => handleModalClose(false)} 
            onRolesUpdated={() => handleModalClose(true)} 
        />

      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Ajustes</h1>
          <p className="text-muted-foreground">
            Gestiona tu perfil, clínica e integraciones.
          </p>
        </div>
        <Tabs defaultValue="profile" className="flex-1">
          <TabsList className={cn("grid w-full", isAdmin ? "grid-cols-4" : "grid-cols-1")}>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            {isAdmin && (
                <>
                    <TabsTrigger value="clinic">Clínica</TabsTrigger>
                    <TabsTrigger value="members">Miembros</TabsTrigger>
                    <TabsTrigger value="integrations">Integraciones</TabsTrigger>
                </>
            )}
          </TabsList>
          <TabsContent value="profile">
            <div className="space-y-6">
                {profile && <ProfileInfoForm profile={{...profile, user_email: user?.email || ''}} />}
                <PasswordForm />
            </div>
          </TabsContent>
          {isAdmin && (
            <>
                <TabsContent value="clinic">
                    <Card>
                    <CardHeader>
                        <CardTitle>Información de la Clínica</CardTitle>
                        <CardDescription>
                        Gestiona los detalles de tu clínica para la generación de PDF (solo Admin).
                        </CardDescription>
                    </CardHeader>
                    {clinic && <ClinicInfoForm clinic={clinic} isAdmin={isAdmin} />}
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
                                <Button size="sm" className="h-8 gap-1" disabled={!isAdmin} onClick={() => setIsInviteModalOpen(true)}>
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
                                        <TableHead>Puesto</TableHead>
                                        <TableHead>Roles en App</TableHead>
                                        <TableHead><span className="sr-only">Acciones</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teamMembers && teamMembers.map(member => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">{member.first_name} {member.last_name}</TableCell>
                                            <TableCell>{member.user_email}</TableCell>
                                            <TableCell>{member.job_title || 'N/A'}</TableCell>
                                            <TableCell className="capitalize">{member.roles?.join(', ') || 'N/A'}</TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!isAdmin || member.id === user?.id}><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleEditClick(member)}><Edit className="mr-2 h-4 w-4" />Editar Roles</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de {member.first_name} y todos sus datos asociados.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteMember(member.id)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
