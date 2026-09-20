import type { Block } from 'payload'

export const ProjectGrid: Block = {
  slug: 'projectGrid',
  labels: {
    singular: 'Project Grid',
    plural: 'Project Grids',
  },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'projects',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'link', type: 'text' },
      ],
    },
  ],
}
