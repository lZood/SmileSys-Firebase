import { PlusCircle, MoreHorizontal } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appointments } from "@/lib/data";

export default function AppointmentsPage() {
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.date) >= new Date() && a.status === "Scheduled"
  );
  const pastAppointments = appointments.filter(
    (a) => new Date(a.date) < new Date()
  );

  const renderTable = (data: typeof appointments) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((appointment) => (
          <TableRow key={appointment.id}>
            <TableCell className="font-medium">{appointment.patientName}</TableCell>
            <TableCell>{appointment.doctor}</TableCell>
            <TableCell>{appointment.service}</TableCell>
            <TableCell>
              {appointment.date} at {appointment.time}
            </TableCell>
            <TableCell>
                <Badge variant={
                    appointment.status === 'Completed' ? 'default' 
                    : appointment.status === 'Canceled' ? 'destructive'
                    : 'secondary'
                }
                className={
                    appointment.status === 'Completed' ? 'bg-green-500/20 text-green-700 border-green-500/20' : 
                    appointment.status === 'Scheduled' ? 'bg-blue-500/20 text-blue-700 border-blue-500/20' : 
                    'bg-red-500/20 text-red-700 border-red-500/20'
                }
                >
                    {appointment.status}
                </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem>Reschedule</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={appointment.status === 'Scheduled'}>Scheduled</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={appointment.status === 'Completed'}>Completed</DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={appointment.status === 'Canceled'}>Canceled</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Appointments</h1>
          <p className="text-muted-foreground">
            View and manage all patient appointments.
          </p>
        </div>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            New Appointment
          </span>
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                All scheduled appointments for the future.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(upcomingAppointments)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Appointments</CardTitle>
              <CardDescription>
                A history of all past appointments.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(pastAppointments)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>
                A complete list of all appointments.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(appointments)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
