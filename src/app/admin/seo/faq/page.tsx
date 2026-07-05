'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, ChevronDown, ChevronUp, Code } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateFAQSchema } from '@/lib/utils'

interface FAQ { id?: number; question: string; answer: string; sort_order: number }

export default function FAQSchemaPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(false)
  const [showJson, setShowJson] = useState(false)

  useEffect(() => {
    fetch('/api/seo/faq').then(r => r.json()).then(d => setFaqs(d.faqs || []))
  }, [])

  const addFAQ = () => setFaqs(f => [...f, { question: '', answer: '', sort_order: f.length }])
  const removeFAQ = (i: number) => setFaqs(f => f.filter((_, idx) => idx !== i))
  const updateFAQ = (i: number, key: 'question' | 'answer', val: string) =>
    setFaqs(f => f.map((faq, idx) => idx === i ? { ...faq, [key]: val } : faq))
  const moveFAQ = (i: number, dir: -1 | 1) => {
    const next = [...faqs]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setFaqs(next.map((f, idx) => ({ ...f, sort_order: idx })))
  }

  const save = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seo/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqs }),
      })
      const data = await res.json()
      if (data.success) toast.success('FAQs saved!')
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  const schema = generateFAQSchema(faqs.filter(f => f.question && f.answer))

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>FAQ Schema Builder</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>Build FAQ schema markup for rich search results</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJson(!showJson)} className="btn btn-secondary">
            <Code size={14} /> {showJson ? 'Hide' : 'View'} JSON
          </button>
          <button onClick={save} disabled={loading} className="btn btn-primary">
            {loading ? <span className="spinner" /> : <Save size={14} />} Save FAQs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="card" style={{ position: 'relative' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={() => moveFAQ(i, -1)} disabled={i === 0} className="btn btn-secondary btn-sm" style={{ padding: '3px 7px' }}><ChevronUp size={13} /></button>
                  <button onClick={() => moveFAQ(i, 1)} disabled={i === faqs.length - 1} className="btn btn-secondary btn-sm" style={{ padding: '3px 7px' }}><ChevronDown size={13} /></button>
                  <button onClick={() => removeFAQ(i)} className="btn btn-danger btn-sm" style={{ padding: '3px 7px' }}><Trash2 size={13} /></button>
                </div>
                <div className="form-group">
                  <label className="form-label">Question</label>
                  <input className="form-input" value={faq.question} onChange={e => updateFAQ(i, 'question', e.target.value)} placeholder="Enter FAQ question..." />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Answer</label>
                  <textarea className="form-textarea" value={faq.answer} onChange={e => updateFAQ(i, 'answer', e.target.value)} placeholder="Enter detailed answer..." style={{ minHeight: 80 }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addFAQ} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={15} /> Add FAQ
          </button>
        </div>

        {showJson && (
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Code size={16} color="var(--primary)" /> Generated Schema JSON
            </h3>
            <pre style={{ background: '#1e293b', color: '#f1f5f9', padding: '1rem', borderRadius: 8, fontSize: '0.8rem', overflow: 'auto', maxHeight: 500, fontFamily: 'var(--font-mono)' }}>
              {JSON.stringify(schema, null, 2)}
            </pre>
            <p className="form-hint mt-2">This schema is automatically added to pages that have FAQ sections enabled.</p>
          </div>
        )}
      </div>
    </div>
  )
}
