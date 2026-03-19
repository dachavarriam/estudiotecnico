"use client";

import { useEffect, useState } from "react";

export function Header() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  };

  return (
    <header className="sticky top-0 z-10 shrink-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
      <div className="w-1/3 max-w-md">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-tas transition-colors">
            search
          </span>
          <input 
            className="w-full pl-10 pr-4 py-2 bg-slate-200/50 dark:bg-white/5 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-tas/20 text-sm placeholder:text-slate-400" 
            placeholder="Buscar..." 
            type="text" 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">
            {theme === "light" ? "dark_mode" : "light_mode"}
          </span>
        </button>
        
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">Usuario Demo</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-tighter">u.demo@tas.com</p>
          </div>
          <img 
            alt="User profile" 
            className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700" 
            src="https://ui-avatars.com/api/?name=User+Demo&background=random"
          />
        </div>
      </div>
    </header>
  );
}
