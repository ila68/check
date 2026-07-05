import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import path from 'path'
import fs from 'fs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const formData = await req.formData()
    const file = formData.get('file') as File
    const alt = formData.get('alt') as string || ''
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filepath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filepath, buffer)

    const url = `/uploads/${filename}`
    const userId = (session.user as any).id
    const result = await execute(`INSERT INTO media_library (filename, original_name, mime_type, size, alt_text, url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [filename, file.name, file.type, file.size, alt, url, userId])

    return NextResponse.json({ success: true, url, filename, alt })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
