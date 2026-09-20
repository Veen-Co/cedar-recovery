import type { Field } from 'payload'

// Used as a dedicated "Hero" tab on every content type (Posts, Pages,
// Home), alongside that type's `title` — guarantees exactly one hero,
// always in the same place, and it can never end up stacked mid-page.
//
// `heading` is optional (not required): `title` already lives in the same
// tab and is required, so a document without its own hero copy can just
// fall back to displaying `title` — the frontend decides that fallback,
// not this schema.
export const heroFields: Field[] = [
  {
    name: 'variant',
    type: 'select',
    defaultValue: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Minimal (no image)', value: 'minimal' },
      { label: 'Image-forward', value: 'imageForward' },
    ],
    admin: {
      description:
        'Which hero layout to render. Whether an image is required/optional/unused is a decision each variant makes on the frontend, not enforced here.',
    },
  },
  { name: 'heading', type: 'text' },
  { name: 'subheading', type: 'textarea' },
  { name: 'image', type: 'upload', relationTo: 'media' },
  {
    name: 'cta',
    type: 'group',
    fields: [
      { name: 'label', type: 'text' },
      { name: 'url', type: 'text' },
    ],
  },
]
