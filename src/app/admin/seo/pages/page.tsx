'use client'
import { useState, useEffect } from 'react'
import { Save, Plus, Globe, Code, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateOrganizationSchema } from '@/lib/utils'

const SCHEMA_TYPES = ['WebPage', 'Organization', 'BreadcrumbList', 'FAQPage']

export default function PageSEOPage() {
  const [pages, setPages] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => { fetchPages() }, [])

  const fetchPages = async () => {
    setFetching(true)
    const res = await fetch('/api/seo/pages')
    const data = await res.json()
    setPages(data.pages || [])
    if (data.pages?.length) setActive(data.pages[0])
    setFetching(false)
  }

  const set = (k: string, v: any) => setActive((p: any) => ({ ...p, [k]: v }))

  const save = async () => {
    if (!active) return
    setLoading(true)
    try {
      const res = await fetch(`/api/seo/pages/${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(active),
      })
      const data = await res.json()
      if (data.success) { toast.success('Saved!'); fetchPages() }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  const addPage = async () => {
    const name = prompt('Page name (e.g. "About Us"):')
    if (!name) return
    const res = await fetch('/api/seo/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_name: name, page_identifier: name.toLowerCase().replace(/\s+/g, '-') }),
    })
    const data = await res.json()
    if (data.success) { fetchPages(); toast.success('Page added!') }
    else toast.error(data.error || 'Failed')
  }

  const parseSchemas = (raw: string): Record<string, any> => {
    try { return JSON.parse(raw || '{}') } catch { return {} }
  }

  const toggleSchema = (type: string) => {
    const schemas = parseSchemas(active?.schemas || '{}')
    if (schemas[type]) delete schemas[type]
    else schemas[type] = { '@context': 'https://schema.org', '@type': type }
    set('schemas', JSON.stringify(schemas, null, 2))
  }

  const hasSchema = (type: string) => !!parseSchemas(active?.schemas || '{}')[type]

  if (fetching) return <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></div>

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Page SEO</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Manage SEO settings for each page</p>
        </div>
        <div className="flex gap-2">
          <button onClick={addPage} className="btn btn-secondary"><Plus size={14} /> Add Page</button>
          <button onClick={save} disabled={loading} className="btn btn-primary">
            {loading ? <span className="spinner" /> : <Save size={14} />} Save
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        {/* Page list */}
        <div className="card" style={{ padding: '0.75rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', padding: '0 0.25rem' }}>Pages</h3>
          {pages.map(page => (
            <button key={page.id} onClick={() => setActive(page)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: 7,
                background: active?.id === page.id ? 'rgba(67,97,238,0.08)' : 'none',
                color: active?.id === page.id ? 'var(--primary)' : 'var(--ink)',
                border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: active?.id === page.id ? 600 : 400,
                transition: 'all 0.15s', marginBottom: 2,
              }}>
              <Globe size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              {page.page_name}
            </button>
          ))}
        </div>

        {/* Editor */}
        {active && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>{active.page_name} — Meta Tags</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'meta_title', label: 'Meta Title', maxLen: 60 },
                  { key: 'canonical_url', label: 'Canonical URL' },
                  { key: 'og_title', label: 'OG Title' },
                  { key: 'og_image', label: 'OG Image URL' },
                ].map(f => (
                  <div key={f.key} className="form-group mb-0">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" value={active[f.key] || ''} onChange={e => set(f.key, e.target.value)} maxLength={f.maxLen} />
                    {f.maxLen && <span className="form-hint">{(active[f.key] || '').length}/{f.maxLen}</span>}
                  </div>
                ))}
              </div>
              <div className="form-group mt-4">
                <label className="form-label">Meta Description</label>
                <textarea className="form-textarea" value={active.meta_description || ''} onChange={e => set('meta_description', e.target.value)} style={{ minHeight: 80 }} maxLength={160} />
                <span className="form-hint">{(active.meta_description || '').length}/160</span>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">OG Description</label>
                <textarea className="form-textarea" value={active.og_description || ''} onChange={e => set('og_description', e.target.value)} style={{ minHeight: 70 }} />
              </div>
            </div>

            {/* Schema */}
            <div className="card">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>Schema Markup</h3>
              <div className="flex items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink)' }}>Schema Enabled</span>
                  <button onClick={() => set('schema_enabled', active.schema_enabled ? 0 : 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: active.schema_enabled ? 'var(--primary)' : 'var(--ink-muted)' }}>
                    {active.schema_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>

              {active.schema_enabled ? (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {SCHEMA_TYPES.map(type => (
                      <button key={type} onClick={() => toggleSchema(type)}
                        className={`btn btn-sm ${hasSchema(type) ? 'btn-primary' : 'btn-secondary'}`}>
                        {hasSchema(type) ? '✓ ' : '+ '}{type}
                      </button>
                    ))}
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Code size={14} /> Schema JSON (editable)</label>
                    <textarea className="form-textarea" value={active.schemas || '{}'} onChange={e => set('schemas', e.target.value)}
                      style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} />
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Schema markup is disabled for this page.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
