import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "#050d1a" }}>
      <Sidebar />
      <main
        className="flex-1 min-w-0 overflow-auto"
        style={{ marginLeft: "240px", paddingTop: "60px" }}
      >
        {children}
      </main>
    </div>
  );
}
