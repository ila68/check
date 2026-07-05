'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Image as ImgIcon, Copy, Check, Search } from 'lucide-react'
import toast from 'react-hot-toast'

interface MediaItem {
  id: number; filename: string; original_name: string; url: string;
  mime_type: string; size: number; width?: number; height?: number;
  alt_text?: string; created_at: string;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchMedia() }, [])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/media')
      const data = await res.json()
      setItems(data.media || [])
    } catch {}
    setLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    let uploaded = 0
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('alt', file.name.replace(/\.[^/.]+$/, ''))
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.success) uploaded++
        else toast.error(`Failed: ${file.name}`)
      } catch { toast.error(`Error uploading ${file.name}`) }
    }
    if (uploaded > 0) { toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`); fetchMedia() }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url)
    setCopied(item.id)
    setTimeout(() => setCopied(null), 2000)
    toast.success('URL copied!')
  }

  const deleteMedia = async (id: number) => {
    if (!confirm('Delete this file?')) return
    const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success('Deleted'); fetchMedia(); if (selected?.id === id) setSelected(null) }
    else toast.error(data.error || 'Failed')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filtered = items.filter(i =>
    i.original_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.alt_text || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Media Library</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{items.length} files</p>
        </div>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          {uploading ? <span className="spinner" /> : <Upload size={15} />}
          {uploading ? 'Uploading...' : 'Upload Files'}
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
        </label>
      </div>

      {/* Search */}
      <div className="card mb-5" style={{ padding: '0.875rem 1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
          <input className="form-input" value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }} placeholder="Search by filename or alt text..." />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 280px' : '1fr', gap: '1.5rem' }}>
        {/* Grid */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}><span className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.875rem' }}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelected(selected?.id === item.id ? null : item)}
                  style={{
                    borderRadius: 10, overflow: 'hidden', border: `2px solid ${selected?.id === item.id ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: 'pointer', background: 'var(--surface)', transition: 'all 0.15s', position: 'relative',
                  }}
                >
                  <div style={{ aspectRatio: '4/3', background: 'var(--surface-secondary)', overflow: 'hidden' }}>
                    <img src={item.url} alt={item.alt_text || item.original_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ padding: '0.5rem 0.625rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.original_name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: 2 }}>{formatSize(item.size)}</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
                  {search ? 'No files match your search.' : 'No files yet. Upload your first image!'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '1.75rem' }}>
            <div style={{ marginBottom: '1rem', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-secondary)', aspectRatio: '16/9' }}>
              <img src={selected.url} alt={selected.alt_text || selected.original_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.875rem', wordBreak: 'break-word' }}>{selected.original_name}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
              <div><strong style={{ color: 'var(--ink)' }}>Size:</strong> {formatSize(selected.size)}</div>
              {selected.width && <div><strong style={{ color: 'var(--ink)' }}>Dimensions:</strong> {selected.width}×{selected.height}px</div>}
              <div><strong style={{ color: 'var(--ink)' }}>Type:</strong> {selected.mime_type}</div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>URL</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input readOnly className="form-input" value={selected.url} style={{ fontSize: '0.8rem', flex: 1 }} />
                <button onClick={() => copyUrl(selected)} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                  {copied === selected.id ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
            <button onClick={() => deleteMedia(selected.id)} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: '0.875rem' }}>
              <Trash2 size={14} /> Delete File
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
