'use client';

import { useState } from 'react';

import { Button } from "@/components/ui/button";
import { User, Shield } from "lucide-react";
import { useRouter } from 'next/navigation';

export function MockAuthToggle({ users }: { users: any[] }) {
    const router = useRouter();

    const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');
    const engineers = users.filter(u => u.Role === 'engineer' || u.role === 'engineer');

    const handleLogin = async (role: string, specificUserId?: string) => {
        let user;
        if (specificUserId) {
            user = users.find(u => String(u.Id) === String(specificUserId));
        } else {
             user = users.find(u => u.Role === role || u.role === role);
        }

        if (!user) {
            alert(`No user found for role: ${role}`);
            return;
        }

        try {
            const { login } = await import('@/actions/user-actions');
            // Use Slack ID if available, otherwise fallback to internal ID
            const loginId = user['Slack ID'] || user.slack_id || String(user.Id) || 'mock_id';
            await login(loginId, role, user.Name || user.name);
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <Button 
                onClick={() => handleLogin('director')}
                className="w-full bg-blue-600 hover:bg-blue-700"
            >
                <Shield className="mr-2 h-4 w-4" /> Simular Director
            </Button>
            
            <select 
                className="w-full p-2 border rounded-md text-sm bg-white text-black"
                onChange={(e) => setSelectedEngineerId(e.target.value)}
                value={selectedEngineerId}
            >
                <option value="">-- Seleccionar Ingeniero ({engineers.length}) --</option>
                {engineers.map((eng: any) => (
                    <option key={eng.Id || eng.id} value={eng.Id || eng.id}>
                        {eng.Name || eng.name}
                    </option>
                ))}
            </select>

            <Button 
                onClick={() => {
                    if (!selectedEngineerId) {
                        alert(`Por favor selecciona un ingeniero primero. (Encontrados: ${engineers.length})`);
                        return;
                    }
                    handleLogin('engineer', selectedEngineerId);
                }}
                variant="outline" 
                className="w-full border-gray-400 text-black hover:bg-gray-100"
            >
                <User className="mr-2 h-4 w-4" /> Simular {selectedEngineerId ? 'Seleccionado' : 'Ingeniero'}
            </Button>

            <p className="text-xs text-center text-gray-400 mt-2">
                * Modo Desarrollo: Sin contraseña
            </p>
        </div>
    );
}
