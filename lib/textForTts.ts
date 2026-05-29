/**
 * Strip markdown, code, emojis and special symbols so the TTS engine only reads
 * natural language. The model often emits **bold**, `code`, lists with `-` or
 * `*`, headers `#`, emojis, etc. that sound bad spoken out loud.
 */
export function textForTts(input: string): string {
  if (!input) return ''

  let out = input

  // Code blocks (```...```) and inline code (`...`) — drop content entirely for speech
  out = out.replace(/```[\s\S]*?```/g, ' ')
  out = out.replace(/`([^`]+)`/g, '$1')

  // Bold/italic markers (** __ * _) — strip but keep content
  out = out.replace(/\*\*(.+?)\*\*/g, '$1')
  out = out.replace(/__(.+?)__/g, '$1')
  out = out.replace(/\*(.+?)\*/g, '$1')
  out = out.replace(/_(.+?)_/g, '$1')

  // Headings (lines starting with #)
  out = out.replace(/^#{1,6}\s+/gm, '')

  // Strikethrough
  out = out.replace(/~~(.+?)~~/g, '$1')

  // Markdown links [text](url) -> text
  out = out.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Bare URLs (https://...) — read as "enlace"
  out = out.replace(/https?:\/\/\S+/g, 'enlace')

  // List bullets at start of line: -, *, +
  out = out.replace(/^\s*[-*+]\s+/gm, '')

  // Ordered list "1. ", "2. " — keep number but remove dot for cleaner speech
  out = out.replace(/^\s*(\d+)\.\s+/gm, '$1, ')

  // Blockquotes
  out = out.replace(/^>\s*/gm, '')

  // Tables: pipes and separators
  out = out.replace(/\|/g, ' ')
  out = out.replace(/^\s*-{2,}.*$/gm, '')

  // Emojis (rough range: misc symbols + pictographs + transport + flags)
  out = out.replace(
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1FA00}-\u{1FAFF}]/gu,
    ''
  )

  // Stray symbols that aren't part of words
  out = out.replace(/[*_~`#]/g, '')

  // Collapse repeated whitespace
  out = out.replace(/\s{2,}/g, ' ')
  out = out.replace(/\n{2,}/g, '. ')
  out = out.replace(/\n/g, '. ')

  return out.trim()
}
