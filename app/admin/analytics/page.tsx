'use client'

import { useState, useEffect } from 'react'

interface StatCard {
  label: string
  value: string
  perubahan: string
  naik: boolean
  icon: string
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
    { label: 'Pengunjung Hari Ini', value: String(Math.floor(Math.random() * 500 + 200)), perubahan: '+12%', naik: true, icon: '👁️' },
    { label: 'Pengunjung Bulan Ini', value: String(Math.floor(Math.random() * 15000 + 5000).toLocaleString('id-ID')), perubahan: '+23%', naik: true, icon: '📅' },
    { label: 'Total Artikel', value: '48', perubahan: '+8 bulan ini', naik: true, icon: '📝' },
    { label: 'Pendapatan Afiliasi', value: 'Rp 1.240.000', perubahan: '+18%', naik: true, icon: '💰' },
  ]

  const artikelPopuler: ArtikelPopuler[] = [
    { judul: 'Cara Budidaya Lele Dumbo untuk Pemula Lengkap', slug: 'cara-budidaya-lele-dumbo-pemula', views: 4823, kategori: 'Pembenihan' },
    { judul: 'Pakan Alternatif Hemat untuk Lele: Panduan Lengkap', slug: 'pakan-alternatif-hemat-lele', views: 3210, kategori: 'Pakan' },
    { judul: 'Mengatasi Penyakit White Spot pada Lele dengan Cepat', slug: 'mengatasi-white-spot-lele', views: 2987, kategori: 'Penyakit' },
    { judul: 'Sistem Bioflok: Budidaya Lele Intensif Modern', slug: 'sistem-bioflok-lele', views: 2341, kategori: 'Teknologi' },
    { judul: 'Kolam Terpal vs Kolam Tanah: Mana yang Lebih Untung?', slug: 'kolam-terpal-vs-kolam-tanah', views: 1876, kategori: 'Kolam' },
  ]

  const trafficSources: TrafficSource[] = [
    { sumber: 'Google Organik', persentase: 58, warna: 'bg-green-500' },
    { sumber: 'Langsung', persentase: 18, warna: 'bg-blue-500' },
    { sumber: 'Media Sosial', persentase: 14, warna: 'bg-purple-500' },
    { sumber: 'Referral', persentase: 7, warna: 'bg-yellow-500' },
    { sumber: 'Lainnya', persentase: 3, warna: 'bg-gray-400' },
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
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Pantau performa website Aplesi</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                periode === p
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}>
              {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : '90 Hari'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.statCards.map(stat => (
          <div key={stat.label} className="admin-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                stat.naik ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.perubahan}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Grafik Pengunjung */}
      <div className="admin-card">
        <h2 className="text-base font-semibold text-gray-800 mb-5">📈 Pengunjung 7 Hari Terakhir</h2>
        <div className="flex items-end gap-2 h-40">
          {dataGrafik.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{d.nilai}</span>
              <div
                className="w-full bg-green-500 rounded-t-md transition-all hover:bg-green-600"
                style={{ height: `${(d.nilai / maxNilai) * 100}%`, minHeight: '4px' }}
                title={`${d.hari}: ${d.nilai} pengunjung`}
              />
              <span className="text-xs text-gray-400">{d.hari}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Data simulasi — hubungkan Google Analytics atau Cloudflare Analytics untuk data real
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Artikel Terpopuler */}
        <div className="admin-card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🔥 Artikel Terpopuler</h2>
          <div className="space-y-3">
            {data.artikelPopuler.map((artikel, i) => (
              <div key={artikel.slug} className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <a href={`/artikel/${artikel.slug}`} target="_blank"
                    className="text-sm text-gray-800 hover:text-green-600 font-medium line-clamp-1">
                    {artikel.judul}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{artikel.kategori}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs font-medium text-green-600">{artikel.views.toLocaleString('id-ID')} views</span>
                  </div>
                  <div className="mt-1 h-1 bg-gray-100 rounded-full">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${(artikel.views / data.artikelPopuler[0].views) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sumber Traffic */}
        <div className="admin-card">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🌐 Sumber Traffic</h2>
          <div className="space-y-3">
            {data.trafficSources.map(src => (
              <div key={src.sumber}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{src.sumber}</span>
                  <span className="font-semibold text-gray-900">{src.persentase}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className={`h-full rounded-full ${src.warna}`}
                    style={{ width: `${src.persentase}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Pendapatan */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">💰 Estimasi Pendapatan</h3>
            <div className="space-y-2">
              {[
                { label: 'Google AdSense', nilai: 'Rp 450.000', warna: 'text-blue-600' },
                { label: 'Komisi Afiliasi', nilai: 'Rp 790.000', warna: 'text-green-600' },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className={`font-semibold ${item.warna}`}>{item.nilai}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-100">
                <span className="text-gray-800">Total Bulan Ini</span>
                <span className="text-green-700">Rp 1.240.000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Setup GA */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm">
        <h3 className="font-semibold text-blue-800 mb-2">📌 Setup Analytics Real</h3>
        <p className="text-blue-700 mb-3">
          Data di atas adalah simulasi. Untuk data real, hubungkan salah satu:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="font-medium text-gray-800">Google Analytics 4</div>
            <div className="text-xs text-gray-500 mt-1">Tambahkan <code>NEXT_PUBLIC_GA_ID</code> di .env.local</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="font-medium text-gray-800">Cloudflare Analytics</div>
            <div className="text-xs text-gray-500 mt-1">Aktifkan di Cloudflare Dashboard → Analytics</div>
          </div>
        </div>
      </div>
    </div>
  )
}
