import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — APLESI',
  description: 'Kebijakan privasi dan penggunaan data di APLESI Enterprise.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-white mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert max-w-none prose-a:text-aqua-glow hover:prose-a:text-aqua">
        <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <p>
          Selamat datang di APLESI (https://www.aplesi.my.id). Privasi pengunjung adalah salah satu prioritas utama kami. Dokumen Kebijakan Privasi ini menguraikan jenis informasi pribadi yang diterima dan dikumpulkan oleh APLESI dan bagaimana informasi tersebut digunakan.
        </p>

        <h2>File Log (Log Files)</h2>
        <p>
          Seperti banyak situs web lain, APLESI menggunakan file log. Informasi di dalam file log meliputi alamat protokol internet (IP), jenis browser, Internet Service Provider (ISP), cap waktu/tanggal, halaman rujukan/keluar, dan mungkin jumlah klik. Informasi ini digunakan untuk menganalisis tren, mengelola situs, melacak pergerakan pengguna di sekitar situs, dan mengumpulkan informasi demografis.
        </p>

        <h2>Cookies dan Web Beacons</h2>
        <p>
          APLESI menggunakan "cookies" untuk menyimpan informasi tentang preferensi pengunjung, merekam informasi spesifik pengguna di halaman mana yang diakses atau dikunjungi pengguna, dan untuk menyesuaikan konten halaman web kami berdasarkan jenis browser pengunjung atau informasi lain yang dikirimkan pengunjung melalui browser mereka.
        </p>

        <h2>Google DoubleClick DART Cookie</h2>
        <p>
          Google, sebagai vendor pihak ketiga, menggunakan cookies untuk menayangkan iklan di APLESI. Penggunaan cookie DART oleh Google memungkinkannya untuk menayangkan iklan kepada pengunjung situs kami berdasarkan kunjungan mereka ke APLESI dan situs lain di Internet.
          <br /><br />
          Pengguna dapat memilih keluar dari penggunaan cookie DART dengan mengunjungi kebijakan privasi iklan dan jaringan konten Google di URL berikut: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a>
        </p>

        <h2>Mitra Periklanan Kami</h2>
        <p>
          Beberapa mitra periklanan kami mungkin menggunakan cookies dan web beacons di situs kami. Mitra periklanan kami meliputi:
        </p>
        <ul>
          <li>Google AdSense</li>
        </ul>
        <p>
          Server iklan atau jaringan iklan pihak ketiga ini menggunakan teknologi dalam iklan dan tautan masing-masing yang muncul di APLESI dan dikirim langsung ke browser Anda. Mereka secara otomatis menerima alamat IP Anda saat ini terjadi. Teknologi lain (seperti cookies, JavaScript, atau Web Beacons) juga dapat digunakan oleh jaringan iklan pihak ketiga di situs kami untuk mengukur efektivitas kampanye periklanan mereka dan/atau untuk mempersonalisasi konten periklanan yang Anda lihat di situs.
        </p>
        <p>
          APLESI tidak memiliki akses atau kontrol atas cookies yang digunakan oleh pengiklan pihak ketiga.
        </p>

        <h2>Kebijakan Privasi Pihak Ketiga</h2>
        <p>
          Kebijakan Privasi APLESI tidak berlaku untuk pengiklan atau situs web lain. Karena itu, kami menyarankan Anda untuk berkonsultasi dengan Kebijakan Privasi dari masing-masing server iklan pihak ketiga ini untuk informasi yang lebih rinci.
        </p>

        <h2>Persetujuan</h2>
        <p>
          Dengan menggunakan situs web kami, Anda dengan ini menyetujui Kebijakan Privasi kami dan menyetujui syarat-syaratnya.
        </p>
      </div>
    </div>
  )
}
