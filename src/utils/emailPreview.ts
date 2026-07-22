// Template bodies are stored as HTML — flatten to plain text for editing in a textarea.
export function htmlToText(html: string) {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Plain text back to simple paragraph HTML for the sent/stored email.
export function textToHtml(text: string) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

// For the live preview only — fills any {{ variable }} placeholder with a
// bracketed sample value so the preview reads naturally without needing a
// real client/booking in context. Real sends resolve these against actual data.
const SAMPLE_VALUES: Record<string, string> = {
  firstName: 'Jamie',
  lastName: 'Smith',
  date: 'Thursday, 14 August 2026',
  time: '2:30 pm',
  location: 'New Mills',
}

export function fillPreviewVars(text: string) {
  return text.replace(/{{\s*(\w+)\s*}}/g, (_match, key) => SAMPLE_VALUES[key] || `[${key}]`)
}
