import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { triggerDeployAfterDelete, triggerDeployAlways } from '../hooks/triggerDeploy'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  hooks: {
    // No drafts on Categories — every save is already live.
    afterChange: [triggerDeployAlways],
    afterDelete: [triggerDeployAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ useAsSlug: 'name' }),
    { name: 'description', type: 'textarea' },
  ],
}
