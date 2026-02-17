'use client';

import { Button } from "@/components/ui/button";
import { User, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Simple cookie helper
const setCookie = (name: string, value: string, days = 7) => {
    const d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export function MockAuthToggle() {
    const [role, setRole] = useState<string>('director');
    const router = useRouter();

    useEffect(() => {
        const r = getCookie('mock_role') || 'director';
        setRole(r);
    }, []);

    const toggle = () => {
        const newRole = role === 'director' ? 'engineer' : 'director';
        setCookie('mock_role', newRole);
        setRole(newRole);
        
        // Auto-redirect for convenience
        if (newRole === 'engineer') router.push('/engineer/dashboard');
        else router.push('/dashboard');
        
        setTimeout(() => window.location.reload(), 100); // Reload to re-fetch data context
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Button 
                onClick={toggle}
                className={`shadow-lg border-2 ${role === 'director' ? 'bg-purple-900 border-purple-500' : 'bg-orange-800 border-orange-500'}`}
            >
                {role === 'director' ? <Shield className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
                {role === 'director' ? 'Modo Director' : 'Modo Ingeniero'}
            </Button>
        </div>
    );
}
