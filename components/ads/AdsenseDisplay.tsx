'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function AdsenseDisplay({
  client = 'ca-pub-6392184859535334',
  slot = '4847648907',
}: {
  client?: string
  slot?: string
}) {
  const pathname = usePathname()
  const insRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!insRef.current || pushedRef.current) return

    // Tunggu sampai adsbygoogle.js tersedia (di-load oleh AdsenseAutoAds)
    const pushAd = () => {
      if (pushedRef.current) return
      try {
        // @ts-expect-error Google Ads API
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        pushedRef.current = true
      } catch (err) {
        console.error('AdSense display error:', err)
      }
    }

    // Cek apakah script sudah siap
    // @ts-expect-error Google Ads API
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      pushAd()
    } else {
      // Tunggu script siap (max 5 detik)
      const interval = setInterval(() => {
        // @ts-expect-error Google Ads API
        if (window.adsbygoogle) {
          clearInterval(interval)
          pushAd()
        }
      }, 200)
      setTimeout(() => clearInterval(interval), 5000)
    }
  }, [pathname])

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  )
}
