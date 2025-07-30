
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

type SettingsPageProps = {
  userData: Awaited<ReturnType<typeof getUserData>>;
};

export default function SettingsPage() {
  const [userData, setUserData] = React.useState<SettingsPageProps['userData'] | null>(null);
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
                    <h1 className="text-3xl font-bold font-headline">Settings</h1>
                    <p className="text-muted-foreground">Manage your profile, clinic, and integrations.</p>
                </div>
                 <Skeleton className="w-full h-[600px]" />
            </div>
          </DashboardLayout>
      )
  }

  const { profile, clinic, teamMembers } = userData || {};

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile, clinic, and integrations.
          </p>
        </div>
        <Tabs defaultValue="profile" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="clinic">Clinic</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
                <CardDescription>
                  Update your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue={profile?.first_name || ''} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue={profile?.last_name || ''} />
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={profile?.user.email || ''} readOnly />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="clinic">
            <Card>
              <CardHeader>
                <CardTitle>Clinic Information</CardTitle>
                <CardDescription>
                  Manage your clinic's details for PDF generation (Admin only).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid gap-2">
                  <Label htmlFor="clinic-name">Clinic Name</Label>
                  <Input id="clinic-name" defaultValue={clinic?.name || ''} />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="clinic-address">Address</Label>
                  <Input id="clinic-address" placeholder="123 Dental Ave, Smiletown" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clinic-logo">Clinic Logo URL</Label>
                  <Input id="clinic-logo" placeholder="https://your-clinic.com/logo.png" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="terms">Terms & Conditions for Consents</Label>
                    <Textarea id="terms" placeholder="Enter the terms and conditions that will appear on every consent PDF..." className="min-h-[150px]" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="members">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Manage your clinic's staff (Admin only).</CardDescription>
                        </div>
                         <Button size="sm" className="h-8 gap-1">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Invite Member
                            </span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers && teamMembers.map(member => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="font-medium">{member.first_name} {member.last_name}</div>
                                        <div className="text-sm text-muted-foreground">{member.user_email}</div>
                                    </TableCell>
                                    <TableCell>{member.role}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4"/></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
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
                <CardTitle>Integrations</CardTitle>
                <CardDescription>
                  Connect SmileSys with other services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Google Calendar</CardTitle>
                            <CardDescription>Sync appointments with your personal calendar.</CardDescription>
                        </div>
                        <Button variant="outline">Connect</Button>
                    </CardHeader>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">SMS Notifications (Twilio)</CardTitle>
                            <CardDescription>Send appointment reminders via SMS.</CardDescription>
                        </div>
                        <Button variant="outline">Connect</Button>
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
