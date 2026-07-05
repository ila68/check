import { query, queryOne } from '@/lib/db'
import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'
import { Plus, Search, Filter } from 'lucide-react'
import BlogListActions from '@/components/admin/blog/BlogListActions'
export const dynamic = 'force-dynamic'

export default async function BlogListPage({ searchParams }: { searchParams: any }) {
  const { q = '', category = '', status = '', page = '1' } = searchParams
  const perPage = 15
  const offset = (Number(page) - 1) * perPage
  let where = "WHERE b.status != 'trashed'"
  const params: any[] = []
  if (q) { where += ' AND b.title LIKE ?'; params.push(`%${q}%`) }
  if (category) { where += ' AND b.category_id = ?'; params.push(Number(category)) }
  if (status) { where += ' AND b.status = ?'; params.push(status) }

  const totalResult = await queryOne<any>(`SELECT COUNT(*) as c FROM blogs b ${where}`, params)
  const total = totalResult?.c || 0
  const blogs = await query(`
    SELECT b.id, b.title, b.slug, b.status, b.featured_image, b.published_at, b.created_at,
           u.name as author, c.name as category_name
    FROM blogs b
    LEFT JOIN users u ON b.author_id = u.id
    LEFT JOIN blog_categories c ON b.category_id = c.id
    ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?
  `, [...params, perPage, offset])
  const categories = await query('SELECT id, name FROM blog_categories ORDER BY name')
  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color:'var(--ink)', marginBottom:4 }}>All Blogs</h1>
          <p style={{ color:'var(--ink-muted)', fontSize:'0.875rem' }}>{total} blogs total</p>
        </div>
        <Link href="/admin/blogs/new" className="btn btn-primary"><Plus size={15} /> Add New</Link>
      </div>
      <div className="card mb-5">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="form-group mb-0" style={{ flex:'1 1 200px' }}>
            <label className="form-label">Search</label>
            <div style={{ position:'relative' }}>
              <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--ink-muted)' }} />
              <input name="q" defaultValue={q} className="form-input" style={{ paddingLeft:32 }} placeholder="Search blogs..." />
            </div>
          </div>
          <div className="form-group mb-0" style={{ flex:'1 1 150px' }}>
            <label className="form-label">Category</label>
            <select name="category" defaultValue={category} className="form-select">
              <option value="">All Categories</option>
              {(categories as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group mb-0" style={{ flex:'1 1 130px' }}>
            <label className="form-label">Status</label>
            <select name="status" defaultValue={status} className="form-select">
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary"><Filter size={14} /> Filter</button>
          <Link href="/admin/blogs/list" className="btn btn-secondary">Clear</Link>
        </form>
      </div>
      <div className="card p-0">
        <div className="table-wrapper" style={{ borderRadius:10 }}>
          <table>
            <thead>
              <tr><th>Image</th><th>Title</th><th className="hide-mobile">Category</th><th>Status</th><th className="hide-mobile">Author</th><th className="hide-mobile">Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(blogs as any[]).map(blog => (
                <tr key={blog.id}>
                  <td>{blog.featured_image ? <img src={blog.featured_image} alt="" style={{ width:56, height:40, objectFit:'cover', borderRadius:6 }} /> : <div style={{ width:56, height:40, background:'var(--surface-secondary)', borderRadius:6 }} />}</td>
                  <td><div style={{ fontWeight:500, fontSize:'0.875rem', color:'var(--ink)', maxWidth:250, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{blog.title}</div><div style={{ fontSize:'0.75rem', color:'var(--ink-muted)' }}>/blog/{blog.slug}</div></td>
                  <td className="hide-mobile" style={{ fontSize:'0.875rem', color:'var(--ink-muted)' }}>{blog.category_name || '—'}</td>
                  <td><span className={`badge badge-${blog.status}`}>{blog.status}</span></td>
                  <td className="hide-mobile" style={{ fontSize:'0.875rem', color:'var(--ink-muted)' }}>{blog.author || '—'}</td>
                  <td className="hide-mobile" style={{ fontSize:'0.8125rem', color:'var(--ink-muted)' }}>{formatDateShort(blog.created_at)}</td>
                  <td><BlogListActions blogId={blog.id} blogSlug={blog.slug} status={blog.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop:'1px solid var(--border)' }}>
            <span style={{ fontSize:'0.875rem', color:'var(--ink-muted)' }}>Showing {(Number(page)-1)*perPage+1}–{Math.min(Number(page)*perPage,total)} of {total}</span>
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                <Link key={p} href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`} className={`page-btn ${p === Number(page) ? 'active' : ''}`}>{p}</Link>
              ))}
            </div>
          </div>
        )}
        {blogs.length === 0 && <div style={{ textAlign:'center', padding:'3rem', color:'var(--ink-muted)' }}><p style={{ marginBottom:'0.75rem' }}>No blogs found.</p><Link href="/admin/blogs/new" className="btn btn-primary btn-sm">Create your first blog</Link></div>}
      </div>
    </div>
  )
}
