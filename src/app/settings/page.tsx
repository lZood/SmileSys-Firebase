
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

const teamMembers = [
    { name: 'Dr. Emily Carter', role: 'Admin, Doctor', email: 'emily.c@smilesys.com' },
    { name: 'Dr. Ben Adams', role: 'Doctor', email: 'ben.a@smilesys.com' },
    { name: 'Sarah Lee', role: 'Staff', email: 'sarah.l@smilesys.com' },
];

export default function SettingsPage() {
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
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Dr. Emily Carter" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="emily.c@smilesys.com" />
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
                  <Input id="clinic-name" defaultValue="SmileSys Dental Care" />
                </div>
                 <div className="grid gap-2">
                  <Label htmlFor="clinic-address">Address</Label>
                  <Input id="clinic-address" defaultValue="123 Dental Ave, Smiletown" />
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
                            {teamMembers.map(member => (
                                <TableRow key={member.email}>
                                    <TableCell>
                                        <div className="font-medium">{member.name}</div>
                                        <div className="text-sm text-muted-foreground">{member.email}</div>
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
