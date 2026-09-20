import type { Block } from 'payload'

export const Callout: Block = {
  slug: 'callout',
  labels: {
    singular: 'Callout',
    plural: 'Callouts',
  },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'text', type: 'textarea', required: true },
  ],
}
