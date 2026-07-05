'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { generateSlug } from '@/lib/utils'
import { Save, Globe, Plus, X, Image as ImgIcon, Link as LinkIcon, Loader, Lock } from 'lucide-react'

interface BlogFormProps {
  blog?: any
  categories: any[]
  mode: 'add' | 'edit'
  userRole?: string
}

export default function BlogForm({ blog, categories, mode, userRole = '' }: BlogFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content')
  const [imageUploading, setImageUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [savedRange, setSavedRange] = useState<Range | null>(null)

  const isSuperAdmin = userRole === 'super_admin'

  const [form, setForm] = useState({
    title: blog?.title || '',
    slug: blog?.slug || '',
    category_id: blog?.category_id || '',
    tags: blog?.tags ? (typeof blog.tags === 'string' ? JSON.parse(blog.tags) : blog.tags) : [],
    tagInput: '',
    featured_image: blog?.featured_image || '',
    featured_image_alt: blog?.featured_image_alt || '',
    status: blog?.status || 'draft',
    scheduled_at: blog?.scheduled_at || '',
    meta_title: blog?.meta_title || '',
    meta_description: blog?.meta_description || '',
    focus_keyword: blog?.focus_keyword || '',
    canonical_url: blog?.canonical_url || '',
    og_title: blog?.og_title || '',
    og_description: blog?.og_description || '',
    og_image: blog?.og_image || '',
  })

  useEffect(() => {
    if (blog?.content && editorRef.current) {
      editorRef.current.innerHTML = blog.content
    }
  }, [])

  useEffect(() => {
    if (mode === 'add' && form.title) {
      setForm(f => ({ ...f, slug: generateSlug(f.title) }))
    }
  }, [form.title, mode])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const execCmd = (cmd: string) => { editorRef.current?.focus(); document.execCommand(cmd, false, undefined) }

  const insertBlock = (tag: string) => {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return
    const range = sel.getRangeAt(0)
    const el = document.createElement(tag)
    const textMap: Record<string, string> = {
      h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', h4: 'Heading 4',
      blockquote: 'Your quote here...', p: 'Your paragraph text here...',
      ul: '<li>List item one</li><li>List item two</li>',
      ol: '<li>First item</li><li>Second item</li>',
    }
    el.innerHTML = textMap[tag] || 'Text here...'
    range.deleteContents()
    range.insertNode(el)
    const br = document.createElement('br')
    el.parentNode?.insertBefore(br, el.nextSibling)
    range.setStartAfter(br)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount) setSavedRange(sel.getRangeAt(0).cloneRange())
  }

  const openLinkModal = () => {
    saveSelection()
    setLinkText(window.getSelection()?.toString() || '')
    setLinkUrl('')
    setShowLinkModal(true)
  }

  const insertLink = () => {
    if (!linkUrl) return
    editorRef.current?.focus()
    if (savedRange) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedRange)
    }
    const a = document.createElement('a')
    a.href = linkUrl
    a.textContent = linkText || linkUrl
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    const sel = window.getSelection()
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(a)
    }
    setShowLinkModal(false)
  }

  const addTag = () => {
    const t = form.tagInput.trim()
    if (t && !form.tags.includes(t)) { set('tags', [...form.tags, t]); set('tagInput', '') }
  }
  const removeTag = (tag: string) => set('tags', form.tags.filter((t: string) => t !== tag))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('alt', form.featured_image_alt || form.title)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) { set('featured_image', data.url); toast.success('Image uploaded!') }
      else toast.error('Upload failed')
    } catch { toast.error('Upload failed') }
    finally { setImageUploading(false) }
  }

  const handleSubmit = async (status?: string) => {
    if (!form.title) { toast.error('Title is required'); return }
    if (!form.slug) { toast.error('Slug is required'); return }
    setLoading(true)
    try {
      const content = editorRef.current?.innerHTML || ''
      const payload = { ...form, content, status: status || form.status, tags: JSON.stringify(form.tags) }
      delete (payload as any).tagInput
      const url = mode === 'edit' ? `/api/blogs/${blog.id}` : '/api/blogs'
      const res = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) { toast.success(mode === 'edit' ? 'Blog updated!' : 'Blog created!'); router.push('/admin/blogs/list') }
      else toast.error(data.error || 'Failed to save')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  // tabs - SEO only for super_admin
  const tabs = [
    { key: 'content', label: '📝 Content', show: true },
    { key: 'seo', label: '🔍 SEO', show: isSuperAdmin },
    { key: 'settings', label: '⚙️ Settings', show: true },
  ].filter(t => t.show)

  const toolbarBtns = [
    { groups: [
      { btns: [
        { label: 'H1', action: () => insertBlock('h1'), title: 'Heading 1' },
        { label: 'H2', action: () => insertBlock('h2'), title: 'Heading 2' },
        { label: 'H3', action: () => insertBlock('h3'), title: 'Heading 3' },
        { label: 'H4', action: () => insertBlock('h4'), title: 'Heading 4' },
      ]},
      { btns: [
        { label: 'B', action: () => execCmd('bold'), title: 'Bold', bold: true },
        { label: 'I', action: () => execCmd('italic'), title: 'Italic', italic: true },
        { label: 'U', action: () => execCmd('underline'), title: 'Underline', underline: true },
      ]},
      { btns: [
        { label: '• List', action: () => insertBlock('ul'), title: 'Bullet List' },
        { label: '1. List', action: () => insertBlock('ol'), title: 'Numbered List' },
        { label: '" Quote', action: () => insertBlock('blockquote'), title: 'Quote' },
        { label: '¶ Para', action: () => insertBlock('p'), title: 'Paragraph' },
      ]},
      { btns: [
        { label: '≡ Left', action: () => execCmd('justifyLeft'), title: 'Left' },
        { label: '≡ Center', action: () => execCmd('justifyCenter'), title: 'Center' },
        { label: '≡ Right', action: () => execCmd('justifyRight'), title: 'Right' },
      ]},
    ]}
  ]

  return (
    <div className="fade-in">
      {/* Link Modal */}
      {showLinkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}><LinkIcon size={16} color="var(--primary)" /> Insert Link</h3>
              <button onClick={() => setShowLinkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}><X size={18} /></button>
            </div>
            <div className="form-group">
              <label className="form-label">Link Text</label>
              <input className="form-input" value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Click here to read more" />
            </div>
            <div className="form-group">
              <label className="form-label">URL *</label>
              <input className="form-input" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" autoFocus />
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setShowLinkModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={insertLink} className="btn btn-primary"><LinkIcon size={13} /> Insert</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>
            {mode === 'add' ? 'Add New Blog' : 'Edit Blog'}
          </h1>
          {!isSuperAdmin && (
            <p style={{ fontSize: '0.8rem', color: '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={12} /> SEO settings are restricted. Please contact your Super Admin.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSubmit('draft')} disabled={loading} className="btn btn-secondary">
            <Save size={14} /> Save Draft
          </button>
          <button onClick={() => handleSubmit('published')} disabled={loading} className="btn btn-primary">
            {loading ? <Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Globe size={14} />} Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            style={{ padding: '0.5rem 1.125rem', fontWeight: 500, fontSize: '0.9rem', background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid var(--primary)' : '2px solid transparent', marginBottom: -2, color: activeTab === t.key ? 'var(--primary)' : 'var(--ink-muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>
        <div>
          {/* CONTENT TAB */}
          {activeTab === 'content' && (
            <div className="card">
              <div className="form-group">
                <label className="form-label">Blog Title *</label>
                <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Enter an engaging blog title..." style={{ fontSize: '1.05rem', fontWeight: 500 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <div style={{ display: 'flex' }}>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.75rem', background: 'var(--surface-secondary)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '0.875rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>/blog/</span>
                  <input className="form-input" value={form.slug} onChange={e => set('slug', generateSlug(e.target.value))} style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }} />
                </div>
              </div>

              {/* Rich Text Editor */}
              <div className="form-group mb-0">
                <label className="form-label">Content</label>
                <div style={{ border: '1.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  {/* Toolbar */}
                  <div style={{ background: 'var(--surface-secondary)', borderBottom: '1px solid var(--border)', padding: '0.5rem 0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {toolbarBtns[0].groups.map((group, gi) => (
                      <div key={gi} style={{ display: 'flex', gap: 3, paddingRight: gi < toolbarBtns[0].groups.length - 1 ? '0.5rem' : 0, borderRight: gi < toolbarBtns[0].groups.length - 1 ? '1.5px solid var(--border)' : 'none', marginRight: gi < toolbarBtns[0].groups.length - 1 ? '0.125rem' : 0 }}>
                        {group.btns.map((btn, bi) => (
                          <button key={bi} type="button" onClick={btn.action} title={btn.title}
                            style={{ padding: '4px 9px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: '0.775rem', fontWeight: (btn as any).bold ? 800 : 600, fontStyle: (btn as any).italic ? 'italic' : 'normal', textDecoration: (btn as any).underline ? 'underline' : 'none', cursor: 'pointer', background: 'var(--surface)', color: 'var(--ink)', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--primary)'; el.style.color = 'white'; el.style.borderColor = 'var(--primary)' }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--surface)'; el.style.color = 'var(--ink)'; el.style.borderColor = 'var(--border)' }}>
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    ))}
                    {/* Link button */}
                    <button type="button" onClick={openLinkModal} title="Insert Link"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: '1.5px solid var(--primary)', fontSize: '0.775rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(67,97,238,0.07)', color: 'var(--primary)', transition: 'all 0.12s' }}>
                      <LinkIcon size={11} /> Link
                    </button>
                  </div>

                  {/* Editable Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onMouseUp={saveSelection}
                    onKeyUp={saveSelection}
                    data-placeholder="Start writing your blog content here... Use toolbar buttons to format text."
                    style={{ minHeight: 400, padding: '1.25rem', outline: 'none', fontSize: '0.9375rem', lineHeight: 1.8, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}
                  />
                </div>
                <p className="form-hint mt-1">💡 Tip: Select text then click Bold, Italic or Link. Click H1–H4 to insert a heading block.</p>
              </div>

              <style>{`
                [contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; display: block; }
                [contenteditable] h1 { font-size: 1.875rem; font-weight: 800; margin: 1rem 0 0.5rem; color: var(--ink); }
                [contenteditable] h2 { font-size: 1.5rem; font-weight: 700; margin: 0.875rem 0 0.5rem; color: var(--ink); }
                [contenteditable] h3 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.375rem; color: var(--ink); }
                [contenteditable] h4 { font-size: 1.0625rem; font-weight: 700; margin: 0.625rem 0 0.25rem; color: var(--ink); }
                [contenteditable] p { margin-bottom: 0.75rem; }
                [contenteditable] blockquote { border-left: 4px solid #4361ee; padding: 0.75rem 1rem; background: #f0f4ff; border-radius: 0 8px 8px 0; margin: 0.75rem 0; color: #555; font-style: italic; }
                [contenteditable] ul { padding-left: 1.5rem; margin: 0.5rem 0; list-style: disc; }
                [contenteditable] ol { padding-left: 1.5rem; margin: 0.5rem 0; list-style: decimal; }
                [contenteditable] li { margin-bottom: 0.25rem; }
                [contenteditable] a { color: #4361ee; text-decoration: underline; }
              `}</style>
            </div>
          )}

          {/* SEO TAB — only super_admin */}
          {activeTab === 'seo' && isSuperAdmin && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>🔍 SEO Settings</h3>
              <div className="form-group">
                <label className="form-label">Meta Title <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>(50–60 chars)</span></label>
                <input className="form-input" value={form.meta_title} onChange={e => set('meta_title', e.target.value)} placeholder="Page title for search engines" maxLength={60} />
                <span className="form-hint">{form.meta_title.length}/60</span>
              </div>
              <div className="form-group">
                <label className="form-label">Meta Description <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>(150–160 chars)</span></label>
                <textarea className="form-textarea" value={form.meta_description} onChange={e => set('meta_description', e.target.value)} placeholder="Brief description for search results" maxLength={160} style={{ minHeight: 80 }} />
                <span className="form-hint">{form.meta_description.length}/160</span>
              </div>
              <div className="form-group">
                <label className="form-label">Focus Keyword</label>
                <input className="form-input" value={form.focus_keyword} onChange={e => set('focus_keyword', e.target.value)} placeholder="Main keyword to rank for" />
              </div>
              <div className="form-group">
                <label className="form-label">Canonical URL</label>
                <input className="form-input" value={form.canonical_url} onChange={e => set('canonical_url', e.target.value)} placeholder="https://domain.com/blog/slug (leave empty for auto)" />
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>Open Graph (Social Media)</h4>
                <div className="form-group">
                  <label className="form-label">OG Title</label>
                  <input className="form-input" value={form.og_title} onChange={e => set('og_title', e.target.value)} placeholder="Title shown on social media" />
                </div>
                <div className="form-group">
                  <label className="form-label">OG Description</label>
                  <textarea className="form-textarea" value={form.og_description} onChange={e => set('og_description', e.target.value)} style={{ minHeight: 80 }} />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">OG Image URL</label>
                  <input className="form-input" value={form.og_image} onChange={e => set('og_image', e.target.value)} placeholder="https://... (1200×630px recommended)" />
                </div>
              </div>
              {/* Google Preview */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.75rem' }}>Google Preview</h4>
                <div style={{ border: '1px solid #dfe1e5', borderRadius: 8, padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ color: '#1a0dab', fontSize: '1.0625rem' }}>{form.meta_title || form.title || 'Page Title'}</div>
                  <div style={{ color: '#006621', fontSize: '0.8125rem', margin: '2px 0' }}>https://domain.com/blog/{form.slug || 'your-slug'}</div>
                  <div style={{ color: '#545454', fontSize: '0.875rem' }}>{form.meta_description || 'Your meta description will appear here...'}</div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1.25rem' }}>⚙️ Publishing Settings</h3>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              {form.status === 'scheduled' && (
                <div className="form-group">
                  <label className="form-label">Schedule Date & Time</label>
                  <input type="datetime-local" className="form-input" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} />
                </div>
              )}
              {!isSuperAdmin && (
                <div style={{ padding: '0.875rem', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, marginTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.8125rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lock size={13} /> Meta title, SEO settings and canonical URL can only be managed by a Super Admin.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Details */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>Details</h3>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {form.tags.map((tag: string) => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(67,97,238,0.1)', color: 'var(--primary)', borderRadius: 100, fontSize: '0.8rem', fontWeight: 500 }}>
                    {tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, padding: 0 }}><X size={11} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" value={form.tagInput} onChange={e => set('tagInput', e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type a tag and press Enter" style={{ flex: 1 }} />
                <button onClick={addTag} className="btn btn-secondary btn-sm"><Plus size={14} /></button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>Featured Image</h3>
            {form.featured_image ? (
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <img src={form.featured_image} alt="Featured" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }} />
                <button onClick={() => set('featured_image', '')} style={{ position: 'absolute', top: 6, right: 6, background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 8, cursor: 'pointer', marginBottom: '0.75rem', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                {imageUploading ? <span className="spinner" /> : <ImgIcon size={28} color="var(--ink-muted)" />}
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: '0.5rem' }}>Click to upload image</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>JPG, PNG, WebP (max 10MB)</span>
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </label>
            )}
            <div className="form-group mb-0">
              <label className="form-label">Or paste image URL</label>
              <input className="form-input" value={form.featured_image} onChange={e => set('featured_image', e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group mt-2 mb-0">
              <label className="form-label">Alt Text</label>
              <input className="form-input" value={form.featured_image_alt} onChange={e => set('featured_image_alt', e.target.value)} placeholder="Describe the image for accessibility" />
            </div>
          </div>

          {/* Publish */}
          <div className="card">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '1rem' }}>Publish</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button onClick={() => handleSubmit('draft')} disabled={loading} className="btn btn-secondary" style={{ justifyContent: 'center' }}>
                <Save size={14} /> Save as Draft
              </button>
              <button onClick={() => handleSubmit('published')} disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                {loading ? <Loader size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Globe size={14} />} Publish Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
