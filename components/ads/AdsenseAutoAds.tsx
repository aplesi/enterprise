'use client'

// components/ads/AdsenseAutoAds.tsx
//
// Auto Ads Google AdSense -- Google yang otomatis menentukan posisi iklan
// paling potensial (lewat machine learning mereka) di seluruh halaman,
// tanpa kita perlu atur slot manual satu-satu.
//
// Cara kerja:
// 1. Ambil Publisher ID dari /api/ads-config (sumbernya: admin panel Settings)
// 2. Kalau ada & formatnya valid, suntik <script> AdSense ke <head>
//    (pakai document.createElement, BUKAN dangerouslySetInnerHTML --
//    tag <script> yang di-inject lewat innerHTML tidak akan pernah
//    dieksekusi browser, jadi harus lewat DOM API langsung)
//
// Catatan penting: selain kode ini terpasang, "Auto ads" juga harus
// di-ON-kan dari akun Google AdSense (Ads → By site → Auto ads) --
// itu bagian yang tidak bisa diatur lewat kode, murni pengaturan di
// pihak Google.

import { useEffect } from 'react'

const SCRIPT_ID = 'aplesi-adsense-autoads'

export function AdsenseAutoAds() {
  useEffect(() => {
    let batal = false

    fetch('/api/ads-config')
      .then((res) => res.json())
      .then((json) => {
        if (batal) return
        const publisherId: string = json?.data?.publisherId || ''
        if (!publisherId) return

        // Hindari duplikat kalau komponen ini re-mount (mis. navigasi client-side)
        if (document.getElementById(SCRIPT_ID)) return

        const script = document.createElement('script')
        script.id = SCRIPT_ID
        script.async = true
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`
        script.crossOrigin = 'anonymous'
        document.head.appendChild(script)
      })
      .catch(() => {
        // Diam-diam gagal -- iklan bukan fitur kritis, jangan sampai
        // error di sini mengganggu pengalaman pengguna lain.
      })

    return () => {
      batal = true
    }
  }, [])

  return null
}
