'use client'
import { useState, useEffect } from 'react'
import { Save, Globe, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

const FIELDS = [
  { key: 'site_name', label: 'Website Name', type: 'text', placeholder: 'My Awesome Blog' },
  { key: 'default_meta_title', label: 'Default Meta Title', type: 'text', placeholder: 'My Blog - Expert Insights & Articles' },
  { key: 'default_meta_description', label: 'Default Meta Description', type: 'textarea', placeholder: '150-160 character description...' },
  { key: 'default_og_title', label: 'Default OG Title', type: 'text', placeholder: 'Social media title' },
  { key: 'default_og_description', label: 'Default OG Description', type: 'textarea', placeholder: 'Social media description' },
  { key: 'default_og_image', label: 'Default OG Image URL', type: 'text', placeholder: 'https://...' },
  { key: 'google_analytics_code', label: 'Google Analytics Code (GA4)', type: 'text', placeholder: 'G-XXXXXXXXXX' },
  { key: 'google_search_console_code', label: 'Google Search Console Verification', type: 'text', placeholder: 'Verification meta content value' },
]

export default function GlobalSEOPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [robots, setRobots] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/seo/global').then(r => r.json()).then(data => {
      setSettings(data.settings || {})
      setRobots(data.settings?.robots_txt || '')
      setFetching(false)
    })
  }, [])

  const save = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seo/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, robots_txt: robots }),
      })
      const data = await res.json()
      if (data.success) toast.success('SEO settings saved!')
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  if (fetching) return <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ margin: '0 auto' }} /></div>

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Global SEO Settings</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Site-wide SEO defaults and configurations</p>
        </div>
        <button onClick={save} disabled={loading} className="btn btn-primary">
          {loading ? <span className="spinner" /> : <Save size={14} />} Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} color="var(--primary)" /> Site Defaults
          </h3>
          {FIELDS.slice(0, 6).map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea className="form-textarea" value={settings[f.key] || ''} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ minHeight: 80 }} />
              ) : (
                <input className="form-input" value={settings[f.key] || ''} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={16} color="var(--primary)" /> Analytics & Verification
            </h3>
            {FIELDS.slice(6).map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input className="form-input" value={settings[f.key] || ''} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>Robots.txt</h3>
            <textarea className="form-textarea" value={robots} onChange={e => setRobots(e.target.value)}
              style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} />
            <p className="form-hint mt-1">Controls how search engine crawlers access your site.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button onClick={save} disabled={loading} className="btn btn-primary btn-lg">
          {loading ? <span className="spinner" /> : <Save size={16} />} Save All Settings
        </button>
      </div>
    </div>
  )
}
