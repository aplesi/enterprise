'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Copy, XCircle } from 'lucide-react'

function OAuthCallbackContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'sending' | 'sent' | 'manual' | 'error'>('sending')
  const [copied, setCopied] = useState(false)
  const [fullUrl, setFullUrl] = useState('')

  const code = searchParams.get('code') || ''
  const state = searchParams.get('state') || ''
  const error = searchParams.get('error') || ''
  const errorDescription = searchParams.get('error_description') || ''

  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : ''
    setFullUrl(currentUrl)

    if (error && !code) {
      if (typeof window !== 'undefined' && window.opener) {
        window.opener.postMessage(
          {
            type: 'aplesi_ag_oauth_callback',
            code: '',
            state,
            error,
            errorDescription,
            fullUrl: currentUrl,
          },
          window.location.origin
        )
      }
      setStatus('error')
      return
    }

    if (code && state && typeof window !== 'undefined' && window.opener) {
      window.opener.postMessage(
        {
          type: 'aplesi_ag_oauth_callback',
          code,
          state,
          error: '',
          errorDescription: '',
          fullUrl: currentUrl,
        },
        window.location.origin
      )
      setStatus('sent')
      const timer = setTimeout(() => {
        window.close()
      }, 900)
      return () => clearTimeout(timer)
    }

    if (code) {
      setStatus('manual')
    } else {
      setStatus('error')
    }
  }, [code, state, error, errorDescription])

  const handleCopyUrl = async () => {
    if (!fullUrl || typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c1a16] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
        {status === 'sent' || status === 'sending' ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-semibold">Otorisasi Google Berhasil</h1>
              <p className="text-sm text-white/70 mt-1">
                Data otorisasi sedang dikirim kembali ke panel Admin Aplesi. Jendela ini akan
                tertutup otomatis.
              </p>
            </div>
          </div>
        ) : status === 'manual' ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h1 className="text-lg font-semibold">Kode OAuth Diterima</h1>
                <p className="text-sm text-white/70 mt-1">
                  Salin URL di bawah ini lalu tempelkan pada modal Tambah Akun Google di Panel Admin.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-black/30 border border-white/10 p-3 text-xs text-white/80 break-all font-mono">
              {fullUrl}
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-black hover:bg-emerald-400 transition"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'URL Tersalin' : 'Salin URL Callback'}
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-lg font-semibold">Otorisasi OAuth Gagal</h1>
              <p className="text-sm text-white/70 mt-1">
                {errorDescription || error || 'Parameter authorization code tidak ditemukan pada callback.'}
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c1a16] text-white flex items-center justify-center p-4 text-sm text-white/60">
          Memproses callback otorisasi Google...
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  )
}
