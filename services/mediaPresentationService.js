import fs from "fs";
import path from "path";
import zlib from "zlib";
import * as cheerio from "cheerio";

/**
 * Minimal, dependency-free ZIP archive reader using Node's built-in zlib.
 * Parses Central Directory (or Local File Headers as fallback) and returns a Map of entryName -> Buffer.
 */
export function readZipEntries(buffer) {
  const entries = new Map();
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
    return entries;
  }

  // Locate End of Central Directory (EOCD) signature 0x06054b50
  let eocdOffset = -1;
  const maxComment = Math.min(buffer.length - 22, 65535);
  for (let i = buffer.length - 22; i >= buffer.length - 22 - maxComment && i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset !== -1) {
    const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
    const cdSize = buffer.readUInt32LE(eocdOffset + 12);
    const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

    let ptr = cdOffset;
    for (let i = 0; i < totalEntries && ptr + 46 <= buffer.length && ptr < cdOffset + cdSize; i++) {
      const sig = buffer.readUInt32LE(ptr);
      if (sig !== 0x02014b50) break;

      const compressionMethod = buffer.readUInt16LE(ptr + 10);
      const compressedSize = buffer.readUInt32LE(ptr + 20);
      const fileNameLen = buffer.readUInt16LE(ptr + 28);
      const extraLen = buffer.readUInt16LE(ptr + 30);
      const commentLen = buffer.readUInt16LE(ptr + 32);
      const localHeaderOffset = buffer.readUInt32LE(ptr + 42);

      const fileName = buffer.toString("utf8", ptr + 46, ptr + 46 + fileNameLen);
      ptr += 46 + fileNameLen + extraLen + commentLen;

      if (fileName.endsWith("/")) continue;
      if (localHeaderOffset + 30 > buffer.length) continue;

      const localSig = buffer.readUInt32LE(localHeaderOffset);
      if (localSig !== 0x04034b50) continue;

      const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const dataEnd = dataStart + compressedSize;

      if (dataEnd > buffer.length) continue;
      const rawData = buffer.subarray(dataStart, dataEnd);

      try {
        if (compressionMethod === 0) {
          entries.set(fileName, rawData);
        } else if (compressionMethod === 8) {
          const inflated = zlib.inflateRawSync(rawData);
          entries.set(fileName, inflated);
        }
      } catch (err) {
        // Skip corrupted entry
      }
    }
  }

  // Fallback: scan local file headers if EOCD was not standard
  if (entries.size === 0) {
    let offset = 0;
    while (offset + 30 <= buffer.length) {
      const sig = buffer.readUInt32LE(offset);
      if (sig !== 0x04034b50) break;

      const bitFlag = buffer.readUInt16LE(offset + 6);
      const compressionMethod = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);

      const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLen);
      const dataStart = offset + 30 + fileNameLen + extraLen;

      if ((bitFlag & 0x08) !== 0 || compressedSize === 0) {
        break;
      }

      const dataEnd = dataStart + compressedSize;
      if (dataEnd > buffer.length) break;

      if (!fileName.endsWith("/")) {
        const rawData = buffer.subarray(dataStart, dataEnd);
        try {
          if (compressionMethod === 0) {
            entries.set(fileName, rawData);
          } else if (compressionMethod === 8) {
            entries.set(fileName, zlib.inflateRawSync(rawData));
          }
        } catch {}
      }
      offset = dataEnd;
    }
  }

  return entries;
}

/**
 * Helper to save an extracted media buffer into uploadsDir and return its public URL
 */
function saveExtractedMedia(uploadsDir, prefix, originalEntryName, dataBuffer) {
  const ext = path.extname(originalEntryName).toLowerCase() || ".png";
  const safeBase = path
    .basename(originalEntryName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${prefix}_${safeBase}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`;
  const fullPath = path.join(uploadsDir, fileName);
  fs.writeFileSync(fullPath, dataBuffer);
  return `/api/uploads/${fileName}`;
}

/**
 * Parse a .pptx buffer into structured slides.
 */
export function parsePptxBuffer(buffer, uploadsDir, docTitle = "Presentation") {
  const entries = readZipEntries(buffer);
  if (entries.size === 0) {
    throw new Error("Invalid or empty PowerPoint (.pptx) archive");
  }

  // 1. Determine ordered list of slide XML paths
  let orderedSlidePaths = [];

  const presXmlBuf = entries.get("ppt/presentation.xml");
  const presRelsBuf = entries.get("ppt/_rels/presentation.xml.rels");

  if (presXmlBuf && presRelsBuf) {
    try {
      const $pres = cheerio.load(presXmlBuf.toString("utf8"), { xmlMode: true });
      const $rels = cheerio.load(presRelsBuf.toString("utf8"), { xmlMode: true });

      const relMap = new Map();
      $rels("Relationship").each((_, el) => {
        const id = $rels(el).attr("Id");
        const target = $rels(el).attr("Target");
        if (id && target) {
          const normalized = target.startsWith("/")
            ? target.slice(1)
            : target.startsWith("ppt/")
            ? target
            : `ppt/${target.replace(/^\.\//, "")}`;
          relMap.set(id, normalized);
        }
      });

      $pres("p\\:sldId, sldId").each((_, el) => {
        const rId = $pres(el).attr("r:id") || $pres(el).attr("id");
        if (rId && relMap.has(rId)) {
          const targetPath = relMap.get(rId);
          if (entries.has(targetPath)) {
            orderedSlidePaths.push(targetPath);
          }
        }
      });
    } catch {}
  }

  // Fallback: sort ppt/slides/slideN.xml numerically
  if (orderedSlidePaths.length === 0) {
    orderedSlidePaths = Array.from(entries.keys())
      .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || "0", 10);
        return numA - numB;
      });
  }

  // Map extracted images so we don't duplicate saving the same image used on multiple slides
  const savedImageMap = new Map();

  const slides = orderedSlidePaths.map((slidePath, idx) => {
    const slideBuf = entries.get(slidePath);
    const slideXml = slideBuf ? slideBuf.toString("utf8") : "";
    const $ = cheerio.load(slideXml, { xmlMode: true });

    // Check slide relationships for images and notes
    const slideBaseName = path.basename(slidePath);
    const slideRelsPath = `ppt/slides/_rels/${slideBaseName}.rels`;
    const slideRelMap = new Map();
    let notesSlidePath = null;

    if (entries.has(slideRelsPath)) {
      try {
        const $srels = cheerio.load(entries.get(slideRelsPath).toString("utf8"), { xmlMode: true });
        $srels("Relationship").each((_, relEl) => {
          const rId = $srels(relEl).attr("Id");
          const type = $srels(relEl).attr("Type") || "";
          const target = $srels(relEl).attr("Target") || "";
          if (!rId || !target) return;

          const resolved = path.posix.normalize(path.posix.join("ppt/slides", target));
          slideRelMap.set(rId, { type, resolved });

          if (type.includes("/notesSlide")) {
            notesSlidePath = resolved;
          }
        });
      } catch {}
    }

    // Extract first/primary embedded image on the slide if any
    let slideImageUrl = undefined;
    $("a\\:blip, blip").each((_, blipEl) => {
      if (slideImageUrl) return;
      const embedId = $(blipEl).attr("r:embed") || $(blipEl).attr("embed");
      if (embedId && slideRelMap.has(embedId)) {
        const targetInfo = slideRelMap.get(embedId);
        const mediaPath = targetInfo.resolved;
        if (entries.has(mediaPath) && /\.(png|jpe?g|gif|webp|svg)$/i.test(mediaPath)) {
          if (savedImageMap.has(mediaPath)) {
            slideImageUrl = savedImageMap.get(mediaPath);
          } else if (uploadsDir) {
            try {
              const url = saveExtractedMedia(uploadsDir, "pptx", mediaPath, entries.get(mediaPath));
              savedImageMap.set(mediaPath, url);
              slideImageUrl = url;
            } catch {}
          }
        }
      }
    });

    // Extract shapes (title, subtitle, body paragraphs, tables)
    let heading = "";
    let subtitle = "";
    const bullets = [];
    const paragraphs = [];

    $("p\\:sp, sp").each((_, spEl) => {
      const $sp = $(spEl);
      const phType =
        $sp.find("p\\:ph, ph").attr("type") ||
        $sp.find("p\\:nvSpPr p\\:ph, nvSpPr ph").attr("type") ||
        "";

      const shapeLines = [];
      $sp.find("a\\:p, p").each((__, pEl) => {
        const $p = $(pEl);
        const runs = [];
        $p.find("a\\:r, r, a\\:fld, fld, a\\:br, br").each((___, node) => {
          const tagName = (node.tagName || node.name || "").toLowerCase();
          if (tagName.endsWith("br")) {
            runs.push("\n");
          } else {
            const t = $(node).find("a\\:t, t").text();
            if (t) runs.push(t);
          }
        });
        // Fallback if a:t is directly inside a:p
        if (runs.length === 0) {
          $p.find("a\\:t, t").each((___, tEl) => {
            runs.push($(tEl).text());
          });
        }
        const lineText = runs.join("").replace(/\s+/g, " ").trim();
        if (lineText) {
          shapeLines.push(lineText);
        }
      });

      if (shapeLines.length === 0) return;

      const joinedShape = shapeLines.join("\n");
      if (
        (phType === "title" || phType === "ctrTitle") &&
        !heading
      ) {
        heading = shapeLines.join(" — ");
      } else if (phType === "subTitle" && !subtitle) {
        subtitle = joinedShape;
      } else {
        for (const l of shapeLines) {
          bullets.push(l);
          paragraphs.push(l);
        }
      }
    });

    // Extract tables (a:tbl)
    $("a\\:tbl, tbl").each((_, tblEl) => {
      const $tbl = $(tblEl);
      $tbl.find("a\\:tr, tr").each((__, trEl) => {
        const rowCells = [];
        $(trEl)
          .find("a\\:tc, tc")
          .each((___, tcEl) => {
            const cellText = $(tcEl)
              .find("a\\:t, t")
              .map((____, tEl) => $(tEl).text())
              .get()
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            if (cellText) rowCells.push(cellText);
          });
        if (rowCells.length > 0) {
          const rowStr = rowCells.join("  |  ");
          bullets.push(rowStr);
          paragraphs.push(rowStr);
        }
      });
    });

    // If no explicit title placeholder was found, promote first short line as heading
    if (!heading && paragraphs.length > 0 && paragraphs[0].length <= 80) {
      heading = paragraphs.shift();
      bullets.shift();
    }

    if (subtitle) {
      paragraphs.unshift(subtitle);
      bullets.unshift(subtitle);
    }

    // Extract Speaker Notes if present
    let notes = "";
    if (notesSlidePath && entries.has(notesSlidePath)) {
      try {
        const $notes = cheerio.load(entries.get(notesSlidePath).toString("utf8"), { xmlMode: true });
        const noteLines = [];
        $notes("p\\:sp, sp").each((_, spEl) => {
          const phType = $notes(spEl).find("p\\:ph, ph").attr("type") || "";
          if (phType === "sldNum" || phType === "hdr" || phType === "ftr") return;
          $notes(spEl)
            .find("a\\:p, p")
            .each((__, pEl) => {
              const t = $notes(pEl)
                .find("a\\:t, t")
                .map((___, tEl) => $notes(tEl).text())
                .get()
                .join("")
                .trim();
              if (t) noteLines.push(t);
            });
        });
        notes = noteLines.join("\n").trim();
      } catch {}
    }

    const bodyText = paragraphs.join("\n");

    return {
      kind: "presentation",
      docType: "pptx",
      pageNumber: idx + 1,
      totalPages: orderedSlidePaths.length,
      heading: heading || `${docTitle} — Slide ${idx + 1}`,
      body: bodyText,
      bullets: bullets.length > 0 ? bullets : undefined,
      imageUrl: slideImageUrl,
      notes: notes || undefined,
    };
  });

  return slides;
}

/**
 * Parse a .docx buffer into structured Pages.
 */
export function parseDocxBuffer(buffer, uploadsDir, docTitle = "Document") {
  const entries = readZipEntries(buffer);
  const docXmlBuf = entries.get("word/document.xml");
  if (!docXmlBuf) {
    throw new Error("Invalid Word (.docx) file: word/document.xml not found");
  }

  // Parse relationships for embedded images
  const relMap = new Map();
  const relsBuf = entries.get("word/_rels/document.xml.rels");
  if (relsBuf) {
    try {
      const $rels = cheerio.load(relsBuf.toString("utf8"), { xmlMode: true });
      $rels("Relationship").each((_, el) => {
        const id = $rels(el).attr("Id");
        const target = $rels(el).attr("Target");
        if (id && target) {
          const resolved = target.startsWith("/")
            ? target.slice(1)
            : path.posix.normalize(path.posix.join("word", target));
          relMap.set(id, resolved);
        }
      });
    } catch {}
  }

  const savedImages = new Map();
  const $ = cheerio.load(docXmlBuf.toString("utf8"), { xmlMode: true });

  // Collect structured blocks: { type: 'heading' | 'paragraph' | 'pagebreak', text, imageUrl }
  const blocks = [];

  $("w\\:body, body")
    .children()
    .each((_, el) => {
      const tagName = (el.tagName || el.name || "").toLowerCase();

      if (tagName.endsWith("p")) {
        const $p = $(el);

        // Check for explicit page break inside paragraph
        const hasExplicitPageBreak =
          $p.find('w\\:br[w\\:type="page"], br[type="page"], w\\:lastRenderedPageBreak, lastRenderedPageBreak').length > 0 ||
          $p.find("w\\:sectPr, sectPr").length > 0;

        // Check paragraph style for Heading / Title
        const styleVal =
          $p.find("w\\:pPr w\\:pStyle, pPr pStyle").attr("w:val") ||
          $p.find("w\\:pPr w\\:pStyle, pPr pStyle").attr("val") ||
          "";
        const isHeading = /^(Heading[1-4]|Title|Subtitle|heading\s*[1-4]|title)/i.test(styleVal);
        const isBullet = $p.find("w\\:numPr, numPr").length > 0;

        // Check for embedded image
        let paraImageUrl = undefined;
        $p.find("a\\:blip, blip, v\\:imagedata, imagedata").each((__, imgEl) => {
          if (paraImageUrl) return;
          const rId =
            $(imgEl).attr("r:embed") ||
            $(imgEl).attr("embed") ||
            $(imgEl).attr("r:id") ||
            $(imgEl).attr("id");
          if (rId && relMap.has(rId)) {
            const mediaPath = relMap.get(rId);
            if (entries.has(mediaPath) && /\.(png|jpe?g|gif|webp|svg)$/i.test(mediaPath)) {
              if (savedImages.has(mediaPath)) {
                paraImageUrl = savedImages.get(mediaPath);
              } else if (uploadsDir) {
                try {
                  const url = saveExtractedMedia(uploadsDir, "docx", mediaPath, entries.get(mediaPath));
                  savedImages.set(mediaPath, url);
                  paraImageUrl = url;
                } catch {}
              }
            }
          }
        });

        // Extract text runs
        const runs = [];
        $p.find("w\\:r, r").each((__, rEl) => {
          const $r = $(rEl);
          $r.children().each((___, child) => {
            const cName = (child.tagName || child.name || "").toLowerCase();
            if (cName.endsWith("t")) {
              runs.push($(child).text());
            } else if (cName.endsWith("tab")) {
              runs.push(" ");
            } else if (cName.endsWith("br") || cName.endsWith("cr")) {
              const brType = $(child).attr("w:type") || $(child).attr("type");
              if (brType !== "page") {
                runs.push("\n");
              }
            }
          });
        });

        const text = runs.join("").replace(/[ \t]+/g, " ").trim();

        if (hasExplicitPageBreak && blocks.length > 0) {
          blocks.push({ type: "pagebreak", text: "" });
        }

        if (text || paraImageUrl) {
          blocks.push({
            type: isHeading ? "heading" : isBullet ? "bullet" : "paragraph",
            text: isBullet && text ? `• ${text}` : text,
            imageUrl: paraImageUrl,
          });
        }
      } else if (tagName.endsWith("tbl")) {
        // Extract table rows
        const $tbl = $(el);
        const tableLines = [];
        $tbl.find("w\\:tr, tr").each((__, trEl) => {
          const cells = [];
          $(trEl)
            .find("w\\:tc, tc")
            .each((___, tcEl) => {
              const cellTxt = $(tcEl)
                .find("w\\:t, t")
                .map((____, tEl) => $(tEl).text())
                .get()
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();
              if (cellTxt) cells.push(cellTxt);
            });
          if (cells.length > 0) {
            tableLines.push(cells.join("  |  "));
          }
        });
        if (tableLines.length > 0) {
          blocks.push({
            type: "paragraph",
            text: tableLines.join("\n"),
          });
        }
      }
    });

  // Paginate blocks into readable presentation pages
  const rawPages = [];
  let currentHeading = "";
  let currentParas = [];
  let currentWords = 0;
  let currentImage = undefined;

  const flushPage = () => {
    if (!currentHeading && currentParas.length === 0 && !currentImage) return;
    rawPages.push({
      heading: currentHeading,
      paragraphs: [...currentParas],
      imageUrl: currentImage,
    });
    currentHeading = "";
    currentParas = [];
    currentWords = 0;
    currentImage = undefined;
  };

  for (const b of blocks) {
    if (b.type === "pagebreak") {
      flushPage();
      continue;
    }

    if (b.type === "heading") {
      // If current page already has body content, start a new page for this heading
      if (currentParas.length > 0 || currentImage) {
        flushPage();
      }
      if (!currentHeading) {
        currentHeading = b.text;
      } else {
        currentParas.push(b.text);
      }
      if (b.imageUrl && !currentImage) currentImage = b.imageUrl;
      continue;
    }

    const wordsInBlock = (b.text || "").split(/\s+/).filter(Boolean).length;

    // If adding this paragraph exceeds ~110 words or 6 paragraphs on a page, flush first
    if (
      currentParas.length > 0 &&
      (currentWords + wordsInBlock > 115 || currentParas.length >= 6)
    ) {
      const carryHeading = currentHeading;
      flushPage();
      if (carryHeading) {
        currentHeading = `${carryHeading} (Cont.)`;
      }
    }

    if (b.text) {
      currentParas.push(b.text);
      currentWords += wordsInBlock;
    }
    if (b.imageUrl && !currentImage) {
      currentImage = b.imageUrl;
    }
  }
  flushPage();

  if (rawPages.length === 0) {
    rawPages.push({
      heading: docTitle,
      paragraphs: ["(Document imported — no text paragraphs found)"],
    });
  }

  return rawPages.map((pg, idx) => ({
    kind: "presentation",
    docType: "docx",
    pageNumber: idx + 1,
    totalPages: rawPages.length,
    heading: pg.heading || `${docTitle} — Page ${idx + 1}`,
    body: pg.paragraphs.join("\n\n"),
    bullets: pg.paragraphs,
    imageUrl: pg.imageUrl,
  }));
}

/**
 * Parse a .pdf buffer to determine page count and extract readable text per page,
 * while linking each page to the hosted PDF URL for visual rendering.
 */
export function parsePdfBuffer(buffer, pdfUrl, docTitle = "PDF Document") {
  const rawStr = buffer.toString("latin1");

  // 1. Determine total page count
  let pageCount = 0;

  // Match /Type /Page (excluding /Type /Pages)
  const pageMatches = rawStr.match(/\/Type\s*\/Page\b(?!s)/g);
  if (pageMatches && pageMatches.length > 0) {
    pageCount = pageMatches.length;
  }

  // Fallback to /Count N inside /Pages dictionary
  if (pageCount === 0) {
    const countMatches = [...rawStr.matchAll(/\/Count\s+(\d+)/g)];
    for (const m of countMatches) {
      const n = parseInt(m[1], 10);
      if (n > pageCount && n < 2000) pageCount = n;
    }
  }

  if (pageCount <= 0) pageCount = 1;

  // 2. Attempt to extract text streams from PDF (FlateDecode or plain BT..ET)
  const extractedTexts = [];
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(rawStr)) !== null && extractedTexts.length < pageCount * 4) {
    const streamContentLatin1 = match[1];
    const streamBuf = Buffer.from(streamContentLatin1, "latin1");
    let decoded = "";
    try {
      decoded = zlib.inflateSync(streamBuf).toString("latin1");
    } catch {
      try {
        decoded = zlib.inflateRawSync(streamBuf).toString("latin1");
      } catch {
        if (streamContentLatin1.includes("BT") && streamContentLatin1.includes("ET")) {
          decoded = streamContentLatin1;
        }
      }
    }

    if (decoded && decoded.includes("BT")) {
      const textChunks = [];
      const btBlocks = decoded.match(/BT[\s\S]*?ET/g) || [];
      for (const blk of btBlocks) {
        // Extract parenthesized strings (...)
        const strMatches = blk.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g);
        for (const sm of strMatches) {
          const clean = sm[1]
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, " ")
            .replace(/\\t/g, " ")
            .replace(/\\\(/g, "(")
            .replace(/\\\)/g, ")")
            .replace(/\\\\/g, "\\")
            .replace(/[^\x20-\x7E\n]/g, "")
            .trim();
          if (clean.length > 1) textChunks.push(clean);
        }
      }
      const joined = textChunks.join(" ").replace(/\s+/g, " ").trim();
      if (joined.length > 5) {
        extractedTexts.push(joined);
      }
    }
  }

  const pages = [];
  for (let p = 1; p <= pageCount; p++) {
    const pageText = extractedTexts[p - 1] || "";
    pages.push({
      kind: "presentation",
      docType: "pdf",
      pageNumber: p,
      totalPages: pageCount,
      heading: `${docTitle} — Page ${p}`,
      body: pageText,
      pdfUrl,
    });
  }

  return pages;
}

/**
 * Fallback parser for legacy binary .doc or .ppt files.
 * Extracts clean readable ASCII / UTF-16LE text segments and paginates them.
 */
export function parseLegacyOfficeBuffer(buffer, ext, docTitle = "Document") {
  const docType = ext.includes("ppt") ? "pptx" : "docx";
  const chunks = [];

  // Extract ASCII runs of >= 6 printable chars
  const asciiStr = buffer.toString("latin1");
  const asciiMatches = asciiStr.match(/[A-Za-z0-9 ,.;:'"?!()\-\n\r]{12,}/g) || [];
  for (const m of asciiMatches) {
    const trimmed = m.replace(/\s+/g, " ").trim();
    // Filter out internal OLE/XML/font metadata noise
    if (
      trimmed.length >= 15 &&
      !/^(Root Entry|Microsoft|PowerPoint|Word\.Document|Normal\.dot|Times New Roman|Calibri|Arial|Content_Types|_rels|theme\/theme)/i.test(trimmed) &&
      /[a-z]{3,}/i.test(trimmed)
    ) {
      chunks.push(trimmed);
    }
  }

  // Group into pages/slides of ~4 chunks each
  const slides = [];
  const groupSize = 4;
  for (let i = 0; i < chunks.length; i += groupSize) {
    const slice = chunks.slice(i, i + groupSize);
    slides.push(slice.join("\n\n"));
  }

  if (slides.length === 0) {
    slides.push(`Imported ${docTitle}`);
  }

  const label = docType === "pptx" ? "Slide" : "Page";
  return slides.map((body, idx) => ({
    kind: "presentation",
    docType,
    pageNumber: idx + 1,
    totalPages: slides.length,
    heading: `${docTitle} — ${label} ${idx + 1}`,
    body,
  }));
}

