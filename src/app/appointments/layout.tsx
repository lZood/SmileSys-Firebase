
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
