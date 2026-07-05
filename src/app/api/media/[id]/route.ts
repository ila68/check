import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import path from 'path'
import fs from 'fs'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const media = await queryOne<any>('SELECT * FROM media_library WHERE id = ?', [Number(params.id)])
    if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const filePath = path.join(process.cwd(), 'public', media.url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await execute('DELETE FROM media_library WHERE id = ?', [Number(params.id)])
    return NextResponse.json({ success: true })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
