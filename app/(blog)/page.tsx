import Link from 'next/link'
import Image from 'next/image'
import { getArtikelTerbaru } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'

export default async function HomePage() {
  const artikelTerbaru = await getArtikelTerbaru(3) // Ambil 3 untuk desain grid 3 kolom
  
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-[#021b36] text-white px-4 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#021b36] to-[#043366] opacity-80"></div>
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-aqua rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Kiri - Teks */}
            <div className="text-left">

              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-6">
                Memajukan<br/>Budidaya Ikan<br/>
                <span className="text-aqua">Nusantara</span> ke Era<br/>Digital
              </h1>
              
              <p className="text-blue-100/90 text-sm md:text-base mb-8 max-w-lg leading-relaxed">
                Bergabunglah bersama ribuan pembudidaya ikan di seluruh Indonesia. Dapatkan akses ke teknologi terbaru, dukungan ahli, panduan budidaya (terutama lele), dan pasar yang lebih luas bersama APLESI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-10">
                <Link href="#bergabung" className="btn-aqua px-6 py-3 font-semibold rounded-lg text-sm shadow-glow hover-lift w-full sm:w-auto text-center">
                  Daftar Menjadi Anggota →
                </Link>
                <Link href="/program" className="px-6 py-3 border border-white/30 text-white text-sm font-medium rounded-lg hover:bg-white/10 hover-lift transition-colors w-full sm:w-auto text-center">
                  Pelajari Program Kami
                </Link>
              </div>

              {/* Stats di dalam Hero Kiri */}
              <div className="flex gap-8 items-center border-t border-white/10 pt-6">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">12K+</div>
                  <div className="text-xs text-blue-100/70 font-medium">Anggota Aktif</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">34</div>
                  <div className="text-xs text-blue-100/70 font-medium">Provinsi</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">200+</div>
                  <div className="text-xs text-blue-100/70 font-medium">Mitra Pasar</div>
                </div>
              </div>
            </div>

            {/* Kanan - Gambar */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image 
                  src="/images/hero-pond.jpg"
                  alt="Kolam budidaya lele nusantara"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              

            </div>
          </div>
          
          <div className="max-w-3xl mx-auto relative z-20">
            <div className="bg-[#032348]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center">

              <h2 className="text-2xl font-bold text-white mb-2">1000+ Artikel & Panduan Budidaya</h2>
              <p className="text-sm text-blue-100/70 mb-6">Temukan panduan praktis, berita perikanan, dan riset terbaru dari para ahli APLESI.</p>
              
              <div className="max-w-xl mx-auto relative mt-6 mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span>
                <input 
                  type="text" 
                  placeholder="Pencarian..." 
                  className="w-full bg-[#02152b] border border-white/10 rounded-full py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-aqua transition-colors"
                />
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-blue-100/60">
                <span>Pencarian populer:</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">Budidaya lele</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">Pakan ikan</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">CBIB</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">Kolam terpal</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">Penyakit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pilar APLESI / Fitur Layanan */}
      <section className="max-w-6xl mx-auto px-4 py-24 bg-white relative z-20">
        <div className="text-center mb-12">
          <div className="text-aqua text-[10px] font-bold tracking-wider uppercase mb-2">PROGRAM UNGGULAN</div>
          <h2 className="text-2xl font-bold mb-4 text-[#021b36]">Dukungan Lengkap untuk<br/>Pembudidaya</h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">Empat pilar layanan APLESI yang membantu anggota dari hulu ke hilir.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Pelatihan & Edukasi",
              desc: "Kurikulum budidaya modern dari ahli perikanan bersertifikat.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-2.5v0Z"/><path d="M4 19.5a2.5 2.5 0 0 1 2.5-2.5H20"/></svg>
            },
            {
              title: "Pendampingan Tambak",
              desc: "Tim lapangan APLESI siap mendampingi siklus budidaya Anda.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            },
            {
              title: "Koperasi & Pasar",
              desc: "Akses harga anggota dan jaringan pembeli skala nasional.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            },
            {
              title: "Sertifikasi Mutu",
              desc: "Dukungan sertifikasi CBIB dan pemenuhan standar ekspor.",
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 text-aqua flex items-center justify-center text-xl mb-5 border border-cyan-100">
                {item.icon}
              </div>
              <h3 className="text-base font-bold mb-2 text-[#021b36]">{item.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kabar & Panduan (Artikel Terbaru) */}
      <section className="bg-slate-50 py-24 px-4 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
            <div className="text-left w-full md:w-auto">
              <div className="text-aqua text-[10px] font-bold tracking-wider uppercase mb-2">ARTIKEL & BERITA</div>
              <h2 className="text-2xl font-bold text-[#021b36]">Kabar & Panduan Budidaya</h2>
            </div>
            <Link href="/artikel" className="px-4 py-2 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors bg-white w-full md:w-auto text-center">
              Lihat Semua Artikel →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {artikelTerbaru.length > 0 ? artikelTerbaru.map((artikel) => (
              <Link key={artikel.slug} href={`/artikel/${artikel.slug}`} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {artikel.gambar && (
                    <Image
                      src={artikel.gambar}
                      alt={artikel.judul}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <span className="absolute top-3 left-3 bg-aqua text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wide">
                    {artikel.kategori.toUpperCase()}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md">
                    <span className="text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg></span>
                    <span>{formatTanggal(artikel.tanggal)}</span>
                  </div>
                  <h3 className="font-bold text-[#021b36] text-sm mb-2 line-clamp-2 leading-snug group-hover:text-aqua transition-colors">
                    {artikel.judul}
                  </h3>
                  <p className="text-gray-500 text-[11px] line-clamp-2 mb-4 leading-relaxed flex-1">
                    {artikel.ringkasan}
                  </p>
                  <div className="text-aqua text-xs font-semibold mt-auto">
                    Baca selengkapnya →
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                Belum ada artikel terbaru.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Kebutuhan Tambak / Produk */}
      <section className="max-w-6xl mx-auto px-4 py-24 bg-white">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div className="text-left w-full md:w-auto">
            <div className="text-aqua text-[10px] font-bold tracking-wider uppercase mb-2">KOPERASI APLESI</div>
            <h2 className="text-2xl font-bold text-[#021b36]">Kebutuhan Tambak (Koperasi APLESI)</h2>
            <p className="text-gray-500 text-xs mt-2 max-w-md">Harga khusus anggota untuk perlengkapan budidaya berkualitas pilihan koperasi.</p>
          </div>
          <Link href="/produk" className="px-4 py-2 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors bg-white w-full md:w-auto text-center">
            Kunjungi Toko →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
          {[
            { nama: 'Pakan Apung Premium 30kg', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>, slug: 'pakan-premium', harga: 'Rp 285.000', hargaAsli: 'Rp 310.000' },
            { nama: 'Alat Ukur Kualitas Air (pH/TDS)', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>, slug: 'alat-ukur', harga: 'Rp 150.000', hargaAsli: 'Rp 175.000' },
            { nama: 'Mesin Aerator Tambak 1HP', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, slug: 'mesin-aerator', harga: 'Rp 1.250.000', hargaAsli: 'Rp 1.400.000' },
            { nama: 'Probiotik Khusus Lele 500ml', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>, slug: 'probiotik', harga: 'Rp 65.000', hargaAsli: 'Rp 85.000' }
          ].map((produk, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col group overflow-hidden text-left">
              <div className="h-40 bg-gray-50 flex items-center justify-center text-4xl relative border-b border-gray-100">
                {produk.icon}
                <span className="absolute top-3 right-3 bg-[#021b36] text-white text-[8px] font-bold px-2 py-1 rounded-full tracking-wider shadow-sm">
                  ANGGOTA
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-[#021b36] text-xs mb-3 line-clamp-2 min-h-[32px]">{produk.nama}</h3>
                
                <div className="mt-auto">
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Harga Anggota</div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-aqua font-black text-lg">{produk.harga}</span>
                    <span className="text-[10px] text-gray-400 line-through font-medium">{produk.hargaAsli}</span>
                  </div>
                  <Link href={`/kategori/produk`} className="block w-full bg-aqua text-white text-center text-xs font-bold py-2.5 rounded-lg hover:bg-opacity-90 transition-colors shadow-sm">
                    Beli Sekarang
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Gabung */}
      <section id="bergabung" className="py-24 px-4 bg-navy-deep text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-navy to-navy-deep opacity-80"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-aqua rounded-full blur-[100px] opacity-20 mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary rounded-full blur-[100px] opacity-30 mix-blend-screen"></div>
        
        <div className="max-w-3xl mx-auto relative z-10 glass-dark p-8 md:p-12 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap menjadi bagian dari APLESI?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Daftarkan tambak Anda hari ini dan dapatkan akses penuh ke program pelatihan, koperasi, dan jaringan pasar nasional.
          </p>
          <button className="btn-aqua px-8 py-4 text-lg font-bold shadow-glow hover-lift w-full sm:w-auto">
            Daftar Sebagai Anggota Sekarang
          </button>
          <p className="text-white/50 text-sm mt-6">
            Pendaftaran gratis. Validasi keanggotaan membutuhkan waktu 1-2 hari kerja.
          </p>
        </div>
      </section>
    </main>
  )
}
