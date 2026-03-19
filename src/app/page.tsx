import { getSession } from '@/actions/user-actions';
import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { logout } from '@/actions/user-actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 bg-[url('/grid.svg')]">
      <div className="z-10 w-full max-w-5xl flex flex-col items-center justify-between font-sans">
        
        <div className="mb-12 text-center flex flex-col items-center">
             <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center border border-slate-200">
                  <img src="/logo.png" alt="TAS HUB Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-5xl font-extrabold flex items-center">
                  <span className="text-slate-900 tracking-tight">TAS</span>
                  <span className="text-primary-tas">HUB</span>
                </h1>
            </div>
            <p className="text-slate-500 text-lg font-medium">Portal Central Corporativo</p>
        </div>

        {!session ? (
            <div className="w-full max-w-sm">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-black">Central de Acceso</CardTitle>
                        <CardDescription>
                            Ingresa con tus credenciales corporativas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="w-full border-green-200 shadow-md bg-white/80 backdrop-blur">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl text-slate-800">Bienvenido, {session.name}</CardTitle>
                        <CardDescription className="uppercase font-bold text-xs tracking-wider text-primary-tas">
                            Rol: {session.role === 'director' ? 'Director / Admin' : 'Ingeniero de Campo'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link href="/dashboard" passHref>
                            <Button className="w-full bg-primary-tas hover:bg-red-800 text-white h-12 text-lg border-0">
                                <LayoutDashboard className="mr-2 h-5 w-5" /> Entrar al TAS Hub
                            </Button>
                        </Link>
                        
                        <form action={async () => {
                            'use server';
                            await logout();
                        }}>
                            <Button variant="ghost" className="w-full text-gray-500 hover:text-red-600 hover:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        )}

      </div>
          
      {/* Footer Info */}
      <div className="fixed bottom-4 text-xs text-gray-400">
        TAS Honduras &copy; 2026
      </div>
    </main>
  );
}
