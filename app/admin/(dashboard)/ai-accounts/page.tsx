'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  KeyRound,
  Link2,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  RouterAccountQuotaResult,
  RouterHealthStatus,
  RouterStorageSource,
  SanitizedRouterAccount,
} from '@/types'

interface OAuthSessionState {
  authUrl: string
  state: string
  redirectUri: string
  mode: 'auto_popup' | 'manual_copy'
  expiresInSec: number
}

interface NoticeBanner {
  type: 'success' | 'error' | 'info'
  message: string
}

const MODEL_LABELS: Record<string, string> = {
  'gemini-3.1-flash-image': 'Gambar (Gemini 3.1 Flash Image)',
  'gemini-3-flash': 'Teks Cepat (Gemini 3 Flash)',
  'claude-sonnet-4-6': 'Artikel (Claude Sonnet 4.6)',
  'claude-opus-4-6-thinking': 'Thinking (Claude Opus 4.6)',
  'gemini-2.5-pro': 'Pro (Gemini 2.5 Pro)',
}

function formatDateTimeId(iso?: string | null): string {
  if (!iso) return '-'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCooldownRemaining(cooldownUntilMs: number | null, nowMs: number): string {
  if (!cooldownUntilMs || cooldownUntilMs <= nowMs) return ''
  const sec = Math.max(1, Math.ceil((cooldownUntilMs - nowMs) / 1000))
  if (sec < 60) return `${sec} detik`
  const min = Math.ceil(sec / 60)
  return `${min} menit`
}

function getQuotaBarColor(percent: number | null): string {
  if (percent === null) return 'bg-white/20'
  if (percent >= 50) return 'bg-emerald-400'
  if (percent >= 20) return 'bg-amber-400'
  return 'bg-red-400'
}

export default function AiAccountsPage() {
  const [accounts, setAccounts] = useState<SanitizedRouterAccount[]>([])
  const [totalAccounts, setTotalAccounts] = useState(0)
  const [activeAccounts, setActiveAccounts] = useState(0)
  const [storageSource, setStorageSource] = useState<RouterStorageSource>('env_secret_fallback')
  const [health, setHealth] = useState<RouterHealthStatus | null>(null)
  const [quotaMap, setQuotaMap] = useState<Record<string, RouterAccountQuotaResult>>({})
  const [lastQuotaCheckedAt, setLastQuotaCheckedAt] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [checkingAllQuota, setCheckingAllQuota] = useState(false)
  const [checkingAccountEmail, setCheckingAccountEmail] = useState<string | null>(null)
  const [mutatingEmail, setMutatingEmail] = useState<string | null>(null)
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null)
  const [syncingEnv, setSyncingEnv] = useState(false)
  const [notice, setNotice] = useState<NoticeBanner | null>(null)
  const [nowMs, setNowMs] = useState<number>(() => Date.now())

  // State modal OAuth
  const [oauthModalOpen, setOauthModalOpen] = useState(false)
  const [oauthTargetLabel, setOauthTargetLabel] = useState<string | null>(null)
  const [oauthSession, setOauthSession] = useState<OAuthSessionState | null>(null)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [oauthExchanging, setOauthExchanging] = useState(false)
  const [callbackInput, setCallbackInput] = useState('')

  const loadAccounts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/router-accounts', { cache: 'no-store' })
      const json = (await res.json()) as {
        success: boolean
        error?: string
        data?: {
          accounts: SanitizedRouterAccount[]
          totalAccounts: number
          activeAccounts: number
          storageSource: RouterStorageSource
          health: RouterHealthStatus | null
        }
      }

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal memuat daftar akun AI Router')
      }

      setAccounts(json.data.accounts)
      setTotalAccounts(json.data.totalAccounts)
      setActiveAccounts(json.data.activeAccounts)
      setStorageSource(json.data.storageSource)
      setHealth(json.data.health)
      setNowMs(Date.now())
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memuat daftar akun AI Router',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  const submitOAuthExchange = useCallback(
    async (payload: { callbackUrl?: string; code?: string; state?: string }) => {
      setOauthExchanging(true)
      setNotice(null)
      try {
        const res = await fetch('/api/admin/router-accounts/oauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'exchange',
            ...payload,
          }),
        })
        const json = (await res.json()) as {
          success: boolean
          error?: string
          data?: {
            action: 'created' | 'updated'
            account: SanitizedRouterAccount
          }
        }

        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error || 'Gagal menukarkan kode OAuth Google')
        }

        const verb = json.data.action === 'created' ? 'ditambahkan' : 'diperbarui (re-login)'
        setNotice({
          type: 'success',
          message: `Akun ${json.data.account.email} (${json.data.account.projectId}) berhasil ${verb} ke pool Cloudflare 24/7.`,
        })
        setOauthModalOpen(false)
        setOauthSession(null)
        setCallbackInput('')
        setOauthTargetLabel(null)
        await loadAccounts(true)
      } catch (err) {
        setNotice({
          type: 'error',
          message: err instanceof Error ? err.message : 'Gagal menyimpan akun Google OAuth',
        })
      } finally {
        setOauthExchanging(false)
      }
    },
    [loadAccounts]
  )

  // Tangkap callback popup otomatis saat Admin berjalan di localhost
  useEffect(() => {
    if (!oauthModalOpen) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const payload = event.data as
        | {
            type?: string
            code?: string
            state?: string
            error?: string
            errorDescription?: string
          }
        | undefined

      if (!payload || payload.type !== 'aplesi_ag_oauth_callback') return

      if (payload.error && !payload.code) {
        setNotice({
          type: 'error',
          message: `Otorisasi Google dibatalkan: ${payload.errorDescription || payload.error}`,
        })
        return
      }

      if (payload.code && payload.state) {
        void submitOAuthExchange({
          code: payload.code,
          state: payload.state,
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [oauthModalOpen, submitOAuthExchange])

  const openOAuthModal = async (reloginEmail?: string) => {
    setOauthModalOpen(true)
    setOauthTargetLabel(reloginEmail ?? null)
    setCallbackInput('')
    setOauthLoading(true)
    setNotice(null)

    try {
      const res = await fetch('/api/admin/router-accounts/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'authorize' }),
      })
      const json = (await res.json()) as {
        success: boolean
        error?: string
        data?: OAuthSessionState
      }

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal membuat link otorisasi OAuth Google')
      }

      setOauthSession(json.data)
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyiapkan sesi OAuth Google',
      })
      setOauthSession(null)
    } finally {
      setOauthLoading(false)
    }
  }

  const handleOpenGooglePopup = () => {
    if (!oauthSession?.authUrl) return
    const width = 560
    const height = 720
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
    window.open(
      oauthSession.authUrl,
      'aplesi_antigravity_oauth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    )
  }

  const handleCheckQuota = async (email?: string) => {
    if (email) {
      setCheckingAccountEmail(email)
    } else {
      setCheckingAllQuota(true)
    }
    setNotice(null)

    try {
      const res = await fetch('/api/admin/router-accounts/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email ? { email } : {}),
      })
      const json = (await res.json()) as {
        success: boolean
        error?: string
        data?: {
          checkedAt: string
          totalChecked: number
          results: RouterAccountQuotaResult[]
        }
      }

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal memeriksa kuota akun Google')
      }

      const checkedResults = json.data.results
      setQuotaMap((prev) => {
        const next = { ...prev }
        for (const item of checkedResults) {
          next[item.email.toLowerCase()] = item
        }
        return next
      })
      setLastQuotaCheckedAt(json.data.checkedAt)

      const revokedCount = checkedResults.filter((item) => item.authStatus === 'revoked').length
      if (revokedCount > 0) {
        setNotice({
          type: 'error',
          message: `Pengecekan kuota selesai (${checkedResults.length} akun), tetapi ${revokedCount} akun berstatus token kedaluwarsa/revoked. Segera klik Re-login pada akun tersebut.`,
        })
      } else {
        setNotice({
          type: 'success',
          message: `Status kuota real-time untuk ${checkedResults.length} akun berhasil diperbarui.`,
        })
      }
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengecek kuota akun',
      })
    } finally {
      setCheckingAllQuota(false)
      setCheckingAccountEmail(null)
    }
  }

  const handleToggleAccount = async (account: SanitizedRouterAccount) => {
    setMutatingEmail(account.email)
    setNotice(null)
    try {
      const nextActive = !account.isActive
      const res = await fetch('/api/admin/router-accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          isActive: nextActive,
        }),
      })
      const json = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah status akun')
      }
      setNotice({
        type: 'success',
        message: `Akun ${account.email} sekarang ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
      })
      await loadAccounts(true)
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memperbarui status akun',
      })
    } finally {
      setMutatingEmail(null)
    }
  }

  const handleAdjustPriority = async (account: SanitizedRouterAccount, delta: -1 | 1) => {
    const nextPriority = Math.max(1, account.priority + delta)
    if (nextPriority === account.priority) return

    setMutatingEmail(account.email)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/router-accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: account.email,
          priority: nextPriority,
        }),
      })
      const json = (await res.json()) as { success: boolean; error?: string }
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengubah prioritas akun')
      }
      await loadAccounts(true)
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengubah prioritas akun',
      })
    } finally {
      setMutatingEmail(null)
    }
  }

  const handleDeleteAccount = async (email: string) => {
    setMutatingEmail(email)
    setNotice(null)
    try {
      const res = await fetch(
        `/api/admin/router-accounts?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      )
      const json = (await res.json()) as {
        success: boolean
        error?: string
        data?: { remainingCount: number }
      }
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menghapus akun')
      }
      setConfirmDeleteEmail(null)
      setQuotaMap((prev) => {
        const next = { ...prev }
        delete next[email.toLowerCase()]
        return next
      })
      setNotice({
        type: 'success',
        message: `Akun ${email} berhasil dihapus dari pool Worker. Tersisa ${json.data?.remainingCount ?? 0} akun.`,
      })
      await loadAccounts(true)
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus akun',
      })
    } finally {
      setMutatingEmail(null)
    }
  }

  const handleSyncFromEnv = async (mode: 'merge' | 'reset') => {
    setSyncingEnv(true)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/router-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-env', mode }),
      })
      const json = (await res.json()) as {
        success: boolean
        error?: string
        data?: { added: number; updated: number; total: number }
      }
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Gagal melakukan sinkronisasi dengan env secret')
      }
      setNotice({
        type: 'success',
        message: `Sinkronisasi (${mode === 'merge' ? 'Gabung Aman' : 'Reset ke Env'}) selesai: +${json.data.added} baru, ${json.data.updated} diperbarui, total ${json.data.total} akun.`,
      })
      await loadAccounts(true)
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyinkronkan akun dari Env Secret',
      })
    } finally {
      setSyncingEnv(false)
    }
  }

  const revokedAccountsCount = Object.values(quotaMap).filter(
    (item) => item.authStatus === 'revoked'
  ).length

  return (
    <div className="space-y-6">
      {/* Header & Aksi Utama */}
      <div className="rounded-2xl border border-slate-600/50 bg-[#091526]/90 p-5 md:p-6 shadow-xl flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Cloudflare Edge Pool 24/7 (Mandiri)
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white mt-1.5">
            Manajemen Akun Google AI Router
          </h1>
          <p className="text-sm text-slate-200 mt-1.5 leading-relaxed">
            Tambah, hapus, nonaktifkan, atau cek kuota akun Google Antigravity langsung dari panel
            tanpa bergantung pada 9Router lokal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 xl:justify-end shrink-0">
          <button
            type="button"
            onClick={() => void openOAuthModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-300 transition"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Hubungkan Akun Google
          </button>

          <button
            type="button"
            onClick={() => void handleCheckQuota()}
            disabled={checkingAllQuota || accounts.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/60 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-slate-800 hover:text-white disabled:opacity-40 transition"
          >
            <Activity className={cn('h-4 w-4', checkingAllQuota && 'animate-spin')} />
            {checkingAllQuota ? 'Mengecek Kuota...' : 'Cek Semua Kuota'}
          </button>

          <button
            type="button"
            onClick={() => void handleSyncFromEnv('merge')}
            disabled={syncingEnv}
            title="Gabungkan akun dari secret ANTIGRAVITY_ACCOUNTS tanpa menimpa akun OAuth baru"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-500/80 bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <RefreshCw className={cn('h-4 w-4', syncingEnv && 'animate-spin')} />
            Sync Env (Merge)
          </button>

          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-900/90 px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition"
          >
            Pengaturan Router
          </Link>
        </div>
      </div>

      {/* Banner Notifikasi */}
      {notice && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3.5 text-sm font-medium flex items-start justify-between gap-3 shadow-md',
            notice.type === 'success' &&
              'border-emerald-400/60 bg-emerald-950/90 text-emerald-100',
            notice.type === 'error' && 'border-red-400/60 bg-red-950/90 text-red-100',
            notice.type === 'info' && 'border-cyan-400/60 bg-slate-900/95 text-cyan-100'
          )}
        >
          <div className="flex items-start gap-2.5">
            {notice.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-300" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-300" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-slate-300 hover:text-white shrink-0"
            aria-label="Tutup notifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Ringkasan Status Edge & Pool */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-600/50 bg-[#091526]/90 p-4 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Status Cloudflare Worker
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-white">
              {health?.status === 'online' ? 'Online 24/7' : loading ? 'Memuat...' : 'Perlu Cek'}
            </span>
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                health?.status === 'online'
                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-200'
                  : 'border-amber-400/60 bg-amber-500/20 text-amber-200'
              )}
            >
              {health?.version ? `v${health.version}` : 'Edge'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300">
            Sumber data:{' '}
            <span className="text-white font-semibold">
              {storageSource === 'kv' ? 'Cloudflare KV (Terenkripsi)' : 'Env Secret Fallback'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-600/50 bg-[#091526]/90 p-4 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Pool Akun Aktif
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-300">{activeAccounts}</span>
            <span className="text-sm text-slate-200 font-medium">
              / {totalAccounts} akun terdaftar
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300">
            Rotasi round-robin otomatis + auto-skip cooldown 429
          </div>
        </div>

        <div className="rounded-xl border border-slate-600/50 bg-[#091526]/90 p-4 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Keamanan &amp; OAuth
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck
              className={cn(
                'h-4 w-4',
                health?.encryptionConfigured ? 'text-emerald-400' : 'text-amber-400'
              )}
            />
            {health?.encryptionConfigured ? 'AES-256-GCM Aktif' : 'Kunci Enkripsi Fallback'}
          </div>
          <div className="mt-2 text-xs text-slate-300 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-cyan-300" />
            {health?.oauthConfigured
              ? 'Client ID Google OAuth siap'
              : 'Cek secret ANTIGRAVITY_CLIENT_ID'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-600/50 bg-[#091526]/90 p-4 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Kesehatan Token &amp; Kuota
          </div>
          <div className="mt-2 text-lg font-bold text-white">
            {revokedAccountsCount > 0 ? (
              <span className="text-red-300">{revokedAccountsCount} Perlu Re-login</span>
            ) : lastQuotaCheckedAt ? (
              <span className="text-emerald-300">Semua Terverifikasi</span>
            ) : (
              <span className="text-slate-100">Belum Dicek</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-300">
            {lastQuotaCheckedAt
              ? `Terakhir dicek: ${formatDateTimeId(lastQuotaCheckedAt)}`
              : 'Klik "Cek Semua Kuota" untuk menarik data Google'}
          </div>
        </div>
      </div>

      {/* Daftar Akun */}
      {loading ? (
        <div className="rounded-xl border border-slate-600/50 bg-[#091526]/90 p-8 text-center text-sm font-medium text-slate-200">
          Memuat daftar akun Google AI Router dari Cloudflare Worker...
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-slate-600/50 bg-[#091526]/90 p-8 text-center space-y-3">
          <p className="text-base font-bold text-white">
            Belum ada akun Google Antigravity di pool Worker
          </p>
          <p className="text-sm text-slate-200 max-w-lg mx-auto">
            Klik &ldquo;Hubungkan Akun Google&rdquo; untuk login OAuth atau klik &ldquo;Sync Env
            (Merge)&rdquo; jika secret{' '}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-200">
              ANTIGRAVITY_ACCOUNTS
            </code>{' '}
            sudah terpasang di Cloudflare.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const quota = quotaMap[account.email.toLowerCase()]
            const cooldownText = formatCooldownRemaining(account.cooldownUntilMs, nowMs)
            const isMutating = mutatingEmail === account.email
            const isCheckingQuota = checkingAccountEmail === account.email
            const isRevoked = quota?.authStatus === 'revoked'
            const isQuotaError = quota?.authStatus === 'error'

            return (
              <div
                key={account.email}
                className={cn(
                  'rounded-xl border p-4 md:p-5 shadow-md transition',
                  isRevoked
                    ? 'border-red-400/70 bg-[#230e16]/95'
                    : account.isActive
                      ? 'border-slate-600/55 bg-[#091526]/90'
                      : 'border-slate-700/70 bg-[#060e1a]/90'
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Info Utama Akun */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center rounded-md border border-slate-500/80 bg-slate-800 px-2.5 py-0.5 text-xs font-mono font-bold text-white">
                        #{account.priority}
                      </span>
                      <h2 className="text-base font-bold text-white">{account.email}</h2>

                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-400/70 bg-red-500/30 px-2.5 py-0.5 text-xs font-bold text-red-100">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Token Kedaluwarsa — Perlu Re-login
                        </span>
                      ) : !account.isActive ? (
                        <span className="inline-flex items-center rounded-full border border-slate-500 bg-slate-700 px-2.5 py-0.5 text-xs font-semibold text-slate-100">
                          Nonaktif
                        </span>
                      ) : cooldownText ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/25 px-2.5 py-0.5 text-xs font-semibold text-amber-100">
                          <Clock className="h-3.5 w-3.5" />
                          Cooldown {cooldownText}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-400/60 bg-emerald-500/25 px-2.5 py-0.5 text-xs font-semibold text-emerald-100">
                          Aktif
                        </span>
                      )}

                      {isQuotaError && quota?.errorMessage && (
                        <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-100">
                          Error cek kuota
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-300">
                      <span>
                        Project ID:{' '}
                        <code className="rounded bg-slate-800/90 px-1.5 py-0.5 text-cyan-200 font-mono font-medium">
                          {account.projectId}
                        </code>
                      </span>
                      <span>
                        Mask: <span className="text-slate-100 font-medium">{account.maskedEmail}</span>
                      </span>
                      {account.updatedAt && (
                        <span>
                          Diperbarui:{' '}
                          <span className="text-slate-100 font-medium">
                            {formatDateTimeId(account.updatedAt)}
                          </span>
                        </span>
                      )}
                    </div>

                    {quota?.errorMessage && (
                      <p className="text-xs font-medium text-red-200 mt-1">{quota.errorMessage}</p>
                    )}
                  </div>

                  {/* Tombol Aksi Per Akun */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="inline-flex items-center rounded-lg border border-slate-600 bg-slate-900">
                      <button
                        type="button"
                        disabled={isMutating || account.priority <= 1}
                        onClick={() => void handleAdjustPriority(account, -1)}
                        title="Naikkan prioritas rotasi"
                        className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-l-lg disabled:opacity-35"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => void handleAdjustPriority(account, 1)}
                        title="Turunkan prioritas rotasi"
                        className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded-r-lg border-l border-slate-600 disabled:opacity-35"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isCheckingQuota || checkingAllQuota}
                      onClick={() => void handleCheckQuota(account.email)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/80 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-800 disabled:opacity-40 transition"
                    >
                      <Activity className={cn('h-3.5 w-3.5', isCheckingQuota && 'animate-spin')} />
                      Cek Kuota
                    </button>

                    <button
                      type="button"
                      onClick={() => void openOAuthModal(account.email)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                        isRevoked
                          ? 'border-red-400/70 bg-red-500/35 text-red-50 hover:bg-red-500/50'
                          : 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/35'
                      )}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Re-login
                    </button>

                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => void handleToggleAccount(account)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40',
                        account.isActive
                          ? 'border-amber-400/60 bg-amber-500/20 text-amber-100 hover:bg-amber-500/35'
                          : 'border-emerald-400/60 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/35'
                      )}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {account.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    {confirmDeleteEmail === account.email ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => void handleDeleteAccount(account.email)}
                          className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-red-400 disabled:opacity-40"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEmail(null)}
                          className="rounded-lg border border-slate-500 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteEmail(account.email)}
                        title="Hapus akun dari pool"
                        className="inline-flex items-center gap-1 rounded-lg border border-red-400/50 bg-red-500/20 px-2.5 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/35 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar Kuota Per Model */}
                {quota && quota.models.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {quota.models.map((model) => (
                      <div
                        key={model.modelId}
                        className="rounded-lg border border-slate-600/60 bg-slate-950/90 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span
                            className="font-medium text-slate-200 truncate"
                            title={model.modelId}
                          >
                            {MODEL_LABELS[model.modelId] ?? model.modelId}
                          </span>
                          <span className="font-mono font-bold text-white shrink-0">
                            {model.remainingPercent !== null
                              ? `${model.remainingPercent}%`
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              getQuotaBarColor(model.remainingPercent)
                            )}
                            style={{ width: `${model.remainingPercent ?? 0}%` }}
                          />
                        </div>
                        {model.resetTime && (
                          <div className="text-xs text-slate-300 truncate">
                            Reset: {formatDateTimeId(model.resetTime)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Aksi Lanjutan: Reset ke Env Secret */}
      <div className="rounded-xl border border-slate-600/50 bg-[#091526]/90 p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-slate-200 leading-relaxed">
          <span className="font-bold text-white">Catatan Sinkronisasi:</span>{' '}
          &ldquo;Sync Env (Merge)&rdquo; menjaga akun baru hasil OAuth di KV. Gunakan Reset hanya
          bila ingin menyamakan seluruh daftar dengan secret Cloudflare{' '}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-cyan-200 font-mono">
            ANTIGRAVITY_ACCOUNTS
          </code>
          .
        </div>
        <button
          type="button"
          disabled={syncingEnv}
          onClick={() => void handleSyncFromEnv('reset')}
          className="shrink-0 rounded-lg border border-amber-400/60 bg-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-500/35 disabled:opacity-40 transition"
        >
          Reset Pool ke Env Secret
        </button>
      </div>

      {/* Modal Tambah / Re-login Akun Google OAuth */}
      {oauthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-500/70 bg-[#091526] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {oauthTargetLabel
                    ? `Re-login Akun ${oauthTargetLabel}`
                    : 'Hubungkan Akun Google Baru'}
                </h2>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Login via Google OAuth Antigravity, ambil project Cloud Code otomatis, lalu
                  simpan refresh token terenkripsi AES-256-GCM ke Cloudflare KV.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOauthModalOpen(false)
                  setOauthSession(null)
                }}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {oauthLoading ? (
              <div className="py-8 text-center text-sm text-slate-200">
                Menyiapkan sesi &amp; link OAuth Google dari Cloudflare Worker...
              </div>
            ) : oauthSession ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-cyan-400/50 bg-slate-900/90 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                      Langkah 1 — Login di Akun Google
                    </span>
                    <span className="rounded-full border border-slate-500 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-100">
                      {oauthSession.mode === 'auto_popup'
                        ? 'Mode Otomatis (Localhost)'
                        : 'Mode Produksi (Salin Callback)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed">
                    {oauthSession.mode === 'auto_popup'
                      ? 'Klik tombol di bawah untuk membuka popup login Google. Setelah Anda klik Allow/Izinkan, jendela akan mengirim kode ke panel ini dan tertutup otomatis.'
                      : 'Klik tombol di bawah untuk login Google di tab baru. Setelah selesai, browser akan mengarah ke http://localhost:8080/callback?code=... (tampilan "This site can\'t be reached" adalah NORMAL). Salin seluruh URL di address bar lalu tempelkan pada Langkah 2.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenGooglePopup}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 shadow-lg hover:bg-cyan-300 transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka Halaman Login Google
                    </button>
                    <a
                      href={oauthSession.authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-500 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 transition"
                    >
                      Buka di Tab Baru
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-600 bg-slate-900/90 p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-white">
                    Langkah 2 — Tempel URL Callback atau Authorization Code
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mendukung URL lengkap (<code className="text-cyan-200">http://localhost:8080/callback?...</code>), query
                    string (<code className="text-cyan-200">?code=...&amp;state=...</code>), maupun kode mentah (
                    <code className="text-cyan-200">4/0A...</code>). Jika popup otomatis di localhost berhasil, bagian ini
                    tidak perlu diisi.
                  </p>
                  <textarea
                    rows={3}
                    value={callbackInput}
                    onChange={(e) => setCallbackInput(e.target.value)}
                    placeholder="Tempel URL dari address bar browser setelah login Google (contoh: http://localhost:8080/callback?state=...&code=4/0A...)"
                    className="w-full rounded-xl border border-slate-500 bg-slate-950 px-3 py-2.5 text-xs font-mono text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void openOAuthModal(oauthTargetLabel ?? undefined)}
                      className="rounded-xl border border-slate-500 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-700 transition"
                    >
                      Muat Ulang State
                    </button>
                    <button
                      type="button"
                      disabled={oauthExchanging || !callbackInput.trim()}
                      onClick={() =>
                        void submitOAuthExchange({
                          callbackUrl: callbackInput,
                          state: oauthSession.state,
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-40 transition"
                    >
                      {oauthExchanging ? 'Memproses Token...' : 'Simpan & Verifikasi Akun'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <p className="text-sm font-medium text-red-200">
                  Gagal memuat link otorisasi OAuth.
                </p>
                <button
                  type="button"
                  onClick={() => void openOAuthModal(oauthTargetLabel ?? undefined)}
                  className="rounded-xl border border-slate-500 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
