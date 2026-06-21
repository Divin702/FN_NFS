import { Sidebar } from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/providers/SidebarProvider";
import { AuthGuard } from "@/components/dashboard/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AuthGuard>
        <div className="fixed inset-0 flex overflow-hidden bg-surface">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 h-full">{children}</div>
        </div>
      </AuthGuard>
    </SidebarProvider>
  );
}
