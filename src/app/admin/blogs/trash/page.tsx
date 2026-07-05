import { query } from '@/lib/db'
import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'
import TrashActions from '@/components/admin/blog/TrashActions'
export const dynamic = 'force-dynamic'

export default async function TrashPage() {
  const blogs = await query(`
    SELECT b.*, u.name as author, c.name as category_name
    FROM blogs b LEFT JOIN users u ON b.author_id = u.id LEFT JOIN blog_categories c ON b.category_id = c.id
    WHERE b.status = 'trashed' ORDER BY b.updated_at DESC
  `)
  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color:'var(--ink)', marginBottom:4 }}>Trash</h1>
          <p style={{ color:'var(--ink-muted)', fontSize:'0.875rem' }}>{blogs.length} trashed blogs</p>
        </div>
        <Link href="/admin/blogs/list" className="btn btn-secondary">← Back to Blogs</Link>
      </div>
      {blogs.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--ink-muted)' }}>Trash is empty. 🎉</div>
      ) : (
        <div className="card p-0">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Title</th><th className="hide-mobile">Category</th><th className="hide-mobile">Author</th><th className="hide-mobile">Date</th><th>Actions</th></tr></thead>
              <tbody>
                {(blogs as any[]).map(blog => (
                  <tr key={blog.id}>
                    <td><div style={{ fontWeight:500, fontSize:'0.875rem', color:'var(--ink)' }}>{blog.title}</div><div style={{ fontSize:'0.75rem', color:'var(--ink-muted)' }}>/blog/{blog.slug}</div></td>
                    <td className="hide-mobile" style={{ fontSize:'0.875rem', color:'var(--ink-muted)' }}>{blog.category_name || '—'}</td>
                    <td className="hide-mobile" style={{ fontSize:'0.875rem', color:'var(--ink-muted)' }}>{blog.author || '—'}</td>
                    <td className="hide-mobile" style={{ fontSize:'0.8125rem', color:'var(--ink-muted)' }}>{formatDateShort(blog.updated_at)}</td>
                    <td><TrashActions blogId={blog.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
