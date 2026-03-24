"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/user-actions";
import { FeedbackModal } from "@/components/feedback-modal";

const navItems = [
  { name: "Panel Principal", icon: "dashboard", href: "/dashboard", role: "all" },
  { name: "Estudios Técnicos", icon: "engineering", href: "/estudios", role: "all" },
  { type: "divider", label: "Administración" },
  { name: "Empleados", icon: "groups", href: "/employees", role: "superadmin" },
  { name: "Planificación", icon: "calendar_month", href: "/calendar", role: "all" },
  { name: "Superadmin", icon: "admin_panel_settings", href: "/superadmin", role: "superadmin" },
];

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 shrink-0 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 justify-between">
        <div className={cn("flex items-center gap-2 overflow-hidden whitespace-nowrap", isCollapsed && "hidden")}>
          <span className="material-symbols-outlined text-primary-tas text-2xl">shield_person</span>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
            TAS <span className="text-primary-tas">Hub</span>
          </h1>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 mx-auto"
        >
          <span className="material-symbols-outlined text-sm">
            {isCollapsed ? "menu" : "menu_open"}
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto w-full p-4 space-y-1">
        {navItems.filter(item => {
            const userRole = user?.role?.toLowerCase() || 'user';
            const isManager = ['admin', 'superadmin', 'director'].includes(userRole);
            
            if (item.type === "divider") return isManager;
            if (item.role === 'all') return true;
            if (item.role === 'superadmin' && !isManager) return false;
            return true;
        }).map((item, index) => {
          if (item.type === "divider") {
            return (
              <div key={index} className={cn("pt-4 mt-4 border-t border-slate-200 dark:border-slate-800", isCollapsed && "hidden")}>
                <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{item.label}</p>
              </div>
            );
          }

          const isActive = pathname.startsWith(item.href!);
          
          return (
            <Link
              key={index}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group font-medium",
                isActive 
                  ? "bg-primary-tas/10 text-primary-tas font-bold" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-tas",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <span className={cn("material-symbols-outlined", isActive ? "text-primary-tas" : "group-hover:text-primary-tas")}>
                {item.icon}
              </span>
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 shrink-0 border-t border-slate-200 dark:border-slate-800">
        <FeedbackModal>
            <button className={cn("flex w-full items-center gap-2 mb-4 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg font-medium transition-colors", isCollapsed && "justify-center px-0")} title="Reportar Fallas">
                <span className="material-symbols-outlined text-sm">bug_report</span>
                {!isCollapsed && <span>Reportar Fallas</span>}
            </button>
        </FeedbackModal>
        <div className={cn("flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800", isCollapsed && "justify-center bg-transparent border-transparent")}>
          <div className="relative shrink-0">
            <span className="material-symbols-outlined text-slate-400 bg-white dark:bg-slate-700 p-1.5 rounded-full border border-slate-200 dark:border-slate-600">account_circle</span>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
          {!isCollapsed && user && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={user.name}>{user.name || "Usuario Desconocido"}</p>
              <p className="text-[10px] text-slate-500 truncate" style={{ textTransform: 'capitalize' }}>{user.role || "Analista"}</p>
            </div>
          )}
          {!isCollapsed && !user && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Sesión Expirada</p>
            </div>
          )}
          {!isCollapsed && (
            <button 
                onClick={async () => {
                    await logout();
                }}
                className="ml-auto text-slate-400 hover:text-primary-tas transition-colors" 
                title="Cerrar Sesión"
            >
                <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
