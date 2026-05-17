import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";

export default function DashboardLayout({ children, showRightSidebar = true }) {
  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <Sidebar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}
