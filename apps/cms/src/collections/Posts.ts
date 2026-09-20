import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { Callout } from '../blocks/Callout'
import { bodyEditor } from '../fields/bodyEditor'
import { heroFields } from '../fields/heroFields'
import { triggerDeployAfterDelete, triggerDeployOnPublish } from '../hooks/triggerDeploy'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categories', 'publishedDate', '_status'],
  },
  access: {
    // Anonymous requests only ever see published posts, even if they
    // explicitly ask for drafts (e.g. `?draft=true`). Logged-in admin
    // users (editing in /admin) can see everything.
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },
  },
  hooks: {
    afterChange: [triggerDeployOnPublish],
    afterDelete: [triggerDeployAfterDelete],
  },
  versions: {
    drafts: true,
  },
  fields: [
    // Must stay the first entry — the SEO plugin (tabbedUI: true) merges
    // its own "SEO" tab onto an existing first-position tabs field.
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            { name: 'title', type: 'text', required: true },
            slugField({ useAsSlug: 'title' }),
            { name: 'hero', type: 'group', fields: heroFields },
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
            },
            {
              name: 'publishedDate',
              type: 'date',
              admin: { position: 'sidebar' },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              admin: {
                description:
                  'Shown on post cards. For link-only posts (no body below), this is the entire visible content alongside the external link.',
              },
            },
            {
              name: 'body',
              type: 'richText',
              editor: bodyEditor(),
              admin: {
                description: 'Leave empty for a link-only post.',
              },
            },
            {
              name: 'externalLink',
              type: 'group',
              admin: {
                description:
                  'Set this to make the post a link-out to an external resource (e.g. a PDF).',
              },
              fields: [
                { name: 'url', type: 'text' },
                { name: 'label', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Sidebar',
          fields: [
            {
              name: 'sidebar',
              type: 'blocks',
              blocks: [Callout],
              admin: {
                description: 'Extensible sidebar content — add new block types here over time.',
              },
            },
          ],
        },
      ],
    },
  ],
}
