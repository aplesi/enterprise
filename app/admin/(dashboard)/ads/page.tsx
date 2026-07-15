'use client'

// app/admin/(dashboard)/ads/page.tsx
// Halaman khusus pengaturan Google AdSense -- dipisah dari Settings umum
// biar gampang ditemukan & fokus (sebelumnya cuma 1 field nebeng di Settings).

import { useState, useEffect } from 'react'
import { Megaphone, Loader2, Save, Check, XCircle, ExternalLink, Sparkles } from 'lucide-react'

export default function AdsPage() {
  const [scriptRaw, setScriptRaw] = useState('')
  const [publisherId, setPublisherId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setScriptRaw(data.data?.ADSENSE_SCRIPT_RAW || '')
          setPublisherId(data.data?.NEXT_PUBLIC_ADSENSE_ID || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleUbahScript(raw: string) {
    setScriptRaw(raw)
    const cocok = raw.match(/ca-pub-\d{10,}/)
    setPublisherId(cocok ? cocok[0] : '')
  }

  async function simpan() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ADSENSE_SCRIPT_RAW: scriptRaw,
          NEXT_PUBLIC_ADSENSE_ID: publisherId,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-aqua-glow" />
            Ads — Google AdSense
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Pasang sekali, Google otomatis menentukan posisi iklan paling potensial di seluruh situs (Auto Ads)
          </p>
        </div>
        <button
          onClick={simpan}
          disabled={saving || loading}
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
              Simpan
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

      {/* Panduan singkat */}
      <div className="rounded-xl border border-aqua-glow/20 bg-aqua-glow/5 p-5 space-y-2">
        <h2 className="font-bold text-white text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-aqua-glow" />
          Langkah setup (sekali saja)
        </h2>
        <ol className="text-sm text-white/70 space-y-1.5 list-decimal list-inside">
          <li>
            Pastikan situs sudah di-approve Google AdSense (kalau belum, daftar dulu di{' '}
            <a href="https://www.google.com/adsense" target="_blank" rel="noopener noreferrer" className="text-aqua-glow hover:underline inline-flex items-center gap-1">
              google.com/adsense <ExternalLink className="h-3 w-3" />
            </a>
            )
          </li>
          <li>
            Login ke dashboard AdSense → <strong className="text-white">Ads → By site</strong> → pilih <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">aplesi.my.id</code> → nyalakan toggle <strong className="text-white">Auto ads</strong>
          </li>
          <li>Di halaman yang sama, klik <strong className="text-white">Get code</strong> lalu copy semua kodenya</li>
          <li>Tempel di kotak bawah ini, lalu klik <strong className="text-white">Simpan</strong></li>
        </ol>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
              Kode Script Google AdSense
            </label>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-aqua-glow font-bold">
                <Check className="h-3.5 w-3.5" />
                Tersimpan
              </span>
            )}
          </div>
          <textarea
            value={scriptRaw}
            onChange={(e) => handleUbahScript(e.target.value)}
            placeholder='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx" crossorigin="anonymous"></script>'
            rows={4}
            disabled={loading}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-mono text-white placeholder:text-white/40 focus:border-aqua-glow/60 focus:bg-white/10 focus:outline-none transition-all resize-y disabled:opacity-50"
          />
          <p className="text-xs mt-1.5">
            {publisherId ? (
              <span className="text-aqua-glow">✓ Publisher ID terdeteksi: {publisherId}</span>
            ) : scriptRaw ? (
              <span className="text-red-300">⚠ Publisher ID (ca-pub-...) tidak ditemukan di kode yang ditempel — cek lagi kodenya</span>
            ) : (
              <span className="text-white/40">Tempel PERSIS kode yang dikasih Google, jangan diedit manual</span>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/60 space-y-1">
        <p>
          <strong className="text-white/80">Status saat ini:</strong>{' '}
          {publisherId ? (
            <span className="text-aqua-glow">Aktif — script akan otomatis dimuat di semua halaman publik</span>
          ) : (
            <span className="text-white/40">Belum aktif — belum ada Publisher ID tersimpan</span>
          )}
        </p>
        <p className="text-xs text-white/40">
          Perubahan di sini langsung berlaku di frontend tanpa perlu deploy ulang — cukup refresh halaman situs.
        </p>
      </div>
    </div>
  )
}
