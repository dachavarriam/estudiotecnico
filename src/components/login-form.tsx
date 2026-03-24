'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock, Mail } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (result?.error) {
      setError('Las credenciales ingresadas son incorrectas.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {error && <p className="text-primary-tas bg-primary-tas/10 text-sm text-center font-bold rounded-lg p-3 border border-primary-tas/20">{error}</p>}
      
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="email"
            placeholder="ejemplo@tas.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 pl-10 border-slate-300 focus-visible:ring-primary-tas bg-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 pl-10 border-slate-300 focus-visible:ring-primary-tas bg-white"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full h-12 bg-primary-tas hover:bg-black text-white font-bold text-lg mt-2 transition-all">
        {loading ? 'Validando...' : 'Iniciar Sesión'}
      </Button>

      <div className="text-center mt-4">
          <Button variant="link" type="button" onClick={() => router.push('/register')} className="text-sm text-primary-tas">
              ¿No tienes cuenta? Solicita acceso aquí
          </Button>
      </div>
    </form>
  )
}
