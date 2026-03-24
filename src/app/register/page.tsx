import { RegisterForm } from '@/components/register-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getSession } from '@/actions/user-actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const session = await getSession();

  // Redirect users who are already logged in
  if (session) {
      redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 bg-[url('/grid.svg')]">
      <div className="z-10 w-full max-w-5xl flex flex-col items-center justify-between font-sans">
        
        <div className="mb-8 text-center flex flex-col items-center">
             <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center border border-slate-200">
                  <img src="/logo.png" alt="TAS HUB Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-5xl font-extrabold flex items-center">
                  <span className="text-slate-900 tracking-tight">TAS</span>
                  <span className="text-primary-tas">HUB</span>
                </h1>
            </div>
            <p className="text-slate-500 text-lg font-medium">Nuevo Usuario</p>
        </div>

        <div className="w-full max-w-sm">
            <Card className="border-0 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-black">Crear Cuenta</CardTitle>
                    <CardDescription>
                        Crea tus credenciales para acceder al panel. Cuenta debera ser validado por un administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                </CardContent>
            </Card>
        </div>

      </div>
          
      {/* Footer Info */}
      <div className="fixed bottom-4 text-xs text-gray-400">
        TAS Honduras &copy; 2026
      </div>
    </main>
  );
}
