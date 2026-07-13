// app/og/route.tsx
// Dynamic OG Image Generator — tampilan preview saat dibagikan di WhatsApp/sosmed

import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const judul = searchParams.get('judul') || 'Aplesi — Portal Budidaya Ikan'
  const kategori = searchParams.get('kategori') || 'Budidaya Ikan'
  const tanggal = searchParams.get('tanggal') || ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px' }}>🐟</div>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '28px', fontWeight: '700' }}>
            Aplesi
          </div>
        </div>

        {/* Kategori badge */}
        <div style={{
          display: 'flex', // Satori (next/og renderer) tidak dukung inline-flex, cuma flex/block/contents/none
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '100px',
          padding: '6px 16px',
          color: '#bbf7d0',
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: '20px',
          width: 'fit-content',
        }}>
          {kategori}
        </div>

        {/* Judul */}
        <div style={{
          color: '#ffffff',
          fontSize: judul.length > 60 ? '36px' : '44px',
          fontWeight: '800',
          lineHeight: 1.2,
          marginBottom: '24px',
          maxWidth: '900px',
        }}>
          {judul}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '18px',
        }}>
          <span>aplesi.my.id</span>
          {tanggal && <span>{tanggal}</span>}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
