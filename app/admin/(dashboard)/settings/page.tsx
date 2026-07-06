'use client'
export const runtime = 'edge';

import { useState, useEffect } from 'react'
import { Sparkles, Cloud, FileCode2, Mail, Lock, DollarSign, Settings as SettingsIcon, Loader2, Save, XCircle, Check, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface SettingField {
  key: string
  label: string
  placeholder: string
  tipe: 'text' | 'password' | 'url' | 'email'
  required: boolean
  keterangan: string
  link?: string
  linkLabel?: string
}

const SETTINGS: { grup: string; icon: typeof Sparkles; fields: SettingField[] }[] = [
  {
    grup: 'AI — Generate Artikel',
    icon: Sparkles,
    fields: [
      {
        key: 'GROQ_API_KEY',
        label: 'Groq API Key',
        placeholder: 'gsk_xxxxxxxxxxxxxxxxxxxx',
        tipe: 'password',
        required: true,
        keterangan: 'Untuk generate artikel otomatis dengan LLaMA 3.3 70B',
        link: 'https://console.groq.com',
        linkLabel: 'Daftar gratis di console.groq.com',
      },
    ],
  },
  {
    grup: 'Cloudflare',
    icon: Cloud,
    fields: [
      {
        key: 'CF_ACCOUNT_ID',
        label: 'Cloudflare Account ID',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        tipe: 'text',
        required: true,
        keterangan: 'Dari Cloudflare Dashboard → kanan bawah',
      },
      {
        key: 'CF_API_TOKEN',
        label: 'Cloudflare API Token',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        tipe: 'password',
        required: true,
        keterangan: 'Dashboard → My Profile → API Tokens',
        link: 'https://dash.cloudflare.com/profile/api-tokens',
        linkLabel: 'Buat API Token',
      },
      {
        key: 'CF_KV_NAMESPACE_ID',
        label: 'KV Namespace ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        tipe: 'text',
        required: false,
        keterangan: 'Untuk menyimpan settings. Buat via: wrangler kv:namespace create aplesi-kv',
      },
    ],
  },
  {
    grup: 'GitHub — Auto Publish',
    icon: FileCode2,
    fields: [
      {
        key: 'GITHUB_TOKEN',
        label: 'GitHub Personal Access Token',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        tipe: 'password',
        required: true,
        keterangan: 'Untuk auto-commit artikel ke repo. Perlu scope: repo',
        link: 'https://github.com/settings/tokens/new',
        linkLabel: 'Buat token di GitHub',
      },
      {
        key: 'GITHUB_OWNER',
        label: 'GitHub Username',
        placeholder: 'username_github_kamu',
        tipe: 'text',
        required: true,
        keterangan: 'Username GitHub pemilik repo',
      },
      {
        key: 'GITHUB_REPO',
        label: 'Nama Repository',
        placeholder: 'aplesi-enterprise',
        tipe: 'text',
        required: true,
        keterangan: 'Nama repo GitHub project ini',
      },
    ],
  },
  {
    grup: 'Email — Newsletter',
    icon: Mail,
    fields: [
      {
        key: 'RESEND_API_KEY',
        label: 'Resend API Key',
        placeholder: 're_xxxxxxxxxxxxxxxxxxxx',
        tipe: 'password',
        required: false,
        keterangan: 'Untuk kirim email newsletter ke subscriber. Gratis 3000 email/bulan',
        link: 'https://resend.com',
        linkLabel: 'Daftar di resend.com',
      },
      {
        key: 'EMAIL_FROM',
        label: 'Email Pengirim',
        placeholder: 'noreply@aplesi.my.id',
        tipe: 'email',
        required: false,
        keterangan: 'Alamat email pengirim newsletter',
      },
    ],
  },
  {
    grup: 'Admin Panel',
    icon: Lock,
    fields: [
      {
        key: 'ADMIN_EMAIL',
        label: 'Email Admin',
        placeholder: 'admin@aplesi.my.id',
        tipe: 'email',
        required: true,
        keterangan: 'Email untuk login ke admin panel',
      },
      {
        key: 'ADMIN_PASSWORD',
        label: 'Password Admin',
        placeholder: 'min. 12 karakter',
        tipe: 'password',
        required: true,
        keterangan: 'Password harus kuat: huruf besar, angka, dan simbol',
      },
      {
        key: 'NEXTAUTH_SECRET',
        label: 'NextAuth Secret',
        placeholder: 'random string 32 karakter',
        tipe: 'password',
        required: true,
        keterangan: 'Generate dengan: openssl rand -base64 32',
      },
    ],
  },
  {
    grup: 'Analitik & Monetisasi',
    icon: DollarSign,
    fields: [
      {
        key: 'NEXT_PUBLIC_GA_ID',
        label: 'Google Analytics 4 ID',
        placeholder: 'G-XXXXXXXXXX',
        tipe: 'text',
        required: false,
        keterangan: 'Measurement ID dari Google Analytics 4',
      },
      {
        key: 'NEXT_PUBLIC_ADSENSE_ID',
        label: 'Google AdSense Publisher ID',
        placeholder: 'ca-pub-xxxxxxxxxxxxxxxx',
        tipe: 'text',
        required: false,
        keterangan: 'Publisher ID dari Google AdSense',
      },
      {
        key: 'AFFILIATE_SECRET',
        label: 'Affiliate Secret Key',
        placeholder: 'random string untuk HMAC',
        tipe: 'password',
        required: false,
        keterangan: 'Secret untuk tracking link afiliasi',
      },
    ],
  },
]

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => { if (data.success) setValues(data.data || {}) })
      .catch(() => {})
  }, [])

  async function simpanSemua() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      const allKeys = Object.fromEntries(Object.keys(values).map((k) => [k, true]))
      setSaved(allKeys)
      setTimeout(() => setSaved({}), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="h-7 w-7 text-aqua-glow" />
            Settings
          </h1>
          <p className="text-white/60 text-sm mt-1">
            API keys & konfigurasi disimpan di Cloudflare KV — aman dan terenkripsi
          </p>
        </div>
        <button
          onClick={simpanSemua}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg gradient-aqua px-4 py-2.5 font-bold text-white shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Semua
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {SETTINGS.map((grup) => {
        const Icon = grup.icon
        return (
          <div key={grup.grup} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Icon className="h-5 w-5 text-aqua-glow" />
              {grup.grup}
            </h2>
            <div className="space-y-4">
              {grup.fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                      {field.label}
                      {field.required && <span className="text-red-300 ml-1">*</span>}
                    </label>
                    {saved[field.key] && (
                      <span className="flex items-center gap-1 text-xs text-aqua-glow font-bold">
                        <Check className="h-3.5 w-3.5" />
                        Tersimpan
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={show[field.key] ? 'text' : field.tipe}
                      value={values[field.key] || ''}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all"
                    />
                    {field.tipe === 'password' && (
                      <button
                        type="button"
                        onClick={() =>
                          setShow((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                      >
                        {show[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-1.5">
                    {field.keterangan}
                    {field.link && (
                      <>
                        {' — '}
                        <a
                          href={field.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-aqua-glow hover:underline inline-flex items-center gap-1"
                        >
                          {field.linkLabel}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <strong className="text-white font-bold">Keamanan:</strong>{' '}
            <span className="text-white/70">
              Semua API keys disimpan di Cloudflare KV yang terenkripsi. Tidak ada key yang tersimpan di database atau file kode.
              File <code className="bg-white/10 px-1 rounded">. env.local</code> lokal tetap bisa dipakai untuk development,
              tapi tidak perlu di-commit ke GitHub.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
