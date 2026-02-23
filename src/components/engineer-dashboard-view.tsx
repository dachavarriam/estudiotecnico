'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, CheckCircle, AlertCircle, ArrowRight, Play, LogOut, Search } from 'lucide-react';
import { logout } from '@/actions/user-actions';

interface Study {
    id: string;
    clientName: string;
    status: string;
    date: string;
    location?: string;
    type?: string;
    startedAt?: string;
    submittedAt?: string;
}

export function EngineerDashboardView({ studies, engineerName }: { studies: Study[], engineerName: string }) {
    const [searchQuery, setSearchQuery] = useState('');
    
    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    // Filter studies first based on search
    const filteredStudies = studies.filter(s => 
        s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pending = filteredStudies.filter(s => s.status === 'draft' || !s.status);
    const inProgress = filteredStudies.filter(s => s.status === 'in_progress');
    const history = filteredStudies.filter(s => ['review', 'approved', 'rejected'].includes(s.status));

    // --- Metrics Calculation (Based on ALL studies, not filtered) ---
    // We want metrics to reflect total work, not just what matches search
    const allHistory = studies.filter(s => ['review', 'approved', 'rejected'].includes(s.status));
    const totalCompleted = allHistory.length;
    
    // Average Time Calculation (minutes)
    let totalMinutes = 0;
    let countWithTimes = 0;
    
    allHistory.forEach(s => {
        if (s.startedAt && s.submittedAt) {
            const start = new Date(s.startedAt).getTime();
            const end = new Date(s.submittedAt).getTime();
            const diff = (end - start) / (1000 * 60); // minutes
            if (diff > 0 && diff < 1440 * 2) { // Sanity check: ignore if > 2 days (outlier/testing error)
                totalMinutes += diff;
                countWithTimes++;
            }
        }
    });

    const avgMinutes = countWithTimes > 0 ? Math.round(totalMinutes / countWithTimes) : 0;
    const avgTimeDisplay = avgMinutes > 60 
        ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` 
        : `${avgMinutes}m`;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hola, {engineerName} 👋</h1>
                        <p className="text-gray-500">Aquí tienes tus asignaciones para hoy.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end md:self-auto">
                        <LogOut className="w-4 h-4 mr-2" /> Salir
                    </Button>
                </div>

                {/* METRICS CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pendientes</span>
                            <div className="text-3xl font-bold text-blue-600 my-1">{studies.filter(s => s.status === 'draft' || !s.status).length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">En Ejecución</span>
                            <div className="text-3xl font-bold text-orange-500 my-1">{studies.filter(s => s.status === 'in_progress').length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Completados</span>
                            <div className="text-3xl font-bold text-green-600 my-1">{totalCompleted}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tiempo Prom.</span>
                            <div className="text-xl font-bold text-gray-700 my-2">{avgTimeDisplay}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* SEARCH BAR */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                        placeholder="Buscar por cliente, ubicación o ID..." 
                        className="pl-10 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* ACTIVE WORK CARD (If any) */}
                {inProgress.length > 0 && (
                     <Card className="border-blue-500 bg-blue-50 animate-in slide-in-from-left duration-500">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-blue-700 flex items-center gap-2">
                                <Clock className="w-5 h-5 animate-pulse" /> En Ejecución Ahora
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {inProgress.map(study => (
                                <div key={study.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm mb-2 last:mb-0 gap-3">
                                    <div>
                                        <h3 className="font-bold text-lg">{study.clientName}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {study.location || 'Sin ubicación'}
                                        </p>
                                    </div>
                                    <Link href={`/engineer/study/${study.id}`} className="w-full md:w-auto">
                                        <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                                            Continuar <ArrowRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* TABS FOR LISTS */}
                <Tabs defaultValue="pending" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">Asignaciones {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
                        <TabsTrigger value="history">Historial {history.length > 0 && `(${history.length})`}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="pending" className="space-y-4 mt-4">
                        {pending.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border border-dashed flex flex-col items-center">
                                {searchQuery ? (
                                    <>
                                        <Search className="w-12 h-12 text-gray-300 mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900">Sin resultados</h3>
                                        <p className="text-gray-500">No se encontraron estudios pendientes con "{searchQuery}"</p>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                                        <h3 className="text-lg font-medium text-gray-900">¡Todo al día!</h3>
                                        <p className="text-gray-500">No tienes estudios pendientes por iniciar.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            pending.map(study => (
                                <Card key={study.id} className="hover:shadow-md transition-shadow group">
                                    <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-gray-50">#{study.id}</Badge>
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {new Date(study.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                                                {study.clientName}
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {study.location || 'Sin ubicación'}
                                            </p>
                                        </div>
                                        <Link href={`/engineer/study/${study.id}`} className="w-full md:w-auto">
                                            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 w-full md:w-auto">
                                                <Play className="w-4 h-4 mr-2" /> Iniciar
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                    
                    <TabsContent value="history">
                         <Card>
                            <CardContent className="p-0">
                                {history.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        {searchQuery ? `No se encontró historial para "${searchQuery}"` : "Sin historial aún."}
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {history.map(study => (
                                            <div key={study.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50 gap-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{study.clientName}</p>
                                                    <div className="flex gap-2 text-xs text-gray-500 mt-1">
                                                        <span>#{study.id}</span>
                                                        <span>•</span>
                                                        <span>Finalizado: {study.submittedAt ? new Date(study.submittedAt).toLocaleDateString() : '-'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                                     <Badge className={`
                                                        ${study.status === 'review' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200' : ''}
                                                        ${study.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' : ''}
                                                        ${study.status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200' : ''}
                                                     `}>
                                                        {study.status === 'review' ? 'En Revisión' : 
                                                         study.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                                     </Badge>
                                                     <Link href={`/engineer/study/${study.id}`}>
                                                        <Button size="sm" variant="ghost">Ver</Button>
                                                     </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
