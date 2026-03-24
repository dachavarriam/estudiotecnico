'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Mail, Phone, Briefcase, User, MapPin, MessageSquare } from 'lucide-react';

interface Employee {
    Id: number;
    Name: string;
    email?: string;
    Role?: string;
    Phone?: string;
    Department?: string;
    Location?: string;
    [key: string]: any;
}

export function EmployeeDirectoryView({ initialEmployees }: { initialEmployees: Employee[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');

    // Extract unique roles for the filter
    const roles = Array.from(new Set(initialEmployees.map(e => e.Role || 'Sin Rol').filter(Boolean)));

    const filteredEmployees = initialEmployees.filter(emp => {
        const matchesSearch = 
            (emp.Name && emp.Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (emp.Department && emp.Department.toLowerCase().includes(searchQuery.toLowerCase()));
            
        const matchesRole = selectedRole === 'ALL' || (emp.Role || 'Sin Rol') === selectedRole;
        
        return matchesSearch && matchesRole;
    });

    const getInitials = (name: string) => {
        if (!name) return 'UN';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans w-full max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Directorio de Empleados</h1>
                    <p className="text-gray-500 mt-1">Encuentra a tus compañeros de equipo y su información de contacto.</p>
                </div>
            </div>

            {/* FILTERS */}
            <Card className="bg-white border-primary-tas/20 shadow-sm">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="relative md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input 
                            placeholder="Buscar por nombre, correo o departamento..." 
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        <Button 
                            variant={selectedRole === 'ALL' ? 'default' : 'outline'} 
                            onClick={() => setSelectedRole('ALL')}
                            className={`whitespace-nowrap ${selectedRole === 'ALL' ? 'bg-primary-tas' : ''}`}
                            size="sm"
                        >
                            Todos
                        </Button>
                        {roles.map(role => (
                            <Button 
                                key={role}
                                variant={selectedRole === role ? 'default' : 'outline'} 
                                onClick={() => setSelectedRole(role)}
                                className={`whitespace-nowrap ${selectedRole === role ? 'bg-primary-tas text-white' : ''}`}
                                size="sm"
                            >
                                {role}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* EMPLOYEE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEmployees.map((emp) => (
                    <Card key={emp.Id} className="hover:shadow-md transition-shadow group flex flex-col h-full overflow-hidden border-t-4 border-t-primary-tas">
                        <CardHeader className="p-6 text-center flex-none">
                            <div className="flex justify-center mb-4 relative">
                                <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${emp.Name}&backgroundColor=C33E34`} alt={emp.Name} />
                                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xl font-bold">{getInitials(emp.Name)}</AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary-tas transition-colors truncate" title={emp.Name}>
                                {emp.Name}
                            </CardTitle>
                            <p className="text-sm font-medium text-gray-500 mt-1 capitalize">{emp.Role || 'Usuario'}</p>
                            
                            <div className="mt-3 flex justify-center">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-normal shadow-none">
                                    {emp.Department || 'TAS HUB Team'}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-6 bg-gray-50/50 border-t flex-1 flex flex-col justify-between">
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="truncate" title={emp.email}>{emp.email || 'Sin correo asociado'}</span>
                                </div>
                                {(emp.Phone || emp.Celular || emp.Telefono) && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{emp.Phone || emp.Celular || emp.Telefono}</span>
                                    </div>
                                )}
                                {(emp.Location || emp.Ubicacion) && (
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{emp.Location || emp.Ubicacion}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <Button variant="outline" className="w-full text-gray-600 hover:text-gray-900 border-gray-200" onClick={() => window.location.href = `mailto:${emp.email}`}>
                                    <Mail className="w-4 h-4 mr-2" /> Correo
                                </Button>
                                {/* Opcional: Si se maneja Slack ID */}
                                {emp['Slack ID'] || emp.slack_id ? (
                                    <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => window.open(`https://slack.com/app_redirect?user=${emp['Slack ID'] || emp.slack_id}`, '_blank')}>
                                        <MessageSquare className="w-4 h-4 mr-2" /> Slack
                                    </Button>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredEmployees.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900">Sin Resultados</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">No se ha encontrado a ningún empleado que coincida con "{searchQuery}".</p>
                    <Button variant="outline" className="mt-6" onClick={() => setSearchQuery('')}>Limpiar Búsqueda</Button>
                </div>
            )}
        </div>
    );
}
