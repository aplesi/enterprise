'use client'
export const runtime = 'edge';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fish, Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Email atau password salah')
      }
    } catch {
      setError('Terjadi kesalahan, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 gradient-hero overflow-hidden">
      {/* Background blur circles */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-aqua-glow/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua/10 blur-3xl" />

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl gradient-aqua shadow-glow">
            <Fish className="h-8 w-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Aplesi Admin
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Masuk ke panel admin Aplesi
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">
              Email
            </label>
            <div className="group relative flex items-center rounded-xl border border-white/15 bg-white/5 transition-all focus-within:border-aqua-glow/60 focus-within:bg-white/10">
              <div className="pointer-events-none flex items-center pl-4 text-white/40">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aplesi.my.id"
                className="h-12 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">
              Password
            </label>
            <div className="group relative flex items-center rounded-xl border border-white/15 bg-white/5 transition-all focus-within:border-aqua-glow/60 focus-within:bg-white/10">
              <div className="pointer-events-none flex items-center pl-4 text-white/40">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus:outline-none"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl gradient-aqua py-3.5 text-sm font-bold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              'Masuk ke Admin Panel'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-white/30">
          Aplesi Enterprise · Panel Admin
        </p>
      </div>
    </div>
  )
}
