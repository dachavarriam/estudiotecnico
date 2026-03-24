'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, FileText, Filter, Calendar, LogOut, CheckCircle, X } from 'lucide-react';
import { STUDY_STATUS_MAP } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { logout } from '@/actions/user-actions';

interface Study {
    id: string;
    clientName: string;
    engineerId?: string;
    status: string;
    date: string;
    createdAt?: string;
    startedAt?: string;
    submittedAt?: string;
    approvedAt?: string;
    type?: string;
    location?: string;
}

export function DashboardView({ initialStudies }: { initialStudies: Study[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const [studies] = useState<Study[]>(initialStudies);

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };
    
    // FILTERS STATE
    const [searchClient, setSearchClient] = useState('ALL');
    const [filterEngineer, setFilterEngineer] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // TOAST STATE
    const [showToast, setShowToast] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get('success')) {
            setShowToast(true);
            const t = setTimeout(() => {
                setShowToast(false);
                // Optional: Cleanup URL
                 router.replace('/dashboard'); 
            }, 4000);
            return () => clearTimeout(t);
        }
    }, [searchParams, router]);

    // UNIQUE ENGINEERS
    const engineers = useMemo(() => {
        const unique = new Set(studies.map(s => s.engineerId).filter(Boolean));
        return Array.from(unique);
    }, [studies]);

    // UNIQUE CLIENTS
    const uniqueClients = useMemo(() => {
        const unique = new Set(studies.map(s => s.clientName).filter(Boolean));
        return Array.from(unique);
    }, [studies]);

    // FILTER LOGIC
    const filteredStudies = useMemo(() => {
        return studies.filter(s => {
            const clientName = s.clientName || '';
            // If searchClient is 'ALL' or empty, match all. Else match exact name (since it's a select)
            const matchesClient = !searchClient || searchClient === 'ALL' || clientName === searchClient;
            
            const matchesEng = filterEngineer === 'ALL' || s.engineerId === filterEngineer;
            const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
            
            let matchesDate = true;
            if (dateStart) matchesDate = matchesDate && new Date(s.date) >= new Date(dateStart);
            if (dateEnd) matchesDate = matchesDate && new Date(s.date) <= new Date(dateEnd);

            return matchesClient && matchesEng && matchesStatus && matchesDate;
        });
    }, [studies, searchClient, filterEngineer, filterStatus, dateStart, dateEnd]);

    // KPI CALCULATIONS (On Filtered Data)
    const stats = useMemo(() => {
        const engineerStats: Record<string, number> = {};
        const clientStats: Record<string, number> = {};
        
        filteredStudies.forEach(s => {
            const eng = s.engineerId || 'Sin Asignar';
            engineerStats[eng] = (engineerStats[eng] || 0) + 1;
            
            const cli = s.clientName || 'Desconocido';
            clientStats[cli] = (clientStats[cli] || 0) + 1;
        });

        const topClients = Object.entries(clientStats)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        // Time Metrics
        const calcHours = (start?: string, end?: string) => {
            if (!start || !end) return null;
            const diff = new Date(end).getTime() - new Date(start).getTime();
            return diff > 0 ? diff / (1000 * 60 * 60) : null;
        };

        let totalReaction = 0, countReaction = 0;
        let totalExecution = 0, countExecution = 0;
        let totalReview = 0, countReview = 0;
        let totalCycle = 0, countCycle = 0;

        filteredStudies.forEach(s => {
            // Reaction
            const reaction = calcHours(s.createdAt, s.startedAt);
            if (reaction !== null) { totalReaction += reaction; countReaction++; }

            // Execution
            const execution = calcHours(s.startedAt, s.submittedAt);
            if (execution !== null) { totalExecution += execution; countExecution++; }

            // Review
            const review = calcHours(s.submittedAt, s.approvedAt);
            if (review !== null) { totalReview += review; countReview++; }
            
            // Total Cycle
            if (s.status === 'approved') {
                const cycle = calcHours(s.createdAt, s.approvedAt);
                if (cycle !== null) { totalCycle += cycle; countCycle++; }
            }
        });

        const formatHours = (val: number) => val < 1 ? `${Math.round(val * 60)} min` : `${val.toFixed(1)} hrs`;

        return {
            volume: filteredStudies.length,
            inProgress: filteredStudies.filter(s => s.status === 'in_progress').length,
            review: filteredStudies.filter(s => s.status === 'review').length,
            avgCycle: countCycle ? formatHours(totalCycle / countCycle) : '-',
            avgReaction: countReaction ? formatHours(totalReaction / countReaction) : '-',
            avgExecution: countExecution ? formatHours(totalExecution / countExecution) : '-',
            avgReview: countReview ? formatHours(totalReview / countReview) : '-',
            topClients
        };
    }, [filteredStudies]);

    // EXPORT TO CSV
    const handleExportCSV = () => {
        if (filteredStudies.length === 0) return alert('No hay datos para exportar.');
        
        const headers = ['ID', 'Cliente', 'Ingeniero', 'Estado', 'Fecha Creación', 'Inicio', 'Fin', 'Tipo', 'Ubicación'];
        const rows = filteredStudies.map(s => [
            s.id,
            `"${(s.clientName || '').replace(/"/g, '""')}"`, // Escape quotes and handle null
            s.engineerId || '',
            STUDY_STATUS_MAP[s.status as keyof typeof STUDY_STATUS_MAP] || s.status,
            new Date(s.date).toLocaleDateString(),
            s.startedAt ? new Date(s.startedAt).toLocaleString() : '',
            s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '',
            s.type || '',
            `"${(s.location || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','), 
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_estudios_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!mounted) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Cargando Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans relative">
            {/* FLOATING TOAST NOTIFICATION */}
            <div className={`fixed top-4 right-4 z-50 transition-all duration-500 transform ${showToast ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}`}>
                <div className="bg-white border-l-4 border-green-500 shadow-lg rounded-r-lg p-4 flex items-start gap-3 w-80">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900">¡Estudio Creado!</h4>
                        <p className="text-sm text-gray-500 mt-1">El estudio ha sido asignado correctamente al ingeniero.</p>
                    </div>
                    <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard de Gestión</h1>
                    <p className="text-gray-500 mt-1">Analítica y seguimiento de reportes técnicos.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                            <span className="material-symbols-outlined text-sm mr-2">arrow_back</span> Regresar
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <FileText className="w-4 h-4 mr-2" /> Exportar CSV
                    </Button>
                    <Link href="/estudios/engineer/dashboard">
                        <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 font-medium">
                            Mis Asignaciones
                        </Button>
                    </Link>
                    <Link href="/estudios/director/new">
                        <Button className="bg-primary-tas hover:bg-primary-tas/90 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Estudio
                        </Button>
                    </Link>
                </div>
            </div>

            {/* FILTERS BAR */}
            <Card className="bg-white border-primary-tas/20 shadow-sm">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                        <Select value={searchClient} onValueChange={setSearchClient}>
                            <SelectTrigger className="w-full truncate">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="ALL">Todos</SelectItem>
                                {uniqueClients.map((client: string) => (
                                    <SelectItem key={client} value={client}>
                                        <span className="truncate block max-w-[200px] text-sm" title={client}>{client}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Ingeniero</label>
                        <Select value={filterEngineer} onValueChange={setFilterEngineer}>
                            <SelectTrigger className="w-full truncate">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="ALL">Todos</SelectItem>
                                {engineers.map((eng: any) => (
                                    <SelectItem key={eng} value={eng}>
                                        <span className="truncate block max-w-[200px] text-sm" title={eng}>{eng}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos</SelectItem>
                                <SelectItem value="draft">Borrador</SelectItem>
                                <SelectItem value="in_progress">En Ejecución</SelectItem>
                                <SelectItem value="review">En Revisión</SelectItem>
                                <SelectItem value="approved">Aprobado</SelectItem>
                                <SelectItem value="rejected">Rechazado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Desde</label>
                        <Input 
                            type="date" 
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Hasta</label>
                         <Input 
                            type="date" 
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-gray-500">Volumen Filtrado</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{stats.volume}</div>
                        <p className="text-xs text-gray-400 mt-1">Estudios en selección</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-primary-tas">En Ejecución</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary-tas">{stats.inProgress}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-yellow-500">Por Revisar</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">{stats.review}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-green-500">Tiempo Ciclo</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{stats.avgCycle}</div>
                        <p className="text-xs text-gray-400 mt-1">Promedio (Creación &rarr; Aprobación)</p>
                    </CardContent>
                </Card>
            </div>

            {/* --- ANALYTICS ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader><CardTitle className="text-sm">Tiempos Promedio (Selección)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-gray-600">Reacción (Asignar &rarr; Iniciar)</span>
                            <span className="font-mono font-bold">{stats.avgReaction}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-gray-600">Ejecución (Sitio)</span>
                            <span className="font-mono font-bold">{stats.avgExecution}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-sm text-gray-600">Revisión (Director)</span>
                            <span className="font-mono font-bold">{stats.avgReview}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-sm">Top Clientes (Selección)</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {stats.topClients.map(([client, count], i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="text-sm font-bold w-6">{i+1}.</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{client}</span>
                                            <span className="text-gray-500">{count} estudios</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary-tas rounded-full shadow-sm" 
                                                style={{ width: `${(count / (stats.volume || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {stats.topClients.length === 0 && <p className="text-sm text-gray-400">Sin datos suficientes.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* TABLE */}
             <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription>Mostrando {filteredStudies.length} de {studies.length} estudios.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Ingeniero</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                                        No se encontraron resultados con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStudies.map((study) => (
                                    <TableRow key={study.id}>
                                        <TableCell className="font-medium">#{study.id}</TableCell>
                                        <TableCell className="font-bold text-gray-700">
                                            {study.clientName}
                                            <div className="text-xs text-gray-400 font-normal">{study.type || 'General'}</div>
                                        </TableCell>
                                        <TableCell>{study.engineerId || 'Demo Engineer'}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                                                ${study.status === 'draft' || !study.status ? 'bg-gray-100 text-gray-600' : ''}
                                                ${study.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                                                ${study.status === 'review' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                ${study.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                                                ${study.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
                                            `}>
                                                {STUDY_STATUS_MAP[study.status as keyof typeof STUDY_STATUS_MAP] || study.status || 'Borrador'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-xs">
                                            {new Date(study.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/estudios/engineer/study/${study.id}`}>
                                                <Button size="sm" variant="outline" className="h-8 hover:bg-primary-tas/5 hover:text-primary-tas hover:border-primary-tas/50 transition-colors">
                                                    <FileText className="w-3.5 h-3.5 mr-1" /> Ver
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            </div>
        </div>
    );
}
