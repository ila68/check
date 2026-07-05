import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { meta_title, meta_description, slug, canonical_url, og_title, og_description, og_image, schema_enabled, schemas } = await req.json()
    await execute(`UPDATE page_seo SET meta_title=?, meta_description=?, slug=?, canonical_url=?, og_title=?, og_description=?, og_image=?, schema_enabled=?, schemas=? WHERE id=?`,
      [meta_title || null, meta_description || null, slug || null, canonical_url || null, og_title || null, og_description || null, og_image || null, schema_enabled ? 1 : 0, schemas || '{}', Number(params.id)])
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
