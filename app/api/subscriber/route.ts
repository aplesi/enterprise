// app/api/subscriber/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const email = formData.get('email')?.toString().trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
    }

    // Kirim welcome email via Resend
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Aplesi <noreply@aplesi.my.id>',
          to: [email],
          subject: '🐟 Selamat datang di newsletter Aplesi!',
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
              <h1 style="color:#166534">🐟 Selamat datang di Aplesi!</h1>
              <p>Terima kasih sudah mendaftar newsletter kami.</p>
              <p>Kamu akan mendapatkan artikel terbaru tentang budidaya lele setiap hari langsung di inbox-mu.</p>
              <a href="https://www.aplesi.my.id/artikel"
                style="display:inline-block;background:#166534;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                Baca Artikel Terbaru →
              </a>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px">
                Untuk berhenti berlangganan, <a href="https://www.aplesi.my.id/unsubscribe?email=${encodeURIComponent(email)}">klik di sini</a>
              </p>
            </div>
          `,
        }),
      })
    }

    // Simpan subscriber ke Cloudflare KV (production) atau log saja
    console.log(`New subscriber: ${email}`)

    // Redirect kembali dengan pesan sukses
    return NextResponse.redirect(
      new URL(`/?subscribed=1`, req.url),
      { status: 302 }
    )
  } catch (err) {
    console.error('Subscriber error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
