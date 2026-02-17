import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, HardHat } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold bg-gradient-to-tr from-blue-600 to-purple-400 bg-clip-text text-transparent mb-12">
          Estudios Técnicos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Director Flow */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Briefcase className="h-6 w-6" />
                Director / Operaciones
              </CardTitle>
              <CardDescription>
                Crear nuevos estudios, asignar ingenieros y gestionar clientes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Ir al Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Engineer Flow */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <HardHat className="h-6 w-6" />
                Ingeniero en Sitio
              </CardTitle>
              <CardDescription>
                Realizar levantamiento, grabar notas de voz y generar reportes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* For demo purposes linking to a fixed ID, in production this would be dynamic */}
              <Link href="/engineer/study/123" passHref>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Ir a Estudio (Demo #123)
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
