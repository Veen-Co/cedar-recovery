import { HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

// Restricts body-copy richText fields to h2–h4, so h1 stays exclusive to a
// document's Hero (or, for Posts, its title rendered as <h1>) — guarantees
// exactly one h1 per rendered page rather than leaving it to convention.
export const bodyEditor = () =>
  lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    ],
  })
