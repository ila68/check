import { query, queryOne } from '@/lib/db'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
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

  const totalResult = await queryOne<any>(
    `SELECT COUNT(*) as c FROM blogs b LEFT JOIN blog_categories c ON b.category_id = c.id ${where}`,
    params
  )
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

  const recent = await query(`
    SELECT title, slug, featured_image, published_at 
    FROM blogs WHERE status = 'published' 
    ORDER BY published_at DESC LIMIT 6
  `)

  const totalPages = Math.ceil(total / perPage)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f7fa; color: #1a1a2e; }

        /* NAV */
        .b-nav { background: #fff; border-bottom: 1px solid #e8ecf0; padding: 0 2rem; height: 64px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .b-nav-logo { font-size: 1.25rem; font-weight: 800; color: #1a1a2e; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .b-nav-logo span { width: 32px; height: 32px; background: #2563eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.875rem; font-weight: 700; }
        .b-nav-links { display: flex; align-items: center; gap: 1.5rem; }
        .b-nav-links a { font-size: 0.9rem; font-weight: 500; color: #555; text-decoration: none; transition: color 0.15s; }
        .b-nav-links a:hover, .b-nav-links a.active { color: #2563eb; }
        .b-nav-btn { background: #2563eb; color: #fff !important; padding: 8px 18px; border-radius: 8px; font-weight: 600 !important; }
        .b-nav-btn:hover { background: #1d4ed8; opacity: 1; }

        /* HERO */
        .b-hero { background: #fff; padding: 2.5rem 2rem 2rem; text-align: center; border-bottom: 1px solid #e8ecf0; }
        .b-hero h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; color: #1a1a2e; margin-bottom: 0.375rem; letter-spacing: -0.03em; }
        .b-hero p { color: #6b7280; font-size: 1rem; }

        /* LAYOUT */
        .b-layout { max-width: 1280px; margin: 2rem auto; padding: 0 1.5rem; display: grid; grid-template-columns: 1fr 280px; gap: 2rem; align-items: start; }
        @media (max-width: 960px) { .b-layout { grid-template-columns: 1fr; } }

        /* MAIN */
        .b-main-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
        .b-main-title { font-size: 1.625rem; font-weight: 800; color: #1a1a2e; letter-spacing: -0.02em; }
        .b-count { font-size: 0.8125rem; color: #6b7280; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 100px; }

        /* FILTER TAG */
        .b-filter { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: #eff6ff; color: #2563eb; border-radius: 100px; font-size: 0.8125rem; font-weight: 600; text-decoration: none; margin-bottom: 1.25rem; border: 1px solid #bfdbfe; }

        /* GRID */
        .b-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }

        /* CARD */
        .b-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e8ecf0; text-decoration: none; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease; }
        .b-card:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(37,99,235,0.12); border-color: #bfdbfe; }
        .b-card-img { width: 100%; height: 195px; object-fit: cover; display: block; }
        .b-card-img-empty { width: 100%; height: 195px; background: linear-gradient(135deg, #e8ecf0 0%, #d1d9e0 100%); display: flex; align-items: center; justify-content: center; }
        .b-card-img-empty svg { opacity: 0.3; }
        .b-card-body { padding: 1.125rem 1.25rem 1.25rem; flex: 1; display: flex; flex-direction: column; }
        .b-card-cat { display: inline-block; font-size: 0.7rem; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 3px 10px; border-radius: 100px; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.625rem; }
        .b-card-title { font-size: 0.9875rem; font-weight: 700; color: #1a1a2e; line-height: 1.4; margin-bottom: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .b-card-excerpt { font-size: 0.85rem; color: #6b7280; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; margin-bottom: 1rem; }
        .b-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.875rem; border-top: 1px solid #f1f5f9; margin-top: auto; }
        .b-card-date { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #6b7280; }
        .b-card-arrow { width: 30px; height: 30px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .b-card:hover .b-card-arrow { background: #2563eb; }
        .b-card:hover .b-card-arrow path { stroke: white; }

        /* SIDEBAR */
        .b-sidebar { display: flex; flex-direction: column; gap: 1.25rem; position: sticky; top: 80px; }
        .b-scard { background: #fff; border-radius: 16px; border: 1px solid #e8ecf0; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .b-scard-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
        .b-scard-title { font-size: 0.9375rem; font-weight: 700; color: #1a1a2e; }
        .b-scard-body { padding: 0.875rem 1.25rem; }

        /* SEARCH */
        .b-search-wrap { position: relative; }
        .b-search-wrap input { width: 100%; padding: 0.625rem 1rem 0.625rem 2.5rem; border: 1.5px solid #e8ecf0; border-radius: 10px; font-size: 0.875rem; color: #1a1a2e; outline: none; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
        .b-search-wrap input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .b-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .b-search-btn { width: 100%; margin-top: 0.625rem; padding: 0.625rem; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .b-search-btn:hover { background: #1d4ed8; }

        /* CATEGORIES */
        .b-cat-item { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f8fafc; text-decoration: none; color: #374151; font-size: 0.875rem; transition: color 0.15s; }
        .b-cat-item:last-child { border-bottom: none; }
        .b-cat-item:hover { color: #2563eb; }
        .b-cat-item.active { color: #2563eb; font-weight: 600; }
        .b-cat-count { font-size: 0.75rem; background: #f1f5f9; color: #6b7280; padding: 2px 8px; border-radius: 100px; }
        .b-cat-item.active .b-cat-count { background: #eff6ff; color: #2563eb; }

        /* RECENT */
        .b-recent-item { display: flex; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 1px solid #f8fafc; text-decoration: none; align-items: flex-start; }
        .b-recent-item:last-child { border-bottom: none; }
        .b-recent-img { width: 54px; height: 42px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #e8ecf0; }
        .b-recent-info { flex: 1; min-width: 0; }
        .b-recent-title { font-size: 0.8125rem; font-weight: 600; color: #1a1a2e; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .b-recent-date { font-size: 0.75rem; color: #9ca3af; margin-top: 3px; }

        /* PAGINATION */
        .b-pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2.5rem; flex-wrap: wrap; }
        .b-page-btn { min-width: 38px; height: 38px; padding: 0 10px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1.5px solid #e8ecf0; font-size: 0.875rem; font-weight: 500; text-decoration: none; color: #374151; transition: all 0.15s; background: #fff; }
        .b-page-btn:hover { border-color: #2563eb; color: #2563eb; }
        .b-page-btn.active { background: #2563eb; color: white; border-color: #2563eb; }

        /* EMPTY */
        .b-empty { text-align: center; padding: 4rem 2rem; background: #fff; border-radius: 16px; border: 1px solid #e8ecf0; }
        .b-empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .b-empty h3 { font-size: 1.125rem; font-weight: 700; color: #374151; margin-bottom: 0.375rem; }
        .b-empty p { color: #9ca3af; font-size: 0.9rem; }
        .b-empty a { color: #2563eb; text-decoration: none; font-weight: 600; }

        /* FOOTER */
        .b-footer { background: #fff; border-top: 1px solid #e8ecf0; padding: 1.5rem 2rem; text-align: center; margin-top: 3rem; font-size: 0.875rem; color: #9ca3af; }
        .b-footer a { color: #2563eb; text-decoration: none; }
      `}</style>

      {/* Nav */}
      <nav className="b-nav">
        <Link href="/" className="b-nav-logo">
          <span>B</span> BlogCMS
        </Link>
        <div className="b-nav-links">
          <Link href="/">Home</Link>
          <Link href="/blogs" className="active">Blog</Link>
          <Link href="/admin/dashboard" className="b-nav-btn">Admin Panel</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="b-hero">
        <h1>All Blogs</h1>
        <p>Discover insightful articles and expert knowledge</p>
      </div>

      {/* Layout */}
      <div className="b-layout">

        {/* ===== MAIN CONTENT ===== */}
        <div>
          <div className="b-main-header">
            <h2 className="b-main-title">
              {q ? `Results for "${q}"` : categorySlug ? `Category: ${categorySlug}` : 'All Blogs'}
            </h2>
            <span className="b-count">{total} article{total !== 1 ? 's' : ''}</span>
          </div>

          {(categorySlug || q) && (
            <Link href="/blogs" className="b-filter">
              ✕ Clear filter
            </Link>
          )}

          {blogs.length === 0 ? (
            <div className="b-empty">
              <div className="b-empty-icon">📭</div>
              <h3>No articles found</h3>
              <p><Link href="/blogs">View all articles →</Link></p>
            </div>
          ) : (
            <div className="b-grid">
              {(blogs as any[]).map(blog => (
                <Link key={blog.id} href={`/blog/${blog.slug}`} className="b-card">
                  {blog.featured_image
                    ? <img src={blog.featured_image} alt={blog.title} className="b-card-img" loading="lazy" />
                    : (
                      <div className="b-card-img-empty">
                        <svg width="48" height="48" fill="none" stroke="#9ca3af" strokeWidth="1.5" viewBox="0 0 24 24">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )
                  }
                  <div className="b-card-body">
                    {blog.category_name && (
                      <span className="b-card-cat">{blog.category_name}</span>
                    )}
                    <div className="b-card-title">{blog.title}</div>
                    {blog.excerpt && <div className="b-card-excerpt">{blog.excerpt}</div>}
                    <div className="b-card-footer">
                      <div className="b-card-date">
                        <svg width="13" height="13" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        {blog.published_at ? formatDate(blog.published_at) : 'Draft'}
                      </div>
                      <div className="b-card-arrow">
                        <svg width="13" height="13" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path stroke="#2563eb" d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="b-pagination">
              {page > 1 && (
                <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`} className="b-page-btn">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Link key={p}
                  href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
                  className={`b-page-btn ${p === page ? 'active' : ''}`}>{p}</Link>
              ))}
              {page < totalPages && (
                <Link href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`} className="b-page-btn">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ===== SIDEBAR ===== */}
        <aside className="b-sidebar">

          {/* 1. SEARCH — TOP */}
          <div className="b-scard">
            <div className="b-scard-head">
              <span className="b-scard-title">Search</span>
            </div>
            <div className="b-scard-body">
              <form action="/blogs" method="get">
                <div className="b-search-wrap">
                  <svg className="b-search-icon" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input name="q" defaultValue={q} placeholder="Search articles..." />
                </div>
                <button type="submit" className="b-search-btn">Search</button>
              </form>
            </div>
          </div>

          {/* 2. CATEGORIES */}
          <div className="b-scard">
            <div className="b-scard-head">
              <span className="b-scard-title">Categories</span>
              <svg width="16" height="16" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 15l-6-6-6 6"/>
              </svg>
            </div>
            <div className="b-scard-body" style={{ padding: '0.5rem 1.25rem' }}>
              <Link href="/blogs" className={`b-cat-item ${!categorySlug ? 'active' : ''}`}>
                <span>All Categories</span>
                <span className="b-cat-count">{total}</span>
              </Link>
              {(categories as any[]).map(cat => (
                <Link
                  key={(cat as any).slug}
                  href={`/blogs?category=${(cat as any).slug}`}
                  className={`b-cat-item ${categorySlug === (cat as any).slug ? 'active' : ''}`}
                >
                  <span>{(cat as any).name}</span>
                  <span className="b-cat-count">{(cat as any).count}</span>
                </Link>
              ))}
              {categories.length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '0.5rem 0' }}>No categories yet</p>
              )}
            </div>
          </div>

          {/* 3. RECENT ARTICLES */}
          <div className="b-scard">
            <div className="b-scard-head">
              <span className="b-scard-title">Recent Articles</span>
            </div>
            <div className="b-scard-body" style={{ padding: '0.5rem 1.25rem' }}>
              {(recent as any[]).map(b => (
                <Link key={(b as any).slug} href={`/blog/${(b as any).slug}`} className="b-recent-item">
                  {(b as any).featured_image
                    ? <img src={(b as any).featured_image} alt={(b as any).title} className="b-recent-img" loading="lazy" />
                    : <div className="b-recent-img" style={{ borderRadius: 8, flexShrink: 0 }} />
                  }
                  <div className="b-recent-info">
                    <div className="b-recent-title">{(b as any).title}</div>
                    <div className="b-recent-date">
                      {(b as any).published_at ? formatDate((b as any).published_at) : ''}
                    </div>
                  </div>
                </Link>
              ))}
              {recent.length === 0 && (
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', padding: '0.5rem 0' }}>No articles yet</p>
              )}
            </div>
          </div>

        </aside>
      </div>

      {/* Footer */}
      <footer className="b-footer">
        <Link href="/">Home</Link> · <Link href="/blogs">Blog</Link> · <Link href="/admin/dashboard">Admin</Link>
      </footer>
    </>
  )
}
