import { query, queryOne } from '@/lib/db'
import { FileText, CheckCircle, Clock, Trash2, FolderOpen, MessageSquare, Star, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function DashboardPage({ searchParams }: { searchParams: any }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role || ''
  const isSuperAdmin = role === 'super_admin'
  const userName = session?.user?.name || 'User'
  const showUnauthorized = searchParams?.error === 'unauthorized'

  const totalBlogs = (await queryOne<any>("SELECT COUNT(*) as c FROM blogs WHERE status != 'trashed'"))?.c || 0
  const published = (await queryOne<any>("SELECT COUNT(*) as c FROM blogs WHERE status = 'published'"))?.c || 0
  const drafts = (await queryOne<any>("SELECT COUNT(*) as c FROM blogs WHERE status = 'draft'"))?.c || 0
  const trashed = (await queryOne<any>("SELECT COUNT(*) as c FROM blogs WHERE status = 'trashed'"))?.c || 0
  const categories = (await queryOne<any>('SELECT COUNT(*) as c FROM blog_categories'))?.c || 0
  const comments = (await queryOne<any>("SELECT COUNT(*) as c FROM blog_comments WHERE status = 'pending'"))?.c || 0
  const avgRating = (await queryOne<any>('SELECT AVG(rating) as avg FROM blog_ratings'))?.avg
  const recentBlogs = await query(`
    SELECT b.id, b.title, b.slug, b.status, b.created_at, u.name as author, c.name as category
    FROM blogs b
    LEFT JOIN users u ON b.author_id = u.id
    LEFT JOIN blog_categories c ON b.category_id = c.id
    WHERE b.status != 'trashed'
    ORDER BY b.created_at DESC LIMIT 5
  `)
  const recentComments = await query(`
    SELECT bc.*, b.title as blog_title FROM blog_comments bc
    LEFT JOIN blogs b ON bc.blog_id = b.id
    ORDER BY bc.created_at DESC LIMIT 5
  `)

  const stats = [
    { label: 'Total Blogs', value: totalBlogs, icon: FileText, color: '#4361ee', bg: '#eef1fd', href: '/admin/blogs/list' },
    { label: 'Published', value: published, icon: CheckCircle, color: '#059669', bg: '#d1fae5', href: '/admin/blogs/list?status=published' },
    { label: 'Drafts', value: drafts, icon: Clock, color: '#d97706', bg: '#fef3c7', href: '/admin/blogs/list?status=draft' },
    { label: 'Trashed', value: trashed, icon: Trash2, color: '#dc2626', bg: '#fee2e2', href: '/admin/blogs/trash' },
    ...(isSuperAdmin ? [
      { label: 'Categories', value: categories, icon: FolderOpen, color: '#7c3aed', bg: '#ede9fe', href: '/admin/categories' },
      { label: 'Pending Comments', value: comments, icon: MessageSquare, color: '#0891b2', bg: '#cffafe', href: '/admin/comments' },
      { label: 'Avg Rating', value: avgRating ? Number(avgRating).toFixed(1) : '—', icon: Star, color: '#ea580c', bg: '#ffedd5', href: '/admin/comments' },
    ] : []),
  ]

  return (
    <div className="fade-in">
      {showUnauthorized && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.875rem 1.125rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, marginBottom: '1.5rem' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <div>
            <div style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.9rem' }}>Access Denied</div>
            <div style={{ color: '#991b1b', fontSize: '0.8125rem' }}>You do not have permission to access this page. Please contact your Super Admin.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.625rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
            👋 Welcome back, {userName}!
          </h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
            {isSuperAdmin ? 'Super Admin — You have full access' : 'Admin — You can manage blogs'}
          </p>
        </div>
        <Link href="/admin/blogs/new" className="btn btn-primary">
          <FileText size={15} /> New Blog
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: s.bg }}><s.icon size={22} color={s.color} /></div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!isSuperAdmin && (
        <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <Link href="/admin/blogs/new" className="btn btn-primary"><FileText size={14} /> Write New Blog</Link>
          <Link href="/admin/blogs/list" className="btn btn-secondary">View All Blogs</Link>
          <Link href="/admin/blogs/trash" className="btn btn-secondary"><Trash2 size={14} /> Trash</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dash-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Recent Blogs</h2>
            <Link href="/admin/blogs/list" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(recentBlogs as any[]).map(blog => (
              <div key={blog.id} style={{ padding: '0.625rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{blog.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>{blog.category || 'Uncategorized'} · {formatDateShort(blog.created_at)}</div>
                </div>
                <span className={`badge badge-${blog.status}`}>{blog.status}</span>
                <Link href={`/admin/blogs/edit/${blog.id}`} style={{ color: 'var(--ink-muted)', display: 'flex' }}><FileText size={14} /></Link>
              </div>
            ))}
            {recentBlogs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-muted)' }}>
                <p style={{ marginBottom: '0.75rem' }}>No blogs yet.</p>
                <Link href="/admin/blogs/new" className="btn btn-primary btn-sm">Write your first blog</Link>
              </div>
            )}
          </div>
        </div>

        {isSuperAdmin ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Pending Comments</h2>
              <Link href="/admin/comments" className="btn btn-secondary btn-sm">Manage</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(recentComments as any[]).map((c: any) => (
                <div key={c.id} style={{ padding: '0.625rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink)' }}>{c.name}</span>
                    <span className={`badge badge-${c.status}`}>{c.status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.comment}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 4 }}>on: {c.blog_title}</div>
                </div>
              ))}
              {recentComments.length === 0 && (
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No pending comments.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>Your Access Level</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {[
                { icon: '✅', label: 'Write new blogs', allowed: true },
                { icon: '✅', label: 'Edit blogs', allowed: true },
                { icon: '✅', label: 'Delete blogs', allowed: true },
                { icon: '✅', label: 'Save as draft', allowed: true },
                { icon: '✅', label: 'Publish blogs', allowed: true },
                { icon: '🔒', label: 'SEO / Meta Settings', allowed: false },
                { icon: '🔒', label: 'Manage categories', allowed: false },
                { icon: '🔒', label: 'Moderate comments', allowed: false },
                { icon: '🔒', label: 'Media library', allowed: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: item.allowed ? 'var(--ink)' : 'var(--ink-muted)' }}>
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(67,97,238,0.06)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              🔒 For restricted features, please contact your Super Admin.
            </div>
          </div>
        )}
      </div>
      <style>{`@media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
