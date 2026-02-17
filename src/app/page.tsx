import { getSession } from '@/actions/user-actions';
import { LoginButton } from '@/components/login-button';
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
        
        <div className="mb-12 text-center">
             <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-4">
              Estudios Técnicos
            </h1>
            <p className="text-gray-500 text-lg">Sistema de Gestión de Levantamientos y Reportes</p>
        </div>

        {!session ? (
            <div className="w-full max-w-sm">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <CardTitle>Bienvenido</CardTitle>
                        <CardDescription>Inicia sesión con tu cuenta de TASHonduras (Slack)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginButton />
                    </CardContent>
                </Card>
            </div>
        ) : (
            <div className="flex flex-col items-center w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="w-full border-green-200 shadow-md bg-white/80 backdrop-blur">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl text-green-800">Bienvenido, {session.name}</CardTitle>
                        <CardDescription className="uppercase font-bold text-xs tracking-wider text-green-600">
                            Rol: {session.role === 'director' ? 'Director / Admin' : 'Ingeniero de Campo'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Link href={session.role === 'director' ? '/dashboard' : '/engineer/dashboard'} passHref>
                            <Button className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg">
                                <LayoutDashboard className="mr-2 h-5 w-5" /> Ir al Dashboard
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
