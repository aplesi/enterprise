// config/navigation.ts
import { Home, Sparkles, Calendar, Folder, BarChart3, DollarSign, Users, Settings } from 'lucide-react'

export const navPublic = [
  { label: 'Beranda', href: '/' },
  { label: 'Artikel', href: '/artikel' },
  { label: 'Kategori', href: '/kategori/pembenihan' },
  { label: 'Produk', href: '/produk' },
  { label: 'Cari', href: '/cari' },
]

export const navAdmin = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Generate Artikel', href: '/admin/generate', icon: Sparkles },
  { label: 'Jadwal Auto-Post', href: '/admin/jadwal', icon: Calendar },
  { label: 'Kategori & Tag', href: '/admin/kategori', icon: Folder },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Afiliasi', href: '/admin/afiliasi', icon: DollarSign },
  { label: 'Pengguna', href: '/admin/pengguna', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]
