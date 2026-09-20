import type { Block } from 'payload'
import { bodyEditor } from '../fields/bodyEditor'

export const Content: Block = {
  slug: 'content',
  labels: {
    singular: 'Content',
    plural: 'Content Blocks',
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'size',
          type: 'select',
          defaultValue: 'oneThird',
          options: [
            { label: 'One Third', value: 'oneThird' },
            { label: 'Half', value: 'half' },
            { label: 'Two Thirds', value: 'twoThirds' },
            { label: 'Full', value: 'full' },
          ],
        },
        { name: 'richText', type: 'richText', label: false, editor: bodyEditor() },
        { name: 'enableLink', type: 'checkbox' },
        {
          name: 'link',
          type: 'group',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enableLink),
          },
          fields: [
            { name: 'label', type: 'text' },
            { name: 'url', type: 'text' },
          ],
        },
      ],
    },
  ],
}
