import { query, queryOne } from '@/lib/db'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import { Search, ChevronLeft, ChevronRight, ArrowRight, Calendar } from 'lucide-react'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Explore our latest articles and insights',
}

export default async function BlogsPage({ searchParams }: { searchParams: any }) {
  const page = Number(searchParams.page || 1)
  const perPage = 9
  const offset = (page - 1) * perPage
  const categorySlug = searchParams.category || ''
  const q = searchParams.q || ''

  let where = "WHERE b.status = 'published'"
  const params: any[] = []
  if (categorySlug) { where += ' AND c.slug = ?'; params.push(categorySlug) }
  if (q) { where += ' AND (b.title LIKE ? OR b.excerpt LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }

  const totalResult = await queryOne<any>(`SELECT COUNT(*) as c FROM blogs b LEFT JOIN blog_categories c ON b.category_id = c.id ${where}`, params)
  const total = totalResult?.c || 0
  const blogs = await query(`
    SELECT b.id, b.title, b.slug, b.excerpt, b.featured_image, b.published_at, b.views,
           u.name as author, c.name as category_name, c.slug as category_slug
    FROM blogs b
    LEFT JOIN users u ON b.author_id = u.id
    LEFT JOIN blog_categories c ON b.category_id = c.id
    ${where}
    ORDER BY b.published_at DESC
    LIMIT ? OFFSET ?
  `, [...params, perPage, offset])

  const categories = await query(`
    SELECT c.name, c.slug, COUNT(b.id) as count
    FROM blog_categories c
    LEFT JOIN blogs b ON b.category_id = c.id AND b.status = 'published'
    GROUP BY c.id ORDER BY count DESC
  `)
  const recent = await query(`SELECT title, slug, featured_image, published_at FROM blogs WHERE status = 'published' ORDER BY published_at DESC LIMIT 5`)
  const totalPages = Math.ceil(total / perPage)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f5f7fa; color: #1a1a2e; }

        .blogs-nav { background: #fff; border-bottom: 1px solid #e8ecf0; padding: 0 2rem; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .blogs-nav-logo { font-size: 1.25rem; font-weight: 800; color: #1a1a2e; text-decoration: none; }
        .blogs-nav-links { display: flex; align-items: center; gap: 1.5rem; }
        .blogs-nav-links a { font-size: 0.9rem; font-weight: 500; color: #555; text-decoration: none; }
        .blogs-nav-links a:hover { color: #2563eb; }
        .blogs-nav-btn { background: #2563eb; color: white; padding: 8px 18px; border-radius: 8px; font-size: 0.875rem; font-weight: 600; text-decoration: none; }

        .blogs-hero { background: #fff; padding: 3rem 2rem 2rem; text-align: center; border-bottom: 1px solid #e8ecf0; }
        .blogs-hero h1 { font-size: clamp(2rem, 5vw, 2.75rem); font-weight: 800; color: #1a1a2e; margin-bottom: 0.5rem; letter-spacing: -0.03em; }
        .blogs-hero p { color: #6b7280; font-size: 1.0625rem; margin-bottom: 1.5rem; }

        .blogs-layout { max-width: 1280px; margin: 2rem auto; padding: 0 1.5rem; display: grid; grid-template-columns: 1fr 300px; gap: 2rem; }
        @media (max-width: 900px) { .blogs-layout { grid-template-columns: 1fr; } .sidebar { order: -1; } }

        .blogs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
        .blogs-title { font-size: 1.75rem; font-weight: 800; color: #1a1a2e; letter-spacing: -0.02em; }
        .blogs-count { font-size: 0.875rem; color: #6b7280; background: #f1f5f9; padding: 4px 12px; border-radius: 100px; }

        .blogs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }

        .blog-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e8ecf0; transition: all 0.25s; text-decoration: none; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .blog-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); border-color: #dbeafe; }

        .blog-card-img { width: 100%; height: 200px; object-fit: cover; display: block; background: #e8ecf0; }
        .blog-card-img-placeholder { width: 100%; height: 200px; background: linear-gradient(135deg, #e8ecf0, #d1d9e0); display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 0.875rem; }

        .blog-card-body { padding: 1.25rem; }
        .blog-card-cat { display: inline-block; font-size: 0.72rem; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 3px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.625rem; text-decoration: none; }
        .blog-card-title { font-size: 1rem; font-weight: 700; color: #1a1a2e; line-height: 1.4; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .blog-card-excerpt { font-size: 0.875rem; color: #6b7280; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 1rem; }
        .blog-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.875rem; border-top: 1px solid #f1f5f9; }
        .blog-card-date { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: #6b7280; }
        .blog-card-date svg { color: #2563eb; }
        .blog-card-arrow { width: 32px; height: 32px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .blog-card:hover .blog-card-arrow { background: #2563eb; }
        .blog-card:hover .blog-card-arrow svg { color: white; }
        .blog-card-arrow svg { color: #2563eb; transition: color 0.2s; }

        /* Sidebar */
        .sidebar { display: flex; flex-direction: column; gap: 1.25rem; }
        .sidebar-card { background: #fff; border-radius: 16px; border: 1px solid #e8ecf0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .sidebar-card-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
        .sidebar-card-title { font-size: 1rem; font-weight: 700; color: #1a1a2e; }
        .sidebar-card-body { padding: 1rem 1.25rem; }

        .search-box { position: relative; }
        .search-box input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem; border: 1.5px solid #e8ecf0; border-radius: 10px; font-size: 0.875rem; outline: none; color: #1a1a2e; transition: border-color 0.15s; }
        .search-box input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .search-box svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        .search-btn { width: 100%; margin-top: 0.625rem; padding: 0.625rem; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .search-btn:hover { background: #1d4ed8; }

        .cat-item { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f8fafc; text-decoration: none; color: #374151; font-size: 0.9rem; transition: color 0.15s; }
        .cat-item:hover { color: #2563eb; }
        .cat-item:last-child { border-bottom: none; }
        .cat-count { font-size: 0.8rem; background: #f1f5f9; color: #6b7280; padding: 2px 8px; border-radius: 100px; }
        .cat-active { color: #2563eb; font-weight: 600; }
        .cat-active .cat-count { background: #eff6ff; color: #2563eb; }

        .recent-item { display: flex; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 1px solid #f8fafc; text-decoration: none; }
        .recent-item:last-child { border-bottom: none; }
        .recent-img { width: 56px; height: 44px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #e8ecf0; }
        .recent-title { font-size: 0.8375rem; font-weight: 600; color: #1a1a2e; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .recent-date { font-size: 0.75rem; color: #9ca3af; margin-top: 3px; }

        .pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2.5rem; }
        .page-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1.5px solid #e8ecf0; font-size: 0.875rem; font-weight: 500; text-decoration: none; color: #374151; transition: all 0.15s; background: #fff; }
        .page-btn:hover { border-color: #2563eb; color: #2563eb; }
        .page-btn.active { background: #2563eb; color: white; border-color: #2563eb; }

        .empty-state { text-align: center; padding: 4rem 2rem; color: #9ca3af; }
        .empty-state h3 { font-size: 1.125rem; font-weight: 600; color: #6b7280; margin-bottom: 0.5rem; }

        .active-filter { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #eff6ff; color: #2563eb; border-radius: 100px; font-size: 0.8125rem; font-weight: 500; text-decoration: none; margin-bottom: 1rem; }
      `}</style>

      <nav className="blogs-nav">
        <Link href="/" className="blogs-nav-logo">BlogCMS</Link>
        <div className="blogs-nav-links">
          <Link href="/">Home</Link>
          <Link href="/blogs">Blog</Link>
          <Link href="/admin/dashboard" className="blogs-nav-btn">Admin</Link>
        </div>
      </nav>

      <div className="blogs-hero">
        <h1>All Blogs</h1>
        <p>Discover insightful articles and expert knowledge</p>
      </div>

      <div className="blogs-layout">
        {/* Main content */}
        <div>
          <div className="blogs-header">
            <h2 className="blogs-title">
              {categorySlug ? `Category: ${categorySlug}` : q ? `Search: "${q}"` : 'All Blogs'}
            </h2>
            <span className="blogs-count">{total} article{total !== 1 ? 's' : ''}</span>
          </div>

          {(categorySlug || q) && (
            <Link href="/blogs" className="active-filter">
              ✕ Clear filter
            </Link>
          )}

          {blogs.length === 0 ? (
            <div className="empty-state">
              <h3>No articles found</h3>
              <p><Link href="/blogs" style={{ color: '#2563eb' }}>View all articles</Link></p>
            </div>
          ) : (
            <div className="blogs-grid">
              {(blogs as any[]).map(blog => (
                <Link key={blog.id} href={`/blog/${blog.slug}`} className="blog-card">
                  {blog.featured_image
                    ? <img src={blog.featured_image} alt={blog.title} className="blog-card-img" loading="lazy" />
                    : <div className="blog-card-img-placeholder">No Image</div>
                  }
                  <div className="blog-card-body">
                    {blog.category_name && (
                      <span className="blog-card-cat">{blog.category_name}</span>
                    )}
                    <div className="blog-card-title">{blog.title}</div>
                    {blog.excerpt && <div className="blog-card-excerpt">{blog.excerpt}</div>}
                    <div className="blog-card-footer">
                      <div className="blog-card-date">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        {blog.published_at ? formatDate(blog.published_at) : 'Draft'}
                      </div>
                      <div className="blog-card-arrow">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              {page > 1 && (
                <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`} className="page-btn">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link key={p} href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                  className={`page-btn ${p === page ? 'active' : ''}`}>{p}</Link>
              ))}
              {page < totalPages && (
                <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`} className="page-btn">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          {/* Search */}
          <div className="sidebar-card">
            <div className="sidebar-card-header" style={{ cursor: 'default' }}>
              <span className="sidebar-card-title">Search</span>
            </div>
            <div className="sidebar-card-body">
              <form action="/blogs" method="get">
                <div className="search-box">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input name="q" defaultValue={q} placeholder="Search articles..." />
                </div>
                <button type="submit" className="search-btn">Search</button>
              </form>
            </div>
          </div>

          {/* Categories */}
          <div className="sidebar-card">
            <div className="sidebar-card-header">
              <span className="sidebar-card-title">Categories</span>
              <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
            </div>
            <div className="sidebar-card-body" style={{ padding: '0.5rem 1.25rem' }}>
              {(categories as any[]).map(cat => (
                <Link key={(cat as any).slug}
                  href={`/blogs?category=${(cat as any).slug}`}
                  className={`cat-item ${categorySlug === (cat as any).slug ? 'cat-active' : ''}`}>
                  <span>{(cat as any).name}</span>
                  <span className="cat-count">{(cat as any).count}</span>
                </Link>
              ))}
              {categories.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '0.5rem 0' }}>No categories yet</p>}
            </div>
          </div>

          {/* Recent Articles */}
          <div className="sidebar-card">
            <div className="sidebar-card-header" style={{ cursor: 'default' }}>
              <span className="sidebar-card-title">Recent Articles</span>
            </div>
            <div className="sidebar-card-body" style={{ padding: '0.5rem 1.25rem' }}>
              {(recent as any[]).map(b => (
                <Link key={(b as any).slug} href={`/blog/${(b as any).slug}`} className="recent-item">
                  {(b as any).featured_image
                    ? <img src={(b as any).featured_image} alt={(b as any).title} className="recent-img" loading="lazy" />
                    : <div className="recent-img" style={{ background: '#e8ecf0', borderRadius: 8 }} />
                  }
                  <div>
                    <div className="recent-title">{(b as any).title}</div>
                    <div className="recent-date">{(b as any).published_at ? formatDate((b as any).published_at) : ''}</div>
                  </div>
                </Link>
              ))}
              {recent.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '0.5rem 0' }}>No articles yet</p>}
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
