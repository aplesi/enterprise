// types/user.ts
import type { UserRole } from '@/config/roles'

export interface User {
  id: string
  nama: string
  email: string
  role: UserRole
  aktif: boolean
  createdAt: string
  lastLogin?: string
  jumlahArtikel: number
}
