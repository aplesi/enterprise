'use client'

import { useState, useEffect } from 'react'
import { Eye, Calendar, FileText, DollarSign, TrendingUp, Flame, Globe, Info } from 'lucide-react'

interface StatCard {
  label: string
  value: string
  perubahan: string
  naik: boolean
  icon: typeof Eye
}

interface ArtikelPopuler {
  judul: string
  slug: string
  views: number
  kategori: string
}

interface TrafficSource {
  sumber: string
  persentase: number
  warna: string
}

// Simulasi data analytics — production: ambil dari Cloudflare Analytics API / GA4
function generateDataDummy() {
  const statCards: StatCard[] = [
    { label: 'Pengunjung Hari Ini', value: String(Math.floor(Math.random() * 500 + 200)), perubahan: '+12%', naik: true, icon: Eye },
    { label: 'Pengunjung Bulan Ini', value: String(Math.floor(Math.random() * 15000 + 5000).toLocaleString('id-ID')), perubahan: '+23%', naik: true, icon: Calendar },
    { label: 'Total Artikel', value: '48', perubahan: '+8 bulan ini', naik: true, icon: FileText },
    { label: 'Pendapatan Afiliasi', value: 'Rp 1.240.000', perubahan: '+18%', naik: true, icon: DollarSign },
  ]

  const artikelPopuler: ArtikelPopuler[] = [
    { judul: 'Cara Budidaya Ikan Nila untuk Pemula Lengkap', slug: 'cara-budidaya-ikan-nila-pemula', views: 4823, kategori: 'Pembenihan' },
    { judul: 'Pakan Alternatif Hemat untuk Ikan: Panduan Lengkap', slug: 'pakan-alternatif-hemat-ikan', views: 3210, kategori: 'Pakan' },
    { judul: 'Mengatasi Penyakit White Spot pada Ikan dengan Cepat', slug: 'mengatasi-white-spot-ikan', views: 2987, kategori: 'Penyakit' },
    { judul: 'Sistem Bioflok: Budidaya Ikan Intensif Modern', slug: 'sistem-bioflok-ikan', views: 2341, kategori: 'Teknologi' },
    { judul: 'Kolam Terpal vs Kolam Tanah: Mana yang Lebih Untung?', slug: 'kolam-terpal-vs-kolam-tanah', views: 1876, kategori: 'Kolam' },
  ]

  const trafficSources: TrafficSource[] = [
    { sumber: 'Google Organik', persentase: 58, warna: 'bg-aqua-glow' },
    { sumber: 'Langsung', persentase: 18, warna: 'bg-accent' },
    { sumber: 'Media Sosial', persentase: 14, warna: 'bg-purple-400' },
    { sumber: 'Referral', persentase: 7, warna: 'bg-amber-400' },
    { sumber: 'Lainnya', persentase: 3, warna: 'bg-white/20' },
  ]

  return { statCards, artikelPopuler, trafficSources }
}

// Data grafik pengunjung 7 hari
const dataGrafik = [
  { hari: 'Sen', nilai: 312 },
  { hari: 'Sel', nilai: 478 },
  { hari: 'Rab', nilai: 392 },
  { hari: 'Kam', nilai: 521 },
  { hari: 'Jum', nilai: 689 },
  { hari: 'Sab', nilai: 445 },
  { hari: 'Min', nilai: 287 },
]

export default function AnalyticsPage() {
  const [periode, setPeriode] = useState<'7d' | '30d' | '90d'>('7d')
  const [data, setData] = useState(() => generateDataDummy())
  const maxNilai = Math.max(...dataGrafik.map(d => d.nilai))

  useEffect(() => {
    setData(generateDataDummy())
  }, [periode])

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Analytics</h1>
          <p className="text-white/60 text-sm mt-1">Pantau performa website Aplesi</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 text-sm rounded-lg border font-bold transition-all ${
                periode === p
                  ? 'bg-aqua-glow border-aqua-glow text-white'
                  : 'bg-white/5 text-white/70 border-white/20 hover:border-aqua-glow/40'
              }`}
            >
              {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : '90 Hari'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.statCards.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3">
                <Icon className="h-6 w-6 text-aqua-glow" />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  stat.naik ? 'bg-aqua-glow/20 text-aqua-glow' : 'bg-red-400/20 text-red-300'
                }`}>
                  {stat.perubahan}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/60 mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Grafik Pengunjung */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-aqua-glow" />
          Pengunjung 7 Hari Terakhir
        </h2>
        <div className="flex items-end gap-2 h-40">
          {dataGrafik.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-white/60 font-semibold">{d.nilai}</span>
              <div
                className="w-full bg-gradient-to-t from-aqua-glow to-accent rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                style={{ height: `${(d.nilai / maxNilai) * 100}%`, minHeight: '4px' }}
                title={`${d.hari}: ${d.nilai} pengunjung`}
              />
              <span className="text-xs text-white/40 font-semibold">{d.hari}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/40 mt-4 text-center">
          Data simulasi — hubungkan Google Analytics atau Cloudflare Analytics untuk data real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Artikel Terpopuler */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            Artikel Terpopuler
          </h2>
          <div className="space-y-3">
            {data.artikelPopuler.map((artikel, i) => (
              <div key={artikel.slug} className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-amber-400/20 text-amber-300' :
                    i === 1 ? 'bg-white/10 text-white/60' :
                    i === 2 ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/40'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={`/artikel/${artikel.slug}`}
                    target="_blank"
                    className="text-sm text-white hover:text-aqua-glow font-semibold line-clamp-1 transition-colors"
                  >
                    {artikel.judul}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/40">{artikel.kategori}</span>
                    <span className="text-xs text-white/40">·</span>
                    <span className="text-xs font-bold text-aqua-glow">{artikel.views.toLocaleString('id-ID')} views</span>
                  </div>
                  <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-aqua-glow rounded-full"
                      style={{ width: `${(artikel.views / data.artikelPopuler[0].views) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sumber Traffic */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-aqua-glow" />
            Sumber Traffic
          </h2>
          <div className="space-y-3">
            {data.trafficSources.map(src => (
              <div key={src.sumber}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/70 font-semibold">{src.sumber}</span>
                  <span className="font-bold text-white">{src.persentase}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${src.warna}`}
                    style={{ width: `${src.persentase}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pendapatan */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-aqua-glow" />
              Estimasi Pendapatan
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Google AdSense', nilai: 'Rp 450.000', warna: 'text-accent' },
                { label: 'Komisi Afiliasi', nilai: 'Rp 790.000', warna: 'text-aqua-glow' },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-white/60">{item.label}</span>
                  <span className={`font-bold ${item.warna}`}>{item.nilai}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/10">
                <span className="text-white">Total Bulan Ini</span>
                <span className="text-aqua-glow">Rp 1.240.000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup GA */}
      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-sm">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-2">Setup Analytics Real</h3>
            <p className="text-white/70 mb-3">
              Data di atas adalah simulasi. Untuk data real, hubungkan salah satu:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <div className="font-bold text-white">Google Analytics 4</div>
                <div className="text-xs text-white/50 mt-1">
                  Tambahkan <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_GA_ID</code> di .env.local
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <div className="font-bold text-white">Cloudflare Analytics</div>
                <div className="text-xs text-white/50 mt-1">Aktifkan di Cloudflare Dashboard → Analytics</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
