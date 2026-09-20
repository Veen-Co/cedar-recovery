import type { GlobalConfig } from 'payload'
import { pageBlocks } from '../blocks/pageBlocks'
import { heroFields } from '../fields/heroFields'
import { triggerDeployGlobalOnPublish } from '../hooks/triggerDeploy'

export const Home: GlobalConfig = {
  slug: 'home',
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },
  },
  hooks: {
    afterChange: [triggerDeployGlobalOnPublish],
  },
  versions: {
    drafts: true,
  },
  fields: [
    // Must stay the first entry — see the comment in collections/Pages.ts.
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [{ name: 'hero', type: 'group', fields: heroFields }],
        },
        {
          label: 'Content',
          fields: [{ name: 'layout', type: 'blocks', blocks: pageBlocks }],
        },
      ],
    },
  ],
}
