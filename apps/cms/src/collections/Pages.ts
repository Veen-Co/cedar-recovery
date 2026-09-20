import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { pageBlocks } from '../blocks/pageBlocks'
import { heroFields } from '../fields/heroFields'
import { triggerDeployAfterDelete, triggerDeployOnPublish } from '../hooks/triggerDeploy'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status'],
  },
  access: {
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
    // This tabs field must stay the first entry in `fields` — the SEO
    // plugin (tabbedUI: true, see payload.config.ts) detects an existing
    // first-position tabs field and merges its own "SEO" tab onto it,
    // rather than wrapping everything in a redundant extra tab layer.
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
          fields: [{ name: 'layout', type: 'blocks', blocks: pageBlocks }],
        },
      ],
    },
  ],
}
