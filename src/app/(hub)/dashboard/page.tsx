import Link from 'next/link';
import { auth } from '@/auth';
import { FeedbackModal } from '@/components/feedback-modal';

export default async function TasHubDashboard() {
  const session = await auth();
  const userName = session?.user?.name || "Usuario";

  return (
    <div className="w-full">
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Bienvenido de nuevo, <span className="text-primary-tas">{userName}</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2 font-medium">
          <span className="material-symbols-outlined text-sm">view_cozy</span>
          Panel Central de Aplicaciones - Selecciona un módulo para comenzar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Module 1: Estudio Tecnico */}
        <Link 
          href="/estudios" 
          className="group bg-white dark:bg-white/5 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-tas dark:hover:border-primary-tas transition-all hover:shadow-xl hover:-translate-y-1 block"
        >
          <div className="w-16 h-16 rounded-xl bg-primary-tas/10 flex items-center justify-center mb-6 group-hover:bg-primary-tas transition-colors">
            <span className="material-symbols-outlined text-primary-tas group-hover:text-white text-3xl transition-colors">engineering</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Estudio Técnico</h3>
          <p className="text-slate-500 dark:text-slate-400">Gestiona levantamientos de seguridad, tiempos de ejecución y revisión.</p>
          <div className="mt-8 flex items-center text-primary-tas font-bold gap-2">
            <span>Ir al Módulo</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </div>
        </Link>
        
        {/* Module 2: Empleados */}
        <Link 
          href="/employees" 
          className="group bg-white dark:bg-white/5 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-tas transition-all hover:shadow-xl hover:-translate-y-1 block"
        >
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-primary-tas transition-colors">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 group-hover:text-white text-3xl transition-colors">groups</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Directorio Empleados</h3>
          <p className="text-slate-500 dark:text-slate-400">Gestiona la información del personal corporativo, perfiles y logística.</p>
          <div className="mt-8 flex items-center text-primary-tas font-bold gap-2">
            <span>Ir a Empleados</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </div>
        </Link>

        {/* Module 3: Planificación */}
        <Link 
          href="/calendar" 
          className="group bg-white dark:bg-white/5 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-tas transition-all hover:shadow-xl hover:-translate-y-1 block"
        >
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-primary-tas transition-colors">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 group-hover:text-white text-3xl transition-colors">calendar_month</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Planificación y Tareas</h3>
          <p className="text-slate-500 dark:text-slate-400">Agendamiento de auditores, mantenimiento de reportes y cronogramas.</p>
          <div className="mt-8 flex items-center text-primary-tas font-bold gap-2">
            <span>Ir al Calendario</span>
            <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </div>
        </Link>
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-primary-tas/5 dark:bg-primary-tas/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border border-primary-tas/10">
          <div className="bg-primary-tas/20 p-4 rounded-xl">
            <span className="material-symbols-outlined text-primary-tas text-4xl">info</span>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold flex items-center gap-2">
              TAS Hub Beta <span className="bg-primary-tas/20 text-primary-tas text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Activo</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              TAS Hub está en fase Beta (desarrollo actual). Cualquier duda, comentario o mejora, por favor reportarlo{' '}
              <FeedbackModal>
                <button className="text-primary-tas font-bold hover:underline">aquí.</button>
              </FeedbackModal>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
