'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, CheckCircle, AlertCircle, ArrowRight, Play, LogOut } from 'lucide-react';
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
    
    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    const pending = studies.filter(s => s.status === 'draft' || !s.status);
    const inProgress = studies.filter(s => s.status === 'in_progress');
    const history = studies.filter(s => ['review', 'approved', 'rejected'].includes(s.status));

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hola, {engineerName} 👋</h1>
                        <p className="text-gray-500">Aquí tienes tus asignaciones para hoy.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="w-4 h-4 mr-2" /> Salir
                    </Button>
                </div>

                {/* ACTIVE WORK CARD (If any) */}
                {inProgress.length > 0 && (
                     <Card className="border-blue-500 bg-blue-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-blue-700 flex items-center gap-2">
                                <Clock className="w-5 h-5 animate-pulse" /> En Ejecución Ahora
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {inProgress.map(study => (
                                <div key={study.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-2 last:mb-0">
                                    <div>
                                        <h3 className="font-bold text-lg">{study.clientName}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {study.location || 'Sin ubicación'}
                                        </p>
                                    </div>
                                    <Link href={`/engineer/study/${study.id}`}>
                                        <Button className="bg-blue-600 hover:bg-blue-700">
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
                        <TabsTrigger value="pending">Pendientes ({pending.length})</TabsTrigger>
                        <TabsTrigger value="history">Historial</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="pending" className="space-y-4 mt-4">
                        {pending.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-medium">¡Todo al día!</h3>
                                <p className="text-gray-500">No tienes estudios pendientes por iniciar.</p>
                            </div>
                        ) : (
                            pending.map(study => (
                                <Card key={study.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-5 flex justify-between items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">#{study.id}</Badge>
                                                <span className="text-xs text-gray-400">{new Date(study.date).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="font-bold text-lg">{study.clientName}</h3>
                                            <p className="text-sm text-gray-500">{study.type || 'Estudio Técnico General'}</p>
                                        </div>
                                        <Link href={`/engineer/study/${study.id}`}>
                                            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
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
                                    <div className="p-8 text-center text-gray-500">Sin historial aún.</div>
                                ) : (
                                    <div className="divide-y">
                                        {history.map(study => (
                                            <div key={study.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium">{study.clientName}</p>
                                                    <p className="text-xs text-gray-500">Finalizado: {study.submittedAt ? new Date(study.submittedAt).toLocaleDateString() : '-'}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                     <Badge className={`
                                                        ${study.status === 'review' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : ''}
                                                        ${study.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                                        ${study.status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-100' : ''}
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
