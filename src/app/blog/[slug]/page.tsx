import { query, queryOne, execute } from '@/lib/db'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import CommentForm from '@/components/frontend/blog/CommentForm'
import { Calendar, User, Eye, Star } from 'lucide-react'
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const blog = await queryOne<any>("SELECT * FROM blogs WHERE slug = ? AND status = 'published'", [params.slug])
  if (!blog) return { title: 'Not Found' }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description,
    alternates: { canonical: blog.canonical_url || `${siteUrl}/blog/${blog.slug}` },
    openGraph: {
      title: blog.og_title || blog.title,
      description: blog.og_description || blog.meta_description,
      images: blog.og_image ? [blog.og_image] : blog.featured_image ? [blog.featured_image] : [],
      type: 'article',
    },
  }
}

export default async function BlogPage({ params }: { params: { slug: string } }) {
  const blog = await queryOne<any>(`
    SELECT b.*, u.name as author_name, u.avatar as author_avatar, u.bio as author_bio,
           c.name as category_name, c.slug as category_slug
    FROM blogs b
    LEFT JOIN users u ON b.author_id = u.id
    LEFT JOIN blog_categories c ON b.category_id = c.id
    WHERE b.slug = ? AND b.status = 'published'
  `, [params.slug])

  if (!blog) notFound()

  // Increment views
  await execute('UPDATE blogs SET views = views + 1 WHERE slug = ?', [params.slug])

  const comments = await query(`SELECT * FROM blog_comments WHERE blog_id = ? AND status = 'approved' ORDER BY created_at DESC`, [blog.id])
  const ratings = await queryOne<any>(`SELECT AVG(rating) as avg, COUNT(*) as count FROM blog_ratings WHERE blog_id = ?`, [blog.id])
  const related = await query(`SELECT id, title, slug, featured_image, excerpt, published_at FROM blogs WHERE category_id = ? AND id != ? AND status = 'published' ORDER BY published_at DESC LIMIT 3`, [blog.category_id, blog.id])
  const recent = await query(`SELECT title, slug, featured_image, published_at FROM blogs WHERE status = 'published' AND id != ? ORDER BY published_at DESC LIMIT 5`, [blog.id])
  const categories = await query(`SELECT c.name, c.slug, COUNT(b.id) as count FROM blog_categories c LEFT JOIN blogs b ON b.category_id = c.id AND b.status = 'published' GROUP BY c.id ORDER BY count DESC`)
  const tags = blog.tags ? JSON.parse(blog.tags) : []

  return (
    <>
      {blog.article_schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: blog.article_schema }} />}
      {blog.breadcrumb_schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: blog.breadcrumb_schema }} />}

      <div style={{ minHeight: '100vh', background: 'var(--surface-secondary)' }}>
        {/* Nav */}
        <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontSize: '1.125rem' }}>BlogCMS</Link>
          <span style={{ color: 'var(--border)' }}>·</span>
          <Link href="/blogs" style={{ color: 'var(--ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>Blog</Link>
        </nav>

        {/* Hero */}
        {blog.featured_image && (
          <div style={{ width: '100%', height: 'min(50vh, 480px)', overflow: 'hidden', position: 'relative' }}>
            <img src={blog.featured_image} alt={blog.featured_image_alt || blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4))' }} />
          </div>
        )}

        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2.5rem' }} className="single-layout">
          <article>
            {/* Breadcrumb */}
            <nav style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Link href="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Home</Link>
              <span>›</span>
              <Link href="/blogs" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Blog</Link>
              {blog.category_name && (<><span>›</span><Link href={`/blogs?category=${blog.category_slug}`} style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>{blog.category_name}</Link></>)}
              <span>›</span>
              <span style={{ color: 'var(--ink)' }}>{blog.title}</span>
            </nav>

            {blog.category_name && (
              <Link href={`/blogs?category=${blog.category_slug}`} style={{ display: 'inline-block', marginBottom: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'white', background: 'var(--primary)', padding: '3px 12px', borderRadius: 100, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {blog.category_name}
              </Link>
            )}

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
              {blog.title}
            </h1>

            {/* Author + Meta bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', padding: '0.875rem 1.125rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: '1.75rem', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
              {blog.author_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0 }}>
                    {blog.author_name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>{blog.author_name}</div>
                    <div style={{ fontSize: '0.75rem' }}>Author</div>
                  </div>
                </div>
              )}
              <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
              {blog.published_at && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={14} /> {formatDate(blog.published_at)}
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Eye size={14} /> {(blog.views || 0) + 1} views
              </span>
              {ratings?.avg && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b' }}>
                  <Star size={14} fill="#f59e0b" />
                  {Number(ratings.avg).toFixed(1)} ({ratings.count} reviews)
                </span>
              )}
            </div>

            {/* Content */}
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.content || '' }} />

            {/* Tags */}
            {tags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>Tags:</span>
                {tags.map((tag: string) => (
                  <span key={tag} style={{ padding: '3px 10px', background: 'var(--surface-secondary)', borderRadius: 100, fontSize: '0.8125rem', color: 'var(--ink-muted)', border: '1px solid var(--border)' }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Author box */}
            {blog.author_name && (
              <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'linear-gradient(135deg, rgba(67,97,238,0.05), rgba(124,58,237,0.05))', border: '1px solid rgba(67,97,238,0.15)', borderRadius: 12, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.25rem', flexShrink: 0 }}>
                  {blog.author_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem', marginBottom: 4 }}>{blog.author_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>{blog.author_bio || 'Content writer and blogger.'}</div>
                </div>
              </div>
            )}

            {/* Comments */}
            <div style={{ marginTop: '2.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.25rem' }}>
                {(comments as any[]).length} Comment{(comments as any[]).length !== 1 ? 's' : ''}
              </h2>
              {(comments as any[]).map((c: any) => (
                <div key={c.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 10, marginBottom: '0.875rem', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(67,97,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{formatDate(c.created_at)}</div>
                    </div>
                  </div>
                  <p style={{ color: 'var(--ink)', fontSize: '0.9rem', lineHeight: 1.6 }}>{c.comment}</p>
                </div>
              ))}
              {comments.length === 0 && <p style={{ color: 'var(--ink-muted)', marginBottom: '1.5rem' }}>Be the first to comment!</p>}
              <CommentForm blogId={blog.id} />
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>Categories</h3>
              {(categories as any[]).map((cat: any) => (
                <Link key={cat.slug} href={`/blogs?category=${cat.slug}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'var(--ink)', fontSize: '0.875rem' }}>
                  <span>{cat.name}</span>
                  <span style={{ fontSize: '0.8rem', background: 'var(--surface-secondary)', padding: '1px 7px', borderRadius: 100, color: 'var(--ink-muted)' }}>{cat.count}</span>
                </Link>
              ))}
            </div>
            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>Recent Articles</h3>
              {(recent as any[]).map((b: any) => (
                <Link key={b.slug} href={`/blog/${b.slug}`} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', textDecoration: 'none' }}>
                  {b.featured_image && <img src={b.featured_image} alt={b.title} style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} loading="lazy" />}
                  <div style={{ fontSize: '0.8375rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.35 }}>{b.title}</div>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        {/* Related */}
        {(related as any[]).length > 0 && (
          <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem' }}>Related Articles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {(related as any[]).map((b: any) => (
                <Link key={b.slug} href={`/blog/${b.slug}`} style={{ textDecoration: 'none', background: 'var(--surface)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', display: 'block' }}>
                  {b.featured_image && <img src={b.featured_image} alt={b.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} loading="lazy" />}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35, marginBottom: '0.5rem' }}>{b.title}</h3>
                    {b.excerpt && <p style={{ fontSize: '0.8375rem', color: 'var(--ink-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`.single-layout { @media (max-width: 900px) { grid-template-columns: 1fr !important; } }`}</style>
    </>
  )
}
