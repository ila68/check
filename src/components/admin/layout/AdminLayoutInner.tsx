'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, FileText, FolderOpen, MessageSquare, Image as ImageIcon,
  Settings, ChevronDown, ChevronRight, LogOut, Menu, X, Sun, Moon,
  TrendingUp, Globe, User, Trash2, ShieldCheck, AlertTriangle
} from 'lucide-react'

export default function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expanded, setExpanded] = useState<string[]>(['Blogs', 'SEO'])
  const [dark, setDark] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || ''
  const isSuperAdmin = role === 'super_admin'

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cms-theme')
      if (saved === 'dark') { setDark(true); document.documentElement.classList.add('dark') }
    } catch {}
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('cms-theme', next ? 'dark' : 'light') } catch {}
  }

  const toggleExpand = (label: string) =>
    setExpanded(e => e.includes(label) ? e.filter(x => x !== label) : [...e, label])

  const isActive = (href: string) => pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href + '/'))

  if (pathname === '/admin/login') return <>{children}</>

  // Nav based on role
  const NAV_ITEMS = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, show: true },
    {
      label: 'Blogs', icon: FileText, show: true,
      children: [
        { label: 'All Blogs', href: '/admin/blogs/list' },
        { label: 'Add New', href: '/admin/blogs/new' },
        { label: 'Trash', href: '/admin/blogs/trash' },
      ],
    },
    { label: 'Categories', href: '/admin/categories', icon: FolderOpen, show: isSuperAdmin },
    { label: 'Comments', href: '/admin/comments', icon: MessageSquare, show: isSuperAdmin },
    { label: 'Media Library', href: '/admin/media', icon: ImageIcon, show: isSuperAdmin },
    {
      label: 'SEO', icon: TrendingUp, show: isSuperAdmin,
      children: [
        { label: 'Global Settings', href: '/admin/seo/global' },
        { label: 'Page SEO', href: '/admin/seo/pages' },
        { label: 'FAQ Schema', href: '/admin/seo/faq' },
      ],
    },
    { label: 'Users', href: '/admin/users', icon: User, show: isSuperAdmin },
    { label: 'Settings', href: '/admin/settings', icon: Settings, show: isSuperAdmin },
  ]

  const visibleNav = NAV_ITEMS.filter(item => item.show)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-secondary)' }}>
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className="lg-sidebar" style={{
        width: 260, minHeight: '100vh', background: 'var(--surface)',
        borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={17} color="white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink)' }}>BlogCMS</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Role Badge */}
        <div style={{ padding: '0.625rem 1.25rem', borderBottom: '1px solid var(--border)', background: isSuperAdmin ? 'rgba(67,97,238,0.05)' : 'rgba(245,158,11,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: isSuperAdmin ? 'var(--primary)' : '#d97706' }}>
            <ShieldCheck size={13} />
            {isSuperAdmin ? 'Super Admin — Full Access' : role === 'admin' ? 'Admin — Blog Access Only' : role}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
          {visibleNav.map((item) => (
            <div key={item.label} style={{ marginBottom: 2 }}>
              {(item as any).children ? (
                <>
                  <button onClick={() => toggleExpand(item.label)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.6rem 0.875rem', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(67,97,238,0.06)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <item.icon size={16} /> {item.label}
                    </span>
                    {expanded.includes(item.label) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expanded.includes(item.label) && (
                    <div style={{ marginLeft: 16, paddingLeft: '0.875rem', borderLeft: '2px solid var(--border)', marginTop: 2 }}>
                      {(item as any).children.map((child: any) => (
                        <Link key={child.href} href={child.href} onClick={() => setSidebarOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', borderRadius: 7, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, color: isActive(child.href) ? 'var(--primary)' : 'var(--ink-muted)', background: isActive(child.href) ? 'rgba(67,97,238,0.08)' : 'none', marginBottom: 2, transition: 'all 0.15s' }}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={(item as any).href} onClick={() => setSidebarOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.875rem', borderRadius: 8, textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, color: isActive((item as any).href) ? 'var(--primary)' : 'var(--ink-muted)', background: isActive((item as any).href) ? 'rgba(67,97,238,0.08)' : 'none', transition: 'all 0.15s' }}>
                  <item.icon size={16} /> {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.625rem 0.75rem', marginBottom: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: isSuperAdmin ? 'var(--primary)' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={15} color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session?.user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session?.user?.email || ''}
              </div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: '#dc2626', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fee2e2'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </aside>

      <div style={{ width: 260, flexShrink: 0 }} className="sidebar-spacer" />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', padding: 4 }}>
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleDark} className="btn btn-secondary btn-sm">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link href="https://watnidea.com/" target="_blank" className="btn btn-secondary btn-sm">
              <Globe size={14} /> View Site
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: '1.75rem', overflow: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-sidebar { transform: translateX(0) !important; position: sticky !important; top: 0 !important; height: 100vh !important; }
          .sidebar-spacer { display: none !important; }
        }
        @media (max-width: 1023px) { .sidebar-spacer { display: none !important; } }
      `}</style>
    </div>
  )
}
