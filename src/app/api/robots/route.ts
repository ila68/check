import { NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export async function GET() {
  try {
    const row = await queryOne<any>("SELECT value FROM seo_settings WHERE setting_key = 'robots_txt'")
    const content = row?.value || 'User-agent: *\nAllow: /\nDisallow: /admin/\n'
    return new NextResponse(content, { headers: { 'Content-Type': 'text/plain' } })
  } catch {
    return new NextResponse('User-agent: *\nAllow: /', { headers: { 'Content-Type': 'text/plain' } })
  }
}
