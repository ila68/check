import { query } from '@/lib/db'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { ArrowRight, FileText, Star, MessageSquare, TrendingUp } from 'lucide-react'
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let blogs: any[] = [], categories: any[] = []
  try {
    blogs = await query(`
      SELECT b.id, b.title, b.slug, b.excerpt, b.featured_image, b.published_at,
             c.name as category_name, c.slug as category_slug
      FROM blogs b LEFT JOIN blog_categories c ON b.category_id = c.id
      WHERE b.status = 'published' ORDER BY b.published_at DESC LIMIT 6
    `)
    categories = await query(`
      SELECT c.name, c.slug, COUNT(b.id) as count FROM blog_categories c
      LEFT JOIN blogs b ON b.category_id = c.id AND b.status = 'published'
      GROUP BY c.id HAVING count > 0 ORDER BY count DESC LIMIT 6
    `)
  } catch {}

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-secondary)' }}>
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="white" /></div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink)' }}>BlogCMS</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/blogs" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink-muted)', textDecoration: 'none' }}>Blog</Link>
          <Link href="/admin/dashboard" className="btn btn-primary btn-sm">Admin Panel</Link>
        </div>
      </nav>

      <div style={{ background: 'linear-gradient(135deg, #4361ee 0%, #7c3aed 50%, #3451d1 100%)', padding: 'clamp(3rem, 8vw, 6rem) 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 100, padding: '6px 16px', marginBottom: '1.5rem' }}>
            <TrendingUp size={14} color="rgba(255,255,255,0.9)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Next.js 14 + MySQL Blog CMS</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3.75rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Share Your Ideas<br /><span style={{ color: 'rgba(255,255,255,0.7)' }}>with the World</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'rgba(255,255,255,0.75)', maxWidth: 500, margin: '0 auto 2rem', lineHeight: 1.6 }}>
            A modern, SEO-optimized blog platform with powerful admin panel and MySQL database.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/blogs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: 'var(--primary)', padding: '0.75rem 1.75rem', borderRadius: 100, fontWeight: 700, textDecoration: 'none', fontSize: '0.9375rem' }}>
              Explore Blog <ArrowRight size={16} />
            </Link>
            <Link href="/admin/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', color: 'white', padding: '0.75rem 1.75rem', borderRadius: 100, fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              Admin Panel
            </Link>
          </div>
        </div>
      </div>

      {blogs.length > 0 && (
        <div style={{ maxWidth: 1200, margin: '4rem auto 0', padding: '0 2rem' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)' }}>Latest Articles</h2>
            <Link href="/blogs" className="btn btn-secondary">View All <ArrowRight size={14} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {blogs.map((blog, i) => (
              <article key={blog.id} style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}>
                {blog.featured_image && (
                  <Link href={`/blog/${blog.slug}`}>
                    <img src={blog.featured_image} alt={blog.title} style={{ width: '100%', height: i === 0 ? 240 : 200, objectFit: 'cover' }} loading={i < 2 ? 'eager' : 'lazy'} />
                  </Link>
                )}
                <div style={{ padding: '1.25rem' }}>
                  {blog.category_name && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{blog.category_name}</span>}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', margin: '0.375rem 0 0.625rem', lineHeight: 1.35 }}>
                    <Link href={`/blog/${blog.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{blog.title}</Link>
                  </h3>
                  {blog.excerpt && <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{blog.excerpt}</p>}
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{blog.published_at ? formatDate(blog.published_at) : ''}</span>
                    <Link href={`/blog/${blog.slug}`} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Read More →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #4361ee, #7c3aed)', borderRadius: 20, padding: 'clamp(2rem, 5vw, 3.5rem)', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>Ready to Start?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.0625rem', marginBottom: '2rem' }}>Access the full-featured admin panel with SEO tools and media library.</p>
          <Link href="/admin/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: 'var(--primary)', padding: '0.875rem 2rem', borderRadius: 100, fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
            Open Admin Panel <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
          Built with Next.js 14 + MySQL · <Link href="/blogs" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Blog</Link> · <Link href="/admin/dashboard" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Admin</Link>
        </p>
      </footer>
    </div>
  )
}
