import slugify from 'slugify'
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function generateSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true })
}

export function generateExcerpt(content: string, length = 160): string {
  const stripped = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return stripped.length > length ? stripped.slice(0, length) + '...' : stripped
}

export function generateArticleSchema(blog: any, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.meta_description || generateExcerpt(blog.content || '', 160),
    image: blog.og_image || blog.featured_image,
    author: { '@type': 'Person', name: blog.author_name || 'Admin' },
    publisher: {
      '@type': 'Organization',
      name: 'Blog CMS',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
    },
    datePublished: blog.published_at,
    dateModified: blog.updated_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/blog/${blog.slug}` },
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function generateOrganizationSchema(siteName: string, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
  }
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function paginateArray<T>(arr: T[], page: number, perPage: number) {
  const total = arr.length
  const start = (page - 1) * perPage
  const data = arr.slice(start, start + perPage)
  return { data, total, page, perPage, totalPages: Math.ceil(total / perPage) }
}

export function buildCanonicalUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export function generateSitemapXML(urls: { loc: string; lastmod?: string; priority?: string; changefreq?: string }[]) {
  const entries = urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${u.priority ? `<priority>${u.priority}</priority>` : ''}
  </url>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}
