import { query } from '@/lib/db'
import BlogForm from '@/components/admin/blog/BlogForm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function AddBlogPage() {
  const categories = await query('SELECT id, name FROM blog_categories ORDER BY name')
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role || ''
  return <BlogForm categories={categories} mode="add" userRole={role} />
}
