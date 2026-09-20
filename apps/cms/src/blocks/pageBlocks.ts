// Shared by Pages' and Home's "Content" tab, so both are composed from the
// same building blocks. Hero is deliberately not here — it's a dedicated
// tab on each (see fields/heroFields.ts), not a block choice, so there's
// always exactly one and it can't end up stacked mid-page. Add a new block
// here (and register a matching Astro component in PageBlockRenderer.astro)
// to extend what a page can be built from.
import { CallToAction } from './CallToAction'
import { Content } from './Content'
import { FAQ } from './FAQ'
import { FeatureGrid } from './FeatureGrid'
import { LatestPosts } from './LatestPosts'
import { ProjectGrid } from './ProjectGrid'
import { Testimonials } from './Testimonials'

export const pageBlocks = [
  Content,
  FeatureGrid,
  CallToAction,
  Testimonials,
  FAQ,
  ProjectGrid,
  LatestPosts,
]
