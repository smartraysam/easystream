import { SlidePayload, MediaType, PresentationDocType, LibraryItem } from "../types";

export const SLIDE_PAYLOAD_PREFIX = "__EASY_SLIDE__:";

export function encodeSlidePayload(payload: SlidePayload): string {
  return `${SLIDE_PAYLOAD_PREFIX}${JSON.stringify(payload)}`;
}

export function parseSlidePayload(line: string | undefined | null): SlidePayload | null {
  if (!line || typeof line !== "string") return null;
  const trimmed = line.trim();
  if (!trimmed.startsWith(SLIDE_PAYLOAD_PREFIX)) return null;
  try {
    const jsonStr = trimmed.slice(SLIDE_PAYLOAD_PREFIX.length);
    const parsed = JSON.parse(jsonStr);
    if (parsed && (parsed.kind === "media" || parsed.kind === "presentation")) {
      return parsed as SlidePayload;
    }
  } catch {
    // Not valid JSON
  }
  return null;
}

/**
 * Convert any slide line (including __EASY_SLIDE__ payloads) into clean human-readable text
 * for StageView, search snippets, or text editors.
 */
export function getSlideReadableText(line: string | undefined | null): string {
  if (!line) return "";
  const payload = parseSlidePayload(line);
  if (!payload) return line;

  if (payload.kind === "media") {
    const badge = payload.mediaType === "video" ? "🎬 VIDEO" : "🖼️ IMAGE";
    return `${badge}: ${payload.heading || "Media Projection"}`;
  }

  if (payload.kind === "presentation") {
    const unit = payload.docType === "pptx" ? "Slide" : "Page";
    const numStr = payload.pageNumber
      ? `[${unit} ${payload.pageNumber}${payload.totalPages ? ` of ${payload.totalPages}` : ""}] `
      : "";
    const header = payload.heading ? `${numStr}${payload.heading}` : numStr.trim();
    const body =
      payload.bullets && payload.bullets.length > 0
        ? payload.bullets.map((b) => (b.startsWith("•") ? b : `• ${b}`)).join("\n")
        : payload.body || "";
    const combined = [header, body].filter(Boolean).join("\n\n");
    return combined || `${unit} ${payload.pageNumber || 1}`;
  }

  return line;
}

/**
 * Short one-line summary for DisplayView's bottom "NEXT:" preview pill
 */
export function getSlideNextSummary(line: string | undefined | null): string {
  if (!line) return "";
  const payload = parseSlidePayload(line);
  if (!payload) return line.replace(/\n+/g, " ").trim();

  if (payload.kind === "media") {
    const label = payload.mediaType === "video" ? "Video" : "Image";
    return `[${label}] ${payload.heading || "Media"}`;
  }

  if (payload.kind === "presentation") {
    const unit = payload.docType === "pptx" ? "Slide" : "Page";
    const pagePart = payload.pageNumber ? `${unit} ${payload.pageNumber}` : unit;
    const titlePart = payload.heading || "";
    const snippetPart = (payload.body || "")
      .replace(/\n+/g, " ")
      .trim()
      .slice(0, 70);
    if (titlePart && snippetPart && !snippetPart.startsWith(titlePart)) {
      return `${pagePart}: ${titlePart} — ${snippetPart}`;
    }
    return `${pagePart}${titlePart ? `: ${titlePart}` : ""}${snippetPart ? ` — ${snippetPart}` : ""}`;
  }

  return line.replace(/\n+/g, " ").trim();
}

/**
 * Re-paginate Word (.docx/.doc) presentation slides based on user's chosen split density:
 * - 'standard': ~100 words or 5 paragraphs per page
 * - 'compact': ~45 words or 2 paragraphs per page (larger text on projector)
 * - 'headings': 1 section/heading per page
 * - 'paragraphs': 1 paragraph per page
 */
export function repaginateWordSlides(
  rawParagraphs: string[],
  docTitle: string,
  mode: "standard" | "compact" | "headings" | "paragraphs",
  firstImageUrl?: string
): SlidePayload[] {
  const cleanParas = rawParagraphs.map((p) => p.trim()).filter(Boolean);
  if (cleanParas.length === 0) {
    return [
      {
        kind: "presentation",
        docType: "docx",
        pageNumber: 1,
        totalPages: 1,
        heading: `${docTitle} — Page 1`,
        body: docTitle,
        imageUrl: firstImageUrl,
      },
    ];
  }

  const pages: { heading: string; paras: string[] }[] = [];

  if (mode === "paragraphs") {
    for (let i = 0; i < cleanParas.length; i++) {
      pages.push({
        heading: `${docTitle} — Page ${i + 1}`,
        paras: [cleanParas[i]],
      });
    }
  } else if (mode === "headings") {
    let curHeading = "";
    let curList: string[] = [];
    for (const p of cleanParas) {
      const looksLikeHeading =
        p.length <= 70 &&
        !p.endsWith(".") &&
        !p.startsWith("•") &&
        (curList.length > 0 || !curHeading);
      if (looksLikeHeading && curList.length > 0) {
        pages.push({
          heading: curHeading || `${docTitle} — Page ${pages.length + 1}`,
          paras: curList,
        });
        curHeading = p;
        curList = [];
      } else if (!curHeading && p.length <= 70 && !p.endsWith(".")) {
        curHeading = p;
      } else {
        curList.push(p);
      }
    }
    if (curHeading || curList.length > 0) {
      pages.push({
        heading: curHeading || `${docTitle} — Page ${pages.length + 1}`,
        paras: curList,
      });
    }
  } else {
    const maxWords = mode === "compact" ? 45 : 105;
    const maxParas = mode === "compact" ? 2 : 5;
    let curHeading = "";
    let curList: string[] = [];
    let curWords = 0;

    for (const p of cleanParas) {
      const wCount = p.split(/\s+/).filter(Boolean).length;
      const isShortTitle = p.length <= 65 && !p.endsWith(".") && !p.startsWith("•");

      if (isShortTitle && curList.length === 0 && !curHeading) {
        curHeading = p;
        continue;
      }

      if (
        curList.length > 0 &&
        (curWords + wCount > maxWords || curList.length >= maxParas)
      ) {
        pages.push({
          heading: curHeading || `${docTitle} — Page ${pages.length + 1}`,
          paras: curList,
        });
        curHeading = isShortTitle ? p : "";
        curList = isShortTitle ? [] : [p];
        curWords = isShortTitle ? 0 : wCount;
      } else {
        curList.push(p);
        curWords += wCount;
      }
    }
    if (curHeading || curList.length > 0) {
      pages.push({
        heading: curHeading || `${docTitle} — Page ${pages.length + 1}`,
        paras: curList,
      });
    }
  }

  return pages.map((pg, idx) => ({
    kind: "presentation",
    docType: "docx",
    pageNumber: idx + 1,
    totalPages: pages.length,
    heading: pg.heading || `${docTitle} — Page ${idx + 1}`,
    body: pg.paras.join("\n\n"),
    bullets: pg.paras,
    imageUrl: idx === 0 ? firstImageUrl : undefined,
  }));
}

/**
 * Browser fallback ZIP reader using DecompressionStream('deflate-raw')
 * in case the backend endpoint is unavailable.
 */
async function readZipEntriesBrowser(arrayBuffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const entries = new Map<string, Uint8Array>();
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes.length < 22) return entries;

  let eocdOffset = -1;
  const maxComment = Math.min(bytes.length - 22, 65535);
  for (let i = bytes.length - 22; i >= bytes.length - 22 - maxComment && i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) return entries;

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder("utf-8");

  let ptr = cdOffset;
  for (let i = 0; i < totalEntries && ptr + 46 <= bytes.length; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const fileName = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + fileNameLen));
    ptr += 46 + fileNameLen + extraLen + commentLen;

    if (fileName.endsWith("/") || localHeaderOffset + 30 > bytes.length) continue;
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) continue;

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > bytes.length) continue;

    const rawSlice = bytes.subarray(dataStart, dataEnd);
    try {
      if (compressionMethod === 0) {
        entries.set(fileName, rawSlice);
      } else if (compressionMethod === 8 && typeof DecompressionStream !== "undefined") {
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        writer.write(rawSlice);
        writer.close();
        const resp = new Response(ds.readable);
        const ab = await resp.arrayBuffer();
        entries.set(fileName, new Uint8Array(ab));
      }
    } catch {
      // Ignore individual entry decompression failure
    }
  }

  return entries;
}

/**
 * Upload an Image or Video file to the backend (with client DataURL/ObjectURL fallback)
 * and return a ready-to-save LibraryItem.
 */
export async function importMediaFileToLibraryItem(file: File): Promise<LibraryItem> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isVideo =
    file.type.startsWith("video/") ||
    /^(mp4|webm|mov|m4v|ogg|avi|mkv)$/i.test(ext);
  const mediaType: MediaType = isVideo ? "video" : "image";
  const cleanTitle = file.name.replace(/\.[^.]+$/, "");

  let mediaUrl = "";
  try {
    const apiBase = import.meta.env.VITE_API_URL || "";
    const res = await fetch(
      `${apiBase}/api/media/upload?filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        mediaUrl = data.url;
      }
    }
  } catch {
    // Fallback below
  }

  if (!mediaUrl) {
    // Fallback to Data URL for images under 4MB, or Object URL for videos/large files
    if (!isVideo && file.size < 4 * 1024 * 1024) {
      mediaUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve(URL.createObjectURL(file));
        reader.readAsDataURL(file);
      });
    } else {
      mediaUrl = URL.createObjectURL(file);
    }
  }

  const payload: SlidePayload = {
    kind: "media",
    mediaType,
    mediaUrl,
    heading: cleanTitle,
    fitMode: isVideo ? "cover" : "contain",
    loop: true,
    muted: false,
  };

  const encoded = encodeSlidePayload(payload);
  return {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle,
    category: "media",
    author: isVideo ? "Video Media" : "Image Media",
    content: encoded,
    lines: [encoded],
    mediaType,
    mediaUrl,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Upload a Presentation file (.pptx, .ppt, .docx, .doc, .pdf) to the backend
 * (with browser-side fallback parsing) and return a ready-to-save LibraryItem
 * with individual navigable Slides or Pages.
 */
export async function importPresentationFileToLibraryItem(file: File): Promise<LibraryItem> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const cleanTitle = file.name.replace(/\.[^.]+$/, "");
  const docType: PresentationDocType =
    ext === "pdf" ? "pdf" : ext.startsWith("doc") ? "docx" : "pptx";

  let slides: SlidePayload[] = [];
  let fileUrl = "";

  // 1. Try server upload + parser first
  try {
    const apiBase = import.meta.env.VITE_API_URL || "";
    const res = await fetch(
      `${apiBase}/api/presentations/upload?filename=${encodeURIComponent(file.name)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.slides) && data.slides.length > 0) {
        slides = data.slides;
        fileUrl = data.url || "";
      }
    }
  } catch {
    // Fallback to client-side parsing below
  }

  // 2. Client-side fallback if server was unreachable
  if (slides.length === 0) {
    const ab = await file.arrayBuffer();
    const decoder = new TextDecoder("utf-8");

    if (ext === "pptx") {
      const entries = await readZipEntriesBrowser(ab);
      const slideKeys = Array.from(entries.keys())
        .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
        .sort((a, b) => {
          const nA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
          const nB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
          return nA - nB;
        });

      slides = slideKeys.map((key, idx) => {
        const xml = decoder.decode(entries.get(key));
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        const pNodes = Array.from(doc.getElementsByTagNameNS("*", "p"));
        const lines: string[] = [];
        for (const pNode of pNodes) {
          const tNodes = Array.from(pNode.getElementsByTagNameNS("*", "t"));
          const line = tNodes.map((t) => t.textContent || "").join("").trim();
          if (line) lines.push(line);
        }
        const heading = lines[0] || `${cleanTitle} — Slide ${idx + 1}`;
        const bullets = lines.length > 1 ? lines.slice(1) : [];
        return {
          kind: "presentation",
          docType: "pptx",
          pageNumber: idx + 1,
          totalPages: slideKeys.length,
          heading,
          body: bullets.join("\n"),
          bullets,
        };
      });
    } else if (ext === "docx") {
      const entries = await readZipEntriesBrowser(ab);
      const docBytes = entries.get("word/document.xml");
      if (docBytes) {
        const xml = decoder.decode(docBytes);
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        const pNodes = Array.from(doc.getElementsByTagNameNS("*", "p"));
        const paras: string[] = [];
        for (const pNode of pNodes) {
          const tNodes = Array.from(pNode.getElementsByTagNameNS("*", "t"));
          const line = tNodes.map((t) => t.textContent || "").join("").trim();
          if (line) paras.push(line);
        }
        slides = repaginateWordSlides(paras, cleanTitle, "standard");
      }
    } else if (ext === "pdf") {
      fileUrl = URL.createObjectURL(file);
      const rawLatin = new TextDecoder("latin1").decode(new Uint8Array(ab));
      const pageMatches = rawLatin.match(/\/Type\s*\/Page\b(?!s)/g);
      const pageCount = Math.max(1, pageMatches ? pageMatches.length : 1);
      for (let p = 1; p <= pageCount; p++) {
        slides.push({
          kind: "presentation",
          docType: "pdf",
          pageNumber: p,
          totalPages: pageCount,
          heading: `${cleanTitle} — Page ${p}`,
          body: "",
          pdfUrl: fileUrl,
        });
      }
    }
  }

  if (slides.length === 0) {
    slides = [
      {
        kind: "presentation",
        docType,
        pageNumber: 1,
        totalPages: 1,
        heading: `${cleanTitle} — ${docType === "pptx" ? "Slide" : "Page"} 1`,
        body: cleanTitle,
      },
    ];
  }

  const encodedLines = slides.map((s) => encodeSlidePayload(s));
  const unitLabel = docType === "pptx" ? "PowerPoint" : docType === "pdf" ? "PDF Document" : "Word Document";

  return {
    id: `pres-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: cleanTitle,
    category: "presentation",
    author: `${unitLabel} (${slides.length} ${docType === "pptx" ? "Slides" : "Pages"})`,
    content: slides
      .map((s) => `${s.heading || ""}\n${s.body || ""}`.trim())
      .filter(Boolean)
      .join("\n\n"),
    lines: encodedLines,
    docType,
    fileUrl,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Built-in starter Media items so the Media tab has ready-to-use visuals immediately
 */
export const DEFAULT_MEDIA_ITEMS: LibraryItem[] = [
  {
    id: "media-preset-sanctuary-cross",
    title: "Sanctuary Gold Cross Backdrop",
    category: "media",
    author: "Image Media",
    mediaType: "image",
    mediaUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
          <defs>
            <radialGradient id="bg" cx="50%" cy="45%" r="70%">
              <stop offset="0%" stop-color="#1e293b"/>
              <stop offset="55%" stop-color="#0f172a"/>
              <stop offset="100%" stop-color="#020617"/>
            </radialGradient>
            <radialGradient id="glow" cx="50%" cy="42%" r="35%">
              <stop offset="0%" stop-color="rgba(245, 158, 11, 0.38)"/>
              <stop offset="100%" stop-color="rgba(245, 158, 11, 0)"/>
            </radialGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#bg)"/>
          <circle cx="960" cy="460" r="520" fill="url(#glow)"/>
          <g fill="#f59e0b" opacity="0.92">
            <rect x="936" y="210" width="48" height="520" rx="8"/>
            <rect x="780" y="340" width="360" height="48" rx="8"/>
          </g>
          <text x="960" y="850" text-anchor="middle" fill="#f8fafc" font-family="Montserrat, sans-serif" font-size="46" font-weight="800" letter-spacing="10">WORSHIP &amp; WORD</text>
        </svg>`
      ),
    content: "",
    lines: [
      encodeSlidePayload({
        kind: "media",
        mediaType: "image",
        heading: "Sanctuary Gold Cross Backdrop",
        fitMode: "cover",
        mediaUrl:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
              <defs>
                <radialGradient id="bg" cx="50%" cy="45%" r="70%">
                  <stop offset="0%" stop-color="#1e293b"/>
                  <stop offset="55%" stop-color="#0f172a"/>
                  <stop offset="100%" stop-color="#020617"/>
                </radialGradient>
                <radialGradient id="glow" cx="50%" cy="42%" r="35%">
                  <stop offset="0%" stop-color="rgba(245, 158, 11, 0.38)"/>
                  <stop offset="100%" stop-color="rgba(245, 158, 11, 0)"/>
                </radialGradient>
              </defs>
              <rect width="1920" height="1080" fill="url(#bg)"/>
              <circle cx="960" cy="460" r="520" fill="url(#glow)"/>
              <g fill="#f59e0b" opacity="0.92">
                <rect x="936" y="210" width="48" height="520" rx="8"/>
                <rect x="780" y="340" width="360" height="48" rx="8"/>
              </g>
              <text x="960" y="850" text-anchor="middle" fill="#f8fafc" font-family="Montserrat, sans-serif" font-size="46" font-weight="800" letter-spacing="10">WORSHIP &amp; WORD</text>
            </svg>`
          ),
      }),
    ],
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
  },
  {
    id: "media-preset-welcome-banner",
    title: "Welcome to Sunday Service Banner",
    category: "media",
    author: "Image Media",
    mediaType: "image",
    mediaUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#090e17"/>
              <stop offset="50%" stop-color="#1e1b4b"/>
              <stop offset="100%" stop-color="#0284c7"/>
            </linearGradient>
          </defs>
          <rect width="1920" height="1080" fill="url(#g)"/>
          <circle cx="1550" cy="220" r="380" fill="rgba(56, 189, 248, 0.14)"/>
          <circle cx="380" cy="880" r="420" fill="rgba(168, 85, 247, 0.16)"/>
          <text x="960" y="470" text-anchor="middle" fill="#38bdf8" font-family="Montserrat, sans-serif" font-size="34" font-weight="800" letter-spacing="14">WELCOME HOME</text>
          <text x="960" y="575" text-anchor="middle" fill="#ffffff" font-family="Montserrat, sans-serif" font-size="86" font-weight="900" letter-spacing="2">SUNDAY WORSHIP SERVICE</text>
          <text x="960" y="655" text-anchor="middle" fill="#cbd5e1" font-family="Inter, sans-serif" font-size="30" font-weight="500">We are glad you are worshipping with us today</text>
        </svg>`
      ),
    content: "",
    lines: [
      encodeSlidePayload({
        kind: "media",
        mediaType: "image",
        heading: "Welcome to Sunday Service Banner",
        fitMode: "cover",
        mediaUrl:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#090e17"/>
                  <stop offset="50%" stop-color="#1e1b4b"/>
                  <stop offset="100%" stop-color="#0284c7"/>
                </linearGradient>
              </defs>
              <rect width="1920" height="1080" fill="url(#g)"/>
              <circle cx="1550" cy="220" r="380" fill="rgba(56, 189, 248, 0.14)"/>
              <circle cx="380" cy="880" r="420" fill="rgba(168, 85, 247, 0.16)"/>
              <text x="960" y="470" text-anchor="middle" fill="#38bdf8" font-family="Montserrat, sans-serif" font-size="34" font-weight="800" letter-spacing="14">WELCOME HOME</text>
              <text x="960" y="575" text-anchor="middle" fill="#ffffff" font-family="Montserrat, sans-serif" font-size="86" font-weight="900" letter-spacing="2">SUNDAY WORSHIP SERVICE</text>
              <text x="960" y="655" text-anchor="middle" fill="#cbd5e1" font-family="Inter, sans-serif" font-size="30" font-weight="500">We are glad you are worshipping with us today</text>
            </svg>`
          ),
      }),
    ],
    createdAt: Date.now() - 45000,
    updatedAt: Date.now() - 45000,
  },
];

/**
 * Built-in starter Presentation items (PPTX & Word) so slide/page navigation can be tested right away
 */
export const DEFAULT_PRESENTATION_ITEMS: LibraryItem[] = [
  {
    id: "pres-preset-sermon-slides",
    title: "Walking by Faith — Sermon Deck.pptx",
    category: "presentation",
    author: "PowerPoint (4 Slides)",
    docType: "pptx",
    content: "Walking by Faith\n2 Corinthians 5:7",
    lines: [
      encodeSlidePayload({
        kind: "presentation",
        docType: "pptx",
        pageNumber: 1,
        totalPages: 4,
        heading: "Walking by Faith, Not by Sight",
        body: "Sunday Teaching Series • 2 Corinthians 5:7\nUnderstanding how faith anchors the believer in every season.",
        bullets: [
          "Sunday Teaching Series • 2 Corinthians 5:7",
          "Understanding how faith anchors the believer in every season.",
        ],
      }),
      encodeSlidePayload({
        kind: "presentation",
        docType: "pptx",
        pageNumber: 2,
        totalPages: 4,
        heading: "1. Faith Hears God's Promise",
        body: "Romans 10:17 — So then faith comes by hearing, and hearing by the word of God.\nGod's Word is the foundation of our confidence.",
        bullets: [
          "Romans 10:17 — Faith comes by hearing the Word of God",
          "God's promises outlast temporary circumstances",
          "Anchor your heart in Scripture daily",
        ],
      }),
      encodeSlidePayload({
        kind: "presentation",
        docType: "pptx",
        pageNumber: 3,
        totalPages: 4,
        heading: "2. Faith Takes Bold Steps",
        body: "Hebrews 11:8 — By faith Abraham obeyed when he was called to go out.\nObedience unlocks the next chapter of grace.",
        bullets: [
          "Hebrews 11:8 — By faith Abraham obeyed when called",
          "We do not need to see the whole staircase to take the first step",
          "Trust God's character when the path is unfamiliar",
        ],
      }),
      encodeSlidePayload({
        kind: "presentation",
        docType: "pptx",
        pageNumber: 4,
        totalPages: 4,
        heading: "3. Victory Through Persistent Faith",
        body: "1 John 5:4 — And this is the victory that has overcome the world—our faith.\nLet us hold fast the confession of our hope without wavering.",
        bullets: [
          "1 John 5:4 — The victory that overcomes the world is our faith",
          "Hold fast the confession of hope without wavering (Hebrews 10:23)",
          "Closing Prayer & Altar Declaration",
        ],
      }),
    ],
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
  },
  {
    id: "pres-preset-word-outline",
    title: "Sunday Service Study Notes & Bulletin.docx",
    category: "presentation",
    author: "Word Document (3 Pages)",
    docType: "docx",
    content: "Sunday Service Study Notes & Announcements",
    lines: [
      encodeSlidePayload({
        kind: "presentation",
        docType: "docx",
        pageNumber: 1,
        totalPages: 3,
        heading: "Welcome & Order of Worship — Page 1",
        body: "Welcome to our Sunday Morning Service! Today we gather in unity to lift up the name of Jesus in praise, prayer, and the study of God's Word.\n\n• Opening Call to Worship & Thanksgiving (Psalm 100)\n• Congregational Praise & Worship\n• Pastoral Prayer & Intercession",
        bullets: [
          "Welcome to our Sunday Morning Service! Today we gather in unity to lift up the name of Jesus.",
          "• Opening Call to Worship & Thanksgiving (Psalm 100)",
          "• Congregational Praise & Worship",
          "• Pastoral Prayer & Intercession",
        ],
      }),
      encodeSlidePayload({
        kind: "presentation",
        docType: "docx",
        pageNumber: 2,
        totalPages: 3,
        heading: "Midweek Bible Study & Fellowship — Page 2",
        body: "Join our midweek Bible Study this Wednesday at 6:30 PM in the Main Sanctuary and online. We are studying the Book of Acts and the power of the Early Church.\n\n• Wednesday 6:30 PM — Word & Prayer Encounter\n• Friday 7:00 PM — Youth & Young Adults Fellowship",
        bullets: [
          "Join our midweek Bible Study this Wednesday at 6:30 PM in the Main Sanctuary and online.",
          "• Wednesday 6:30 PM — Word & Prayer Encounter",
          "• Friday 7:00 PM — Youth & Young Adults Fellowship",
        ],
      }),
      encodeSlidePayload({
        kind: "presentation",
        docType: "docx",
        pageNumber: 3,
        totalPages: 3,
        heading: "Benediction & Weekly Confession — Page 3",
        body: "The LORD bless you and keep you; the LORD make His face shine upon you, and be gracious to you; the LORD lift up His countenance upon you, and give you peace. (Numbers 6:24-26)\n\nGo forth in the grace and strength of the Lord this week!",
        bullets: [
          "The LORD bless you and keep you; the LORD make His face shine upon you, and be gracious to you (Numbers 6:24-26).",
          "Go forth in the grace and strength of the Lord this week!",
        ],
      }),
    ],
    createdAt: Date.now() - 35000,
    updatedAt: Date.now() - 35000,
  },
];

