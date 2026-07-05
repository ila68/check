// Role-based permissions
// super_admin = full access to everything
// admin = only blog add/edit/delete access

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'author'

export const isSuperAdmin = (role: string) => role === 'super_admin'

export const canAccessSEO = (role: string) => role === 'super_admin'
export const canAccessCategories = (role: string) => role === 'super_admin'
export const canAccessMedia = (role: string) => role === 'super_admin'
export const canAccessComments = (role: string) => role === 'super_admin'
export const canAccessSettings = (role: string) => role === 'super_admin'
export const canAccessUsers = (role: string) => role === 'super_admin'
export const canAccessBlogs = (role: string) => ['super_admin', 'admin', 'editor', 'author'].includes(role)
export const canEditMetaTags = (role: string) => role === 'super_admin'

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
  author: 'Author',
}
