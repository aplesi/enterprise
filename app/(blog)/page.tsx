import Link from 'next/link'
import Image from 'next/image'
import { getArtikelTerbaru } from '@/lib/db/artikel'
import { formatTanggal, estimasiWacaBaca } from '@/lib/utils'

export default async function HomePage() {
  const artikelTerbaru = await getArtikelTerbaru(3) // Ambil 3 untuk desain grid 3 kolom
  
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-white pt-24 pb-32 px-4">
        {/* Abstract shapes for background */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-aqua rounded-full blur-[128px] opacity-30"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary rounded-full blur-[128px] opacity-30"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="badge-aqua mb-6 animate-fade-in inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-aqua-glow animate-pulse"></span>
            Asosiasi Pembudidaya Ikan Indonesia
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-white drop-shadow-lg">
            Memajukan Budidaya Ikan <br className="hidden md:block" /> Nusantara ke <span className="text-gradient-aqua">Era Digital</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
            Bergabunglah bersama ribuan pembudidaya ikan di seluruh Indonesia. Dapatkan akses ke teknologi terbaru, dukungan ahli, panduan budidaya, dan pasar yang lebih luas bersama APLESI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="#bergabung" className="btn-aqua hover-lift px-8 py-3 text-lg w-full sm:w-auto shadow-glow">
              Gabung APLESI Sekarang
            </Link>
            <Link href="/artikel" className="btn-secondary border-white/40 text-white hover:bg-white/10 hover-lift px-8 py-3 text-lg w-full sm:w-auto glass">
              Jelajahi Panduan
            </Link>
          </div>
        </div>
      </section>

      {/* Pilar APLESI / Fitur Layanan */}
      <section className="max-w-6xl mx-auto px-4 py-24 -mt-16 relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Dukungan Lengkap untuk Pembudidaya</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Empat pilar layanan APLESI yang membantu anggota dari hulu ke hilir untuk meningkatkan produktivitas dan keuntungan.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Pelatihan & Edukasi",
              desc: "Kurikulum budidaya modern dari ahli perikanan bersertifikat.",
              icon: "📚"
            },
            {
              title: "Pendampingan Tambak",
              desc: "Tim lapangan APLESI siap mendampingi siklus budidaya Anda.",
              icon: "🤝"
            },
            {
              title: "Koperasi & Pasar",
              desc: "Akses harga anggota dan jaringan pembeli skala nasional.",
              icon: "🛒"
            },
            {
              title: "Sertifikasi Mutu",
              desc: "Dukungan sertifikasi CBIB dan pemenuhan standar ekspor.",
              icon: "🏅"
            }
          ].map((item, i) => (
            <div key={i} className="card p-6 text-center hover-lift bg-card border border-border">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm border border-primary/20">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kabar & Panduan (Artikel Terbaru) */}
      <section className="bg-muted/50 py-24 px-4 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
            <div>
              <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">1000+ Artikel & Panduan Budidaya</span>
              <h2 className="text-3xl font-bold text-foreground">Kabar & Panduan Budidaya</h2>
            </div>
            <Link href="/artikel" className="btn-secondary">
              Lihat Semua Panduan →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {artikelTerbaru.length > 0 ? artikelTerbaru.map((artikel) => (
              <Link key={artikel.slug} href={`/artikel/${artikel.slug}`} className="card group bg-card border border-border flex flex-col">
                <div className="relative h-56 bg-muted overflow-hidden">
                  {artikel.gambar && (
                    <Image
                      src={artikel.gambar}
                      alt={artikel.judul}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="absolute top-4 left-4 badge-aqua shadow-md backdrop-blur-md bg-white/90">
                    {artikel.kategori}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-foreground text-xl mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {artikel.judul}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed flex-1">
                    {artikel.ringkasan}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-4 border-t border-border mt-auto">
                    <span>{formatTanggal(artikel.tanggal)}</span>
                    <span className="flex items-center gap-1">⏱️ {estimasiWacaBaca(artikel.konten)} mnt baca</span>
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
      <section className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Kebutuhan Tambak (Koperasi APLESI)</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Dapatkan harga khusus anggota untuk perlengkapan budidaya berkualitas, mulai dari pakan premium hingga alat ukur kualitas air.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { nama: 'Pakan Apung Premium 30kg', icon: '🌾', slug: 'pakan-premium' },
            { nama: 'Alat Ukur Kualitas Air (pH/TDS)', icon: '🌡️', slug: 'alat-ukur' },
            { nama: 'Mesin Aerator Tambak 1HP', icon: '⚙️', slug: 'mesin-aerator' },
            { nama: 'Probiotik Khusus Lele 500ml', icon: '🧪', slug: 'probiotik' }
          ].map((produk, i) => (
            <Link key={i} href={`/kategori/produk`} className="card hover-lift group p-4 border border-border flex flex-col">
              <div className="h-40 bg-muted/50 rounded-lg flex items-center justify-center text-5xl mb-4 group-hover:bg-primary/5 transition-colors">
                {produk.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2 flex-1">{produk.nama}</h3>
              <div className="text-primary font-medium text-sm mt-auto group-hover:text-aqua transition-colors">Lihat Detail →</div>
            </Link>
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
