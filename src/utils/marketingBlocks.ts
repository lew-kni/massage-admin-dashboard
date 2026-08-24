// The marketing email is composed from an ordered list of blocks in the admin.
// Each block renders to email-safe HTML (table layout where needed, inline
// styles only — email clients can't read a stylesheet). The rendered string is
// sent to the backend, which wraps it in the branded marketing shell. The shell
// carries the one media query that lets two-column blocks (class "mk-col")
// stack on narrow screens.

export type Align = 'left' | 'center' | 'right'

export type SocialPlatform = 'instagram' | 'facebook' | 'website' | 'email'

export interface SocialLink {
  platform: SocialPlatform
  url: string
}

// A cell inside a two-column block: a simple content unit, kept deliberately
// small (text or image) so columns don't become arbitrarily nested.
export type ColumnCell =
  | { kind: 'text'; text: string }
  | { kind: 'image'; src: string; alt: string; href: string }
  | { kind: 'empty' }

export type TextCell = Extract<ColumnCell, { kind: 'text' }>
export type ImageCell = Extract<ColumnCell, { kind: 'image' }>

export function makeCell(kind: ColumnCell['kind']): ColumnCell {
  if (kind === 'text') return { kind: 'text', text: '' }
  if (kind === 'image') return { kind: 'image', src: '', alt: '', href: '' }
  return { kind: 'empty' }
}

export type MarketingBlock =
  | { id: string; type: 'heading'; text: string; align: Align }
  | { id: string; type: 'text'; text: string; align: Align }
  | { id: string; type: 'image'; src: string; alt: string; href: string }
  | { id: string; type: 'button'; label: string; href: string; align: Align }
  | { id: string; type: 'offer'; value: string; text: string }
  | { id: string; type: 'quote'; text: string; author: string; align: Align }
  | { id: string; type: 'social'; links: SocialLink[] }
  | { id: string; type: 'columns'; left: ColumnCell; right: ColumnCell }
  | { id: string; type: 'divider' }
  | { id: string; type: 'spacer'; size: 'sm' | 'md' | 'lg' }

export type MarketingBlockType = MarketingBlock['type']

// Per-type aliases, so the block editors can bind to fields without `any`.
export type HeadingBlock = Extract<MarketingBlock, { type: 'heading' }>
export type TextBlock = Extract<MarketingBlock, { type: 'text' }>
export type ImageBlock = Extract<MarketingBlock, { type: 'image' }>
export type ButtonBlock = Extract<MarketingBlock, { type: 'button' }>
export type OfferBlock = Extract<MarketingBlock, { type: 'offer' }>
export type QuoteBlock = Extract<MarketingBlock, { type: 'quote' }>
export type SocialBlock = Extract<MarketingBlock, { type: 'social' }>
export type ColumnsBlock = Extract<MarketingBlock, { type: 'columns' }>
export type SpacerBlock = Extract<MarketingBlock, { type: 'spacer' }>

export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

// A sensible starting block for each palette button.
export function makeBlock(type: MarketingBlockType): MarketingBlock {
  switch (type) {
    case 'heading':
      return { id: uid(), type, text: '', align: 'left' }
    case 'text':
      return { id: uid(), type, text: '', align: 'left' }
    case 'image':
      return { id: uid(), type, src: '', alt: '', href: '' }
    case 'button':
      return { id: uid(), type, label: 'Book a session', href: 'https://www.northpeakmassage.com/booking', align: 'left' }
    case 'offer':
      return { id: uid(), type, value: '', text: '' }
    case 'quote':
      return { id: uid(), type, text: '', author: '', align: 'left' }
    case 'social':
      return { id: uid(), type, links: [{ platform: 'instagram', url: '' }] }
    case 'columns':
      return { id: uid(), type, left: { kind: 'text', text: '' }, right: { kind: 'text', text: '' } }
    case 'divider':
      return { id: uid(), type }
    case 'spacer':
      return { id: uid(), type, size: 'md' }
  }
}

export const BLOCK_LABELS: Record<MarketingBlockType, string> = {
  heading: 'Heading',
  text: 'Text',
  image: 'Image',
  button: 'Button',
  offer: 'Offer',
  quote: 'Quote',
  social: 'Social links',
  columns: 'Two columns',
  divider: 'Divider',
  spacer: 'Spacer',
}

export const BLOCK_ICONS: Record<MarketingBlockType, string> = {
  heading: 'fas fa-heading',
  text: 'fas fa-align-left',
  image: 'fas fa-image',
  button: 'fas fa-hand-pointer',
  offer: 'fas fa-tag',
  quote: 'fas fa-quote-right',
  social: 'fas fa-share-nodes',
  columns: 'fas fa-table-columns',
  divider: 'fas fa-minus',
  spacer: 'fas fa-arrows-up-down',
}

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  website: 'Website',
  email: 'Email',
}

// The order palette buttons appear in.
export const BLOCK_PALETTE: MarketingBlockType[] = [
  'heading', 'text', 'image', 'button', 'offer', 'quote', 'social', 'columns', 'divider', 'spacer',
]

// --- rendering --------------------------------------------------------------

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}
// Only allow safe link schemes; anything else becomes empty so a stray
// javascript: URL never reaches an email.
function safeUrl(url: string): string {
  const u = String(url).trim()
  return /^(https?:\/\/|mailto:)/i.test(u) ? u : ''
}
function textWithBreaks(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

const SPACER_PX = { sm: 8, md: 20, lg: 40 } as const

function imageHtml(src: string, alt: string, href: string): string {
  const safeSrc = safeUrl(src)
  if (!safeSrc) return ''
  const img = `<img src="${escAttr(safeSrc)}" alt="${escAttr(alt)}" style="display:block; width:100%; max-width:100%; height:auto; border:0; border-radius:8px;">`
  const safeHref = safeUrl(href)
  return safeHref ? `<a href="${escAttr(safeHref)}" style="text-decoration:none;">${img}</a>` : img
}

function cellHtml(cell: ColumnCell): string {
  if (cell.kind === 'text') {
    return `<p style="margin:0; font-size:15px; line-height:1.6; color:#202a20;">${textWithBreaks(cell.text)}</p>`
  }
  if (cell.kind === 'image') {
    return imageHtml(cell.src, cell.alt, cell.href)
  }
  return ''
}

export function renderBlockHtml(block: MarketingBlock): string {
  switch (block.type) {
    case 'heading':
      return `<h2 style="margin:0 0 14px; font-size:22px; line-height:1.3; font-weight:700; color:#3b5636; text-align:${block.align};">${textWithBreaks(block.text)}</h2>`
    case 'text':
      return `<p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#202a20; text-align:${block.align};">${textWithBreaks(block.text)}</p>`
    case 'image': {
      const img = imageHtml(block.src, block.alt, block.href)
      return img ? `<div style="margin:0 0 16px;">${img}</div>` : ''
    }
    case 'button': {
      const href = safeUrl(block.href)
      if (!href) return ''
      return (
        `<div style="margin:0 0 16px; text-align:${block.align};">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">` +
        `<tr><td style="border-radius:8px; background:#4f7248;">` +
        `<a href="${escAttr(href)}" style="display:inline-block; padding:12px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none;">${esc(block.label)}</a>` +
        `</td></tr></table></div>`
      )
    }
    case 'offer': {
      if (!block.value && !block.text) return ''
      const valueCell = block.value
        ? `<td style="vertical-align:middle; padding-right:18px; white-space:nowrap;"><div style="font-size:40px; font-weight:800; line-height:1; color:#b23c30;">${textWithBreaks(block.value)}</div></td>`
        : ''
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>` +
        `<td style="background:#f6e3df; border:1px solid #e2a99f; border-radius:12px; padding:20px 24px;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${valueCell}` +
        `<td style="vertical-align:middle;"><div style="font-size:16px; font-weight:600; line-height:1.4; color:#b23c30;">${textWithBreaks(block.text)}</div></td>` +
        `</tr></table>` +
        `</td></tr></table>`
      )
    }
    case 'quote':
      return (
        `<blockquote style="margin:0 0 16px; padding:4px 0 4px 16px; border-left:3px solid #4f7248; text-align:${block.align};">` +
        `<p style="margin:0; font-size:16px; line-height:1.6; font-style:italic; color:#3b5636;">${textWithBreaks(block.text)}</p>` +
        (block.author ? `<p style="margin:6px 0 0; font-size:13px; color:#7a8778;">— ${esc(block.author)}</p>` : '') +
        `</blockquote>`
      )
    case 'social': {
      const items = block.links
        .map((l) => {
          const url = safeUrl(l.url)
          if (!url) return ''
          return `<a href="${escAttr(url)}" style="color:#3b5636; font-weight:600; text-decoration:none; margin:0 8px;">${esc(SOCIAL_LABELS[l.platform] || l.platform)}</a>`
        })
        .filter(Boolean)
      if (!items.length) return ''
      return `<div style="margin:0 0 16px; text-align:center; font-size:14px;">${items.join('<span style="color:#c7d2c0;">·</span>')}</div>`
    }
    case 'columns':
      return (
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>` +
        `<td class="mk-col" width="50%" style="width:50%; vertical-align:top; padding:0 8px 0 0;">${cellHtml(block.left)}</td>` +
        `<td class="mk-col" width="50%" style="width:50%; vertical-align:top; padding:0 0 0 8px;">${cellHtml(block.right)}</td>` +
        `</tr></table>`
      )
    case 'divider':
      return `<hr style="border:none; border-top:1px solid #e0e6da; margin:20px 0;">`
    case 'spacer':
      return `<div style="height:${SPACER_PX[block.size]}px; line-height:${SPACER_PX[block.size]}px; font-size:0;">&nbsp;</div>`
  }
}

export function renderBlocksHtml(blocks: MarketingBlock[]): string {
  return blocks.map(renderBlockHtml).join('\n')
}
