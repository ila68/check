import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const role = (token?.role as string) || ''
    const path = req.nextUrl.pathname

    // These pages only for super_admin
    const superAdminOnly = [
      '/admin/categories',
      '/admin/comments',
      '/admin/media',
      '/admin/settings',
      '/admin/seo',
      '/admin/users',
    ]

    const isRestricted = superAdminOnly.some(p => path.startsWith(p))
    if (isRestricted && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/admin/dashboard?error=unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/admin/login') return true
        return !!token
      },
    },
    pages: { signIn: '/admin/login' },
  }
)

export const config = { matcher: ['/admin/:path*'] }
