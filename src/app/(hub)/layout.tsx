import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <Header />
        <div className="p-8 w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
