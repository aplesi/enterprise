// config/roles.ts
export type UserRole = 'super_admin' | 'admin' | 'editor'

export const rolePermissions: Record<UserRole, string[]> = {
  super_admin: [
    'artikel:create', 'artikel:edit', 'artikel:delete', 'artikel:publish',
    'kategori:manage', 'afiliasi:manage', 'analytics:view',
    'pengguna:manage', 'settings:manage',
  ],
  admin: [
    'artikel:create', 'artikel:edit', 'artikel:delete', 'artikel:publish',
    'kategori:manage', 'afiliasi:manage', 'analytics:view',
  ],
  editor: [
    'artikel:create', 'artikel:edit', 'artikel:publish',
    'kategori:manage',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}
