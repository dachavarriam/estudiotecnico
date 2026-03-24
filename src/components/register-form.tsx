'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Mail, User } from 'lucide-react'
import { registerNewUser } from '@/actions/user-actions'

export function RegisterForm() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget);
    const result = await registerNewUser(formData);

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
          router.push('/')
      }, 2000)
    }
  }

  if (success) {
      return (
          <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">¡Cuenta Creada!</h3>
              <p className="text-slate-500">Puedes iniciar sesión en el portal.</p>
          </div>
      )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {error && <p className="text-primary-tas bg-primary-tas/10 text-sm text-center font-bold rounded-lg p-3 border border-primary-tas/20">{error}</p>}
      
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nombre Completo</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            name="name"
            type="text"
            placeholder="Juan Perez"
            required
            className="h-12 pl-10 border-slate-300 focus-visible:ring-primary-tas bg-white"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Correo Corporativo</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            name="email"
            type="email"
            placeholder="ejemplo@tas.com"
            required
            className="h-12 pl-10 border-slate-300 focus-visible:ring-primary-tas bg-white"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={6}
            className="h-12 pl-10 border-slate-300 focus-visible:ring-primary-tas bg-white"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-12 bg-slate-800 hover:bg-black text-white font-bold text-lg mt-4 transition-all">
        {loading ? 'Registrando...' : 'Crear Cuenta'}
      </Button>

      <div className="text-center mt-4">
          <Button variant="link" type="button" onClick={() => router.push('/')} className="text-sm text-primary-tas">
              Volver al Inicio de Sesión
          </Button>
      </div>
    </form>
  )
}
