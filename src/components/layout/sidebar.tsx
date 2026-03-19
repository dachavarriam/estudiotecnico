"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Panel Principal", icon: "dashboard", href: "/dashboard", role: "all" },
  { name: "Estudios Técnicos", icon: "engineering", href: "/estudios", role: "all" },
  { type: "divider", label: "Administración" },
  { name: "Empleados", icon: "groups", href: "/employees", role: "superadmin" },
  { name: "Planificación", icon: "calendar_month", href: "/calendar", role: "all" },
  { name: "Superadmin", icon: "admin_panel_settings", href: "/superadmin", role: "superadmin" },
];

export function Sidebar() {
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
        {navItems.map((item, index) => {
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
        <div className={cn("flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg", isCollapsed && "justify-center bg-transparent")}>
          <div className="relative shrink-0">
            <img 
              alt="Avatar" 
              className="w-8 h-8 rounded-full object-cover border border-slate-200" 
              src="https://ui-avatars.com/api/?name=User+Demo&background= random" 
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Usuario Demo</p>
              <p className="text-[10px] text-slate-500 truncate">Analista de Seguridad</p>
            </div>
          )}
          {!isCollapsed && (
            <button className="ml-auto text-slate-400 hover:text-primary-tas transition-colors" title="Cerrar Sesión">
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
