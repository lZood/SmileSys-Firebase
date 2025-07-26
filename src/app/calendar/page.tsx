"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { appointments, Appointment } from "@/lib/data";

export default function CalendarPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const appointmentsOnSelectedDay = date
    ? appointments.filter(
        (appointment) =>
          new Date(appointment.date).toDateString() === date.toDateString()
      )
    : [];

  const appointmentDates = React.useMemo(() => 
    appointments.map(app => new Date(app.date)), 
  [appointments]);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold font-headline">Calendar</h1>
        <p className="text-muted-foreground">
          A visual overview of all scheduled appointments.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 xl:col-span-5">
            <CardContent className="p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="p-0"
                    classNames={{
                        months: "flex flex-col sm:flex-row",
                        month: "space-y-4 p-4",
                        caption_label: "text-lg font-medium",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex justify-around",
                        head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2 justify-around",
                        cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent/50 text-accent-foreground",
                    }}
                    components={{
                        DayContent: ({ date, ...props }) => {
                            const isAppointment = appointmentDates.some(d => d.toDateString() === date.toDateString());
                            return (
                                <div className="relative h-full w-full flex items-center justify-center">
                                    <span>{date.getDate()}</span>
                                    {isAppointment && <div className="absolute bottom-2 h-1.5 w-1.5 rounded-full bg-primary" />}
                                </div>
                            );
                        }
                    }}
                />
            </CardContent>
        </Card>
        <Card className="lg:col-span-3 xl:col-span-2">
          <CardHeader>
            <CardTitle>
              Appointments for {date ? date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'a selected date'}
            </CardTitle>
            <CardDescription>
                {appointmentsOnSelectedDay.length > 0 ? `You have ${appointmentsOnSelectedDay.length} appointment(s).` : "No appointments for this day."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointmentsOnSelectedDay.map((appointment: Appointment) => (
                <div key={appointment.id} className="p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{appointment.patientName}</p>
                      <p className="text-sm text-muted-foreground">{appointment.service}</p>
                    </div>
                    <Badge variant={appointment.status === "Scheduled" ? "secondary" : "default"}>
                      {appointment.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {appointment.time} with {appointment.doctor}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
