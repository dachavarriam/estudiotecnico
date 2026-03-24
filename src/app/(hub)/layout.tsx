import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getSession } from "@/actions/user-actions";

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100">
      <Sidebar user={session} />
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <Header user={session} />
        <div className="p-8 w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
