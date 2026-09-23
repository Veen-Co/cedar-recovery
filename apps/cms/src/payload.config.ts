import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Posts } from './collections/Posts'
import { Pages } from './collections/Pages'
import { Home } from './globals/Home'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Posts, Pages],
  globals: [Home],
  editor: lexicalEditor(),
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || '',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Cedar Recovery',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    // Written into packages/types so apps/web (Astro) can import these
    // types directly, without depending on the cms app itself.
    outputFile: path.resolve(dirname, '../../../packages/types/src/payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Migration-based, not push — see SETUP.md. Payload warns against
    // mixing the two against the same database.
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      // Neon Object Storage: S3-compatible, but path-style only (not virtual-hosted-style),
      // and the bucket name isn't injected as an env var — it's a literal from `neon buckets list`.
      bucket: 'cedar-bucket',
      config: {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        region: process.env.AWS_REGION,
        endpoint: process.env.AWS_ENDPOINT_URL_S3,
        forcePathStyle: true,
        requestChecksumCalculation: 'WHEN_REQUIRED',
      },
    }),
    seoPlugin({
      collections: ['posts', 'pages'],
      globals: ['home'],
      uploadsCollection: 'media',
      // Merges its own "SEO" tab onto each collection/global's existing
      // first-position tabs field (see the comment atop each one's fields
      // array) rather than wrapping everything in a redundant extra tab.
      tabbedUI: true,
      // Called by the SEO tab's "generate" button — kept generic across
      // Posts, Pages, and Home's differing shapes.
      generateTitle: ({ doc }) => (doc?.title as string) || 'Cedar Recovery Resources',
      generateDescription: ({ doc }) =>
        (doc?.summary as string) || (doc?.hero as { subheading?: string })?.subheading || '',
      generateImage: ({ doc }) => (doc?.hero as { image?: number | { id: number } | null })?.image || '',
    }),
  ],
})
