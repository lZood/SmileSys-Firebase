
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
