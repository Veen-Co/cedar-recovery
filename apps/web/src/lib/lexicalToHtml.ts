// Payload stores `richText` fields as Lexical's serialized editor state (a
// JSON tree), not HTML. This walks that tree and produces plain HTML,
// covering the node types Payload's default editor produces. Add a `case`
// here when a new node type (e.g. from an added Lexical feature) shows up
// unstyled.

interface LexicalNode {
  type: string
  children?: LexicalNode[]
  text?: string
  // `format` means different things on different node kinds: a numeric
  // bitmask on text nodes (bold/italic/etc.), a string alignment keyword
  // ('left' | 'center' | ...) on block nodes like root/paragraph.
  format?: number | string
  tag?: string
  listType?: string
  fields?: { url?: string; newTab?: boolean }
}

export interface SerializedLexicalState {
  root: LexicalNode
}

const FORMAT_BOLD = 1
const FORMAT_ITALIC = 2
const FORMAT_STRIKETHROUGH = 4
const FORMAT_UNDERLINE = 8
const FORMAT_CODE = 16
const FORMAT_SUBSCRIPT = 32
const FORMAT_SUPERSCRIPT = 64

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderText(node: LexicalNode): string {
  let html = escapeHtml(node.text ?? '')
  const format = typeof node.format === 'number' ? node.format : 0
  if (format & FORMAT_CODE) html = `<code>${html}</code>`
  if (format & FORMAT_BOLD) html = `<strong>${html}</strong>`
  if (format & FORMAT_ITALIC) html = `<em>${html}</em>`
  if (format & FORMAT_STRIKETHROUGH) html = `<s>${html}</s>`
  if (format & FORMAT_UNDERLINE) html = `<u>${html}</u>`
  if (format & FORMAT_SUBSCRIPT) html = `<sub>${html}</sub>`
  if (format & FORMAT_SUPERSCRIPT) html = `<sup>${html}</sup>`
  return html
}

function renderChildren(node: LexicalNode): string {
  return (node.children ?? []).map(renderNode).join('')
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case 'text':
      return renderText(node)
    case 'linebreak':
      return '<br />'
    case 'paragraph':
      return `<p>${renderChildren(node)}</p>`
    case 'heading': {
      const tag = node.tag || 'h2'
      return `<${tag}>${renderChildren(node)}</${tag}>`
    }
    case 'quote':
      return `<blockquote>${renderChildren(node)}</blockquote>`
    case 'list': {
      const tag = node.tag === 'ol' || node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${renderChildren(node)}</${tag}>`
    }
    case 'listitem':
      return `<li>${renderChildren(node)}</li>`
    case 'link': {
      const url = node.fields?.url ?? '#'
      const target = node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHtml(url)}"${target}>${renderChildren(node)}</a>`
    }
    default:
      // Unknown node type (e.g. a custom block embedded in the text) —
      // render its children so content isn't silently dropped, without
      // guessing at markup for a type we don't recognize yet.
      return renderChildren(node)
  }
}

export function lexicalToHtml(data: SerializedLexicalState): string {
  return renderChildren(data.root)
}
