import type { Category, Home, Page, Post } from 'types'

const PAYLOAD_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000'

interface PayloadListResponse<T> {
  docs: T[]
}

async function payloadFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${PAYLOAD_URL}/api${path}`)
  if (!res.ok) {
    throw new Error(`Payload request failed (${res.status}): ${path}`)
  }
  return res.json()
}

export async function getPosts(options: { categoryId?: number; limit?: number } = {}): Promise<Post[]> {
  const { categoryId, limit = 100 } = options
  const where = categoryId ? `&where[categories][in]=${categoryId}` : ''
  const { docs } = await payloadFetch<PayloadListResponse<Post>>(
    `/posts?sort=-publishedDate&depth=2&limit=${limit}${where}`,
  )
  return docs
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { docs } = await payloadFetch<PayloadListResponse<Post>>(
    `/posts?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1`,
  )
  return docs[0] ?? null
}

// Posts sharing a category with `post`, excluding itself. Falls back to the
// latest other posts when there's no category overlap (or `post` has no
// categories at all), so the "You May Also Like" sidebar section isn't just
// empty on a lightly-categorized site.
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const categoryIds = (post.categories ?? [])
    .map((category) => (typeof category === 'object' ? category.id : category))
    .filter((id): id is number => typeof id === 'number')

  if (categoryIds.length > 0) {
    const { docs } = await payloadFetch<PayloadListResponse<Post>>(
      `/posts?sort=-publishedDate&depth=2&limit=${limit}&where[categories][in]=${categoryIds.join(',')}&where[id][not_equals]=${post.id}`,
    )
    if (docs.length > 0) return docs
  }

  const { docs } = await payloadFetch<PayloadListResponse<Post>>(
    `/posts?sort=-publishedDate&depth=2&limit=${limit}&where[id][not_equals]=${post.id}`,
  )
  return docs
}

export async function getCategories(): Promise<Category[]> {
  const { docs } = await payloadFetch<PayloadListResponse<Category>>(
    '/categories?depth=0&limit=100',
  )
  return docs
}

export async function getPages(): Promise<Page[]> {
  const { docs } = await payloadFetch<PayloadListResponse<Page>>('/pages?depth=2&limit=100')
  return docs
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const { docs } = await payloadFetch<PayloadListResponse<Page>>(
    `/pages?where[slug][equals]=${encodeURIComponent(slug)}&depth=2&limit=1`,
  )
  return docs[0] ?? null
}

export async function getHome(): Promise<Home> {
  return payloadFetch<Home>('/globals/home?depth=2')
}

// Payload's Media.url is relative (e.g. "/api/media/file/x.jpg") — meant to
// be resolved against the CMS's own origin, not the Astro site's. Every
// place rendering a Media object's url must go through this.
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  return url.startsWith('/') ? `${PAYLOAD_URL}${url}` : url
}
