import { queryOne, query } from '@/lib/db'
import BlogForm from '@/components/admin/blog/BlogForm'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function EditBlogPage({ params }: { params: { id: string } }) {
  const blog = await queryOne('SELECT * FROM blogs WHERE id = ?', [Number(params.id)])
  if (!blog) notFound()
  const categories = await query('SELECT id, name FROM blog_categories ORDER BY name')
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role || ''
  return <BlogForm blog={blog} categories={categories} mode="edit" userRole={role} />
}
