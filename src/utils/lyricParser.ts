/**
 * Smart Lyric Parser & Slide Formatter for Church & Live Broadcast Presentations
 */

export interface ParsedSongSlides {
  title: string;
  artist: string;
  slides: string[];
  rawCleaned: string;
}

export type LyricSplitMode = 'lines' | 'smart' | 'smart2' | 'smart3' | 'stanzas';

/**
 * Check if a line is a section header (e.g. [Verse 1], Chorus:, (Bridge), [Tag])
 */
export function isSectionTagLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  const sectionPattern = /^(Verse\s*\d*|Chorus\s*\d*|Bridge\s*\d*|Pre-Chorus\s*\d*|Tag\s*\d*|Outro|Intro|Ending|Refrain|Interlude|Hook|Vamp|Channel|Instrumental|Solo|Coda|V\d+|C\d+|B\d+)$/i;
  const stripped = trimmed.replace(/^[\[\(\{]+|[\]\)\}:]+$/g, '').trim();
  if (sectionPattern.test(stripped)) return true;
  if (/^\[.+\]$/.test(trimmed) && sectionPattern.test(stripped.split(/[-–—:]/)[0].trim())) {
    return true;
  }
  return false;
}

/**
 * Format raw or previously formatted lyrics into slides separated by blank lines (\n\n).
 * Robust against repeated re-formatting between 1 Line, Smart 2, Smart 3, and Stanzas.
 */
export function formatLyricsText(
  text: string,
  mode: 'lines' | 'smart' | 'smart2' | 'smart3' | 'stanzas' = 'smart'
): string {
  if (!text || !text.trim()) return '';

  // 1. Clean LRC tags, chords, and metadata headers
  let cleaned = text.replace(/\[\d+:\d+(?:\.\d+)?\]\s*/g, '');
  cleaned = cleaned.replace(/\[[A-G][b#]?(?:m|maj|min|dim|aug|sus)?[0-9]?(?:\/[A-G][b#]?)?\]/g, '');
  cleaned = cleaned.replace(/^\[[a-z]+:.*?\]$/gim, '');
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  const linesPerSlide = mode === 'lines' ? 1 : mode === 'smart3' ? 3 : 2;

  // Check if text has section tags like [Verse 1], [Chorus], etc.
  const hasSectionTags = cleaned.split('\n').some(isSectionTagLine);

  if (hasSectionTags) {
    const allLines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
    interface Section {
      tag: string | null;
      lines: string[];
    }
    const sections: Section[] = [];
    let currentSection: Section = { tag: null, lines: [] };

    for (const line of allLines) {
      if (isSectionTagLine(line)) {
        if (currentSection.tag !== null || currentSection.lines.length > 0) {
          sections.push(currentSection);
        }
        const stripped = line.replace(/^[\[\(\{]+|[\]\)\}:]+$/g, '').trim();
        const normalizedTag = `[${stripped}]`;
        currentSection = { tag: normalizedTag, lines: [] };
      } else {
        currentSection.lines.push(line);
      }
    }
    if (currentSection.tag !== null || currentSection.lines.length > 0) {
      sections.push(currentSection);
    }

    const slides: string[] = [];

    for (const sec of sections) {
      if (sec.lines.length === 0) {
        if (sec.tag) slides.push(sec.tag);
        continue;
      }

      if (mode === 'stanzas') {
        const slideText = sec.tag ? `${sec.tag}\n${sec.lines.join('\n')}` : sec.lines.join('\n');
        slides.push(slideText);
      } else {
        for (let i = 0; i < sec.lines.length; i += linesPerSlide) {
          const chunk = sec.lines.slice(i, i + linesPerSlide);
          if (i === 0 && sec.tag) {
            slides.push(`${sec.tag}\n${chunk.join('\n')}`);
          } else {
            slides.push(chunk.join('\n'));
          }
        }
      }
    }

    return slides.join('\n\n');
  }

  // No section tags:
  const rawParagraphs = cleaned.split(/\n\s*\n+/);
  const paragraphLengths = rawParagraphs.map((p) => p.split('\n').filter(Boolean).length);
  // Check if current text was previously chunked by 1, 2, or 3 lines
  const isUniformChunked =
    paragraphLengths.length > 1 &&
    paragraphLengths.every((len) => len <= 3);

  // If mode is stanzas and text has natural un-chunked paragraphs, preserve them
  if (mode === 'stanzas' && !isUniformChunked && rawParagraphs.length > 1) {
    return rawParagraphs
      .map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean).join('\n'))
      .filter(Boolean)
      .join('\n\n');
  }

  // Chunk all lyric lines according to selected mode
  const allLines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
  const effectiveLinesPerSlide = mode === 'stanzas' ? 4 : linesPerSlide;
  const slides: string[] = [];

  for (let i = 0; i < allLines.length; i += effectiveLinesPerSlide) {
    slides.push(allLines.slice(i, i + effectiveLinesPerSlide).join('\n'));
  }

  return slides.join('\n\n');
}

/**
 * Parse lyrics into an array of slide strings for display and presentation.
 */
export function parseLyricsToSlides(
  rawLyrics: string,
  splitMode: 'stanzas' | 'lines' | 'smart' | 'smart2' | 'smart3' = 'smart'
): string[] {
  if (!rawLyrics || !rawLyrics.trim()) return ['(No lyrics available)'];

  const formatted = formatLyricsText(rawLyrics, splitMode);
  const slides = formatted
    .split(/\n\s*\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return slides.length > 0 ? slides : [rawLyrics.trim()];
}
