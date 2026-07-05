'use client'
import { useState, useEffect } from 'react'
import { generateSlug } from '@/lib/utils'
import { Plus, Edit, Trash2, FolderOpen, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: number; name: string; slug: string; description: string; image: string;
  meta_title: string; meta_description: string; canonical_url: string;
  og_title: string; og_description: string; blog_count: number;
}

const empty = { id: 0, name: '', slug: '', description: '', image: '', meta_title: '', meta_description: '', canonical_url: '', og_title: '', og_description: '', blog_count: 0 }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchCats() }, [])

  const fetchCats = async () => {
    const res = await fetch('/api/categories')
    const data = await res.json()
    setCats(data.categories || [])
  }

  const openAdd = () => { setEditing({ ...empty }); setShowForm(true) }
  const openEdit = (cat: Category) => { setEditing({ ...cat }); setShowForm(true) }
  const closeForm = () => { setEditing(null); setShowForm(false) }

  const set = (k: string, v: string) => {
    setEditing(e => {
      const next = { ...e, [k]: v } as any
      if (k === 'name') next.slug = generateSlug(v)
      return next
    })
  }

  const save = async () => {
    if (!editing?.name) { toast.error('Name is required'); return }
    setLoading(true)
    try {
      const isEdit = !!editing.id
      const res = await fetch(isEdit ? `/api/categories/${editing.id}` : '/api/categories', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      })
      const data = await res.json()
      if (data.success) { toast.success(isEdit ? 'Updated!' : 'Created!'); closeForm(); fetchCats() }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Error') }
    finally { setLoading(false) }
  }

  const del = async (id: number) => {
    if (!confirm('Delete this category?')) return
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { toast.success('Deleted'); fetchCats() }
    else toast.error(data.error || 'Failed')
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Categories</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>{cats.length} categories</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><Plus size={15} /> Add Category</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Grid */}
        <div style={{ gridColumn: showForm ? '1' : 'span 3' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cats.map(cat => (
              <div key={cat.id} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, background: 'rgba(67,97,238,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {cat.image ? <img src={cat.image} alt={cat.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10 }} />
                    : <FolderOpen size={20} color="var(--primary)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ink)' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 2 }}>/{cat.slug}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 2 }}>{cat.blog_count || 0} blogs</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(cat)} className="btn btn-secondary btn-sm"><Edit size={13} /></button>
                  <button onClick={() => del(cat.id)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {cats.length === 0 && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '2rem', gridColumn: 'span 2' }}>
                No categories yet. <button onClick={openAdd} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Create the first one!</button>
              </div>
            )}
          </div>
        </div>

        {/* Form Sidebar */}
        {showForm && editing && (
          <div style={{ gridColumn: 'span 2' }}>
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{editing.id ? 'Edit' : 'Add'} Category</h3>
                <button onClick={closeForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}><X size={18} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input className="form-input" value={editing.name || ''} onChange={e => set('name', e.target.value)} placeholder="Category name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input className="form-input" value={editing.slug || ''} onChange={e => set('slug', generateSlug(e.target.value))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={editing.description || ''} onChange={e => set('description', e.target.value)} placeholder="Category description" style={{ minHeight: 80 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input className="form-input" value={editing.image || ''} onChange={e => set('image', e.target.value)} placeholder="https://..." />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.75rem' }}>SEO</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'meta_title', label: 'Meta Title' }, { key: 'canonical_url', label: 'Canonical URL' },
                    { key: 'og_title', label: 'OG Title' },
                  ].map(f => (
                    <div key={f.key} className="form-group mb-0">
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" value={(editing as any)[f.key] || ''} onChange={e => set(f.key, e.target.value)} />
                    </div>
                  ))}
                </div>
                <div className="form-group mt-3">
                  <label className="form-label">Meta Description</label>
                  <textarea className="form-textarea" value={editing.meta_description || ''} onChange={e => set('meta_description', e.target.value)} style={{ minHeight: 70 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">OG Description</label>
                  <textarea className="form-textarea" value={editing.og_description || ''} onChange={e => set('og_description', e.target.value)} style={{ minHeight: 70 }} />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={closeForm} className="btn btn-secondary">Cancel</button>
                <button onClick={save} disabled={loading} className="btn btn-primary">
                  {loading ? <span className="spinner" /> : <Save size={14} />} Save Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
