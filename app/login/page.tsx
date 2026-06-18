'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { KeyRound, Loader2, ChevronRight, User } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Erro ao entrar.')

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="bg-sky flex min-h-screen w-full items-center justify-center p-6"
    >
      <div className="w-full max-w-sm card-in">
        <div className="mb-8 flex flex-col items-center gap-3">
          <h1 className="logo-shimmer-dark logo-glow-dark text-5xl font-black tracking-tight">
            Mrclrlq
          </h1>
        </div>

        <div
          className="rounded-2xl border border-zinc-200/80 p-6 hover-lift shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
          style={{ backgroundColor: 'rgb(255, 255, 255)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Usuário
              </Label>
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 transition-all duration-300 focus-within:border-zinc-900/40 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                   style={{ backgroundColor: 'rgb(248, 248, 248)' }}>
                <User className="h-4 w-4 text-zinc-500 shrink-0" />
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mrcrlq"
                  className="flex-1 bg-transparent text-zinc-900 placeholder-zinc-400 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                Senha
              </Label>
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 transition-all duration-300 focus-within:border-zinc-900/40 focus-within:shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
                   style={{ backgroundColor: 'rgb(248, 248, 248)' }}>
                <KeyRound className="h-4 w-4 text-zinc-500 shrink-0" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-zinc-900 focus:outline-none text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-1 duration-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group button-shine relative flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-zinc-900 text-white font-bold text-sm uppercase tracking-wider hover:bg-black hover:scale-[1.02] active:scale-[0.97] hover:shadow-[0_0_30px_rgba(0,0,0,0.18)] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>ENTRAR</span>
                  <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
