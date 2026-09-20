import type { Block } from 'payload'

export const LatestPosts: Block = {
  slug: 'latestPosts',
  labels: {
    singular: 'Latest Posts',
    plural: 'Latest Posts',
  },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'limit', type: 'number', defaultValue: 3, min: 1, max: 12 },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Optional — leave empty to show latest posts across all categories.',
      },
    },
  ],
}
