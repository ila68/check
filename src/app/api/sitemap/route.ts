import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { generateSitemapXML } from '@/lib/utils'

export async function GET() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const blogs = await query<any>("SELECT slug, updated_at FROM blogs WHERE status = 'published' ORDER BY updated_at DESC")
    const categories = await query<any>('SELECT slug, updated_at FROM blog_categories ORDER BY updated_at DESC')
    const urls = [
      { loc: siteUrl, changefreq: 'daily', priority: '1.0', lastmod: new Date().toISOString().split('T')[0] },
      { loc: `${siteUrl}/blogs`, changefreq: 'daily', priority: '0.9', lastmod: new Date().toISOString().split('T')[0] },
      ...blogs.map((b: any) => ({ loc: `${siteUrl}/blog/${b.slug}`, changefreq: 'weekly', priority: '0.8', lastmod: new Date(b.updated_at).toISOString().split('T')[0] })),
      ...categories.map((c: any) => ({ loc: `${siteUrl}/category/${c.slug}`, changefreq: 'weekly', priority: '0.7', lastmod: new Date(c.updated_at).toISOString().split('T')[0] })),
    ]
    return new NextResponse(generateSitemapXML(urls), { headers: { 'Content-Type': 'application/xml' } })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
