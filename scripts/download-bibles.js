import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const BIBLES_DIR = path.join(DATA_DIR, "bibles");
const CACHE_DIR = path.join(BIBLES_DIR, "cache");

if (!fs.existsSync(BIBLES_DIR)) fs.mkdirSync(BIBLES_DIR, { recursive: true });
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// Complete list of 66 Bible books with standard chapter counts
export const BIBLE_BOOKS = [
  { id: 1, name: "Genesis", chapters: 50 },
  { id: 2, name: "Exodus", chapters: 40 },
  { id: 3, name: "Leviticus", chapters: 27 },
  { id: 4, name: "Numbers", chapters: 36 },
  { id: 5, name: "Deuteronomy", chapters: 34 },
  { id: 6, name: "Joshua", chapters: 24 },
  { id: 7, name: "Judges", chapters: 21 },
  { id: 8, name: "Ruth", chapters: 4 },
  { id: 9, name: "1 Samuel", chapters: 31 },
  { id: 10, name: "2 Samuel", chapters: 24 },
  { id: 11, name: "1 Kings", chapters: 22 },
  { id: 12, name: "2 Kings", chapters: 25 },
  { id: 13, name: "1 Chronicles", chapters: 29 },
  { id: 14, name: "2 Chronicles", chapters: 36 },
  { id: 15, name: "Ezra", chapters: 10 },
  { id: 16, name: "Nehemiah", chapters: 13 },
  { id: 17, name: "Esther", chapters: 10 },
  { id: 18, name: "Job", chapters: 42 },
  { id: 19, name: "Psalms", chapters: 150 },
  { id: 20, name: "Proverbs", chapters: 31 },
  { id: 21, name: "Ecclesiastes", chapters: 12 },
  { id: 22, name: "Song of Solomon", chapters: 8 },
  { id: 23, name: "Isaiah", chapters: 66 },
  { id: 24, name: "Jeremiah", chapters: 52 },
  { id: 25, name: "Lamentations", chapters: 5 },
  { id: 26, name: "Ezekiel", chapters: 48 },
  { id: 27, name: "Daniel", chapters: 12 },
  { id: 28, name: "Hosea", chapters: 14 },
  { id: 29, name: "Joel", chapters: 3 },
  { id: 30, name: "Amos", chapters: 9 },
  { id: 31, name: "Obadiah", chapters: 1 },
  { id: 32, name: "Jonah", chapters: 4 },
  { id: 33, name: "Micah", chapters: 7 },
  { id: 34, name: "Nahum", chapters: 3 },
  { id: 35, name: "Habakkuk", chapters: 3 },
  { id: 36, name: "Zephaniah", chapters: 3 },
  { id: 37, name: "Haggai", chapters: 2 },
  { id: 38, name: "Zechariah", chapters: 14 },
  { id: 39, name: "Malachi", chapters: 4 },
  { id: 40, name: "Matthew", chapters: 28 },
  { id: 41, name: "Mark", chapters: 16 },
  { id: 42, name: "Luke", chapters: 24 },
  { id: 43, name: "John", chapters: 21 },
  { id: 44, name: "Acts", chapters: 28 },
  { id: 45, name: "Romans", chapters: 16 },
  { id: 46, name: "1 Corinthians", chapters: 16 },
  { id: 47, name: "2 Corinthians", chapters: 13 },
  { id: 48, name: "Galatians", chapters: 6 },
  { id: 49, name: "Ephesians", chapters: 6 },
  { id: 50, name: "Philippians", chapters: 4 },
  { id: 51, name: "Colossians", chapters: 4 },
  { id: 52, name: "1 Thessalonians", chapters: 5 },
  { id: 53, name: "2 Thessalonians", chapters: 3 },
  { id: 54, name: "1 Timothy", chapters: 6 },
  { id: 55, name: "2 Timothy", chapters: 4 },
  { id: 56, name: "Titus", chapters: 3 },
  { id: 57, name: "Philemon", chapters: 1 },
  { id: 58, name: "Hebrews", chapters: 13 },
  { id: 59, name: "James", chapters: 5 },
  { id: 60, name: "1 Peter", chapters: 5 },
  { id: 61, name: "2 Peter", chapters: 3 },
  { id: 62, name: "1 John", chapters: 5 },
  { id: 63, name: "2 John", chapters: 1 },
  { id: 64, name: "3 John", chapters: 1 },
  { id: 65, name: "Jude", chapters: 1 },
  { id: 66, name: "Revelation", chapters: 22 }
];

export const TARGET_VERSIONS = [
  { code: "KJV", bollsCode: "KJV", name: "King James Version", provider: "bolls" },
  { code: "WEB", bollsCode: "WEB", name: "World English Bible", provider: "bolls" },
  { code: "NIV", bollsCode: "NIV", name: "New International Version", provider: "bolls" },
  { code: "NKJV", bollsCode: "NKJV", name: "New King James Version", provider: "bolls" },
  { code: "ESV", bollsCode: "ESV", name: "English Standard Version", provider: "bolls" },
  { code: "NLT", bollsCode: "NLT", name: "New Living Translation", provider: "bolls" },
  { code: "NASB", bollsCode: "NASB", name: "New American Standard Bible", provider: "bolls" },
  { code: "ASV", bollsCode: "ASV", name: "American Standard Version", provider: "bolls" },
  { code: "BBE", bollsCode: "bbe", name: "Bible in Basic English", provider: "bible-api" },
  { code: "DARBY", bollsCode: "darby", name: "Darby Bible", provider: "bible-api" },
  { code: "DRA", bollsCode: "DRB", name: "Douay-Rheims", provider: "bolls" },
  { code: "YLT", bollsCode: "YLT", name: "Young's Literal Translation", provider: "bolls" },
  { code: "AMP", bollsCode: "AMP", name: "Amplified Bible", provider: "bolls" },
  { code: "RSV", bollsCode: "RSV", name: "Revised Standard Version", provider: "bolls" },
  { code: "MSG", bollsCode: "MSG", name: "The Message", provider: "bolls" },
  { code: "CSB", bollsCode: "CSB17", name: "Christian Standard Bible", provider: "bolls" },
  { code: "NIRV", bollsCode: "NIRV", name: "New International Reader's Version", provider: "bolls" },
  { code: "BSB", bollsCode: "BSB", name: "Berean Standard Bible", provider: "bolls" },
  { code: "TLV", bollsCode: "TLV", name: "Tree of Life Version", provider: "bolls" },
  { code: "CEB", bollsCode: "CEB", name: "Common English Bible", provider: "bolls" },
  { code: "GNT", bollsCode: "GNT", name: "Good News Translation", provider: "bolls" },
  { code: "TPT", bollsCode: "TPT", name: "The Passion Translation", provider: "local" },
  { code: "YOR", bollsCode: "YOR", name: "Bibeli Mímọ́ (Yoruba)", provider: "local" }
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fallback text for Yoruba Bibeli Mímọ́ Malachi 4:1-6 (standard 4-chapter division)
const YORUBA_MALACHI_4 = [
  { verse: 1, text: "Nítorí, kíyèsi i, ọjọ́ náà ń bọ̀, tí yóò jó bí iná ààrò; gbogbo àwọn agbéraga, àti gbogbo àwọn tí ń hùwà búburú yóò sì jẹ́ àgékù koríko; ọjọ́ tí ń bọ̀ náà yóò sì jó wọn run, ni Olúwa àwọn ọmọ-ogun wí, kì yóò sì fi gbòǹgbò tàbí ẹ̀ka sílẹ̀ fún wọn." },
  { verse: 2, text: "Ṣùgbọ́n fún ẹ̀yin tí ó bẹ̀rù orúkọ mi, oòrùn òdodo yóò yọ pẹ̀lú ìmúláradá ní ìyẹ́ apá rẹ̀; ẹ̀yin yóò sì jáde lọ, ẹ̀yin yóò sì máa fo bí àwọn ẹgbọrọ màlúù tí a ti inú ibùso wọn tú sílẹ̀." },
  { verse: 3, text: "Ẹ̀yin yóò sì tẹ àwọn ènìyàn búburú mọ́lẹ̀; nítorí tí wọn yóò jẹ́ eérú lábẹ́ àtẹ́lẹsẹ̀ yín ní ọjọ́ tí èmi yóò ṣe èyí, ni Olúwa àwọn ọmọ-ogun wí." },
  { verse: 4, text: "Ẹ rántí òfin Mose ìránṣẹ́ mi, tí mo pàṣẹ fún un ní Horebu fún gbogbo Israẹli, pẹ̀lú àwọn ìlànà àti àwọn ìdájọ́." },
  { verse: 5, text: "Kíyèsi i, èmi yóò rán Elijah wòlíì sí yín kí ọjọ́ Olúwa títóbi àti ẹ̀rù náà tó dé:" },
  { verse: 6, text: "Òun yóò sì pa ọkàn àwọn baba dà sí ti àwọn ọmọ, àti ọkàn àwọn ọmọ sí ti àwọn baba wọn, kí èmi má baà wá, kí èmi má sì fi ègún kọlu ilẹ̀ náà." }
];

/**
 * Checks whether a translation file is complete and valid.
 * Returns { isComplete: boolean, reason: string, totalVerses: number, totalChapters: number, expectedChapters: number, missingChapters: Array }
 */
export function checkTranslationStatus(ver) {
  const filePath = path.join(BIBLES_DIR, `${ver.code}.json`);
  if (!fs.existsSync(filePath)) {
    return {
      isComplete: false,
      reason: "File does not exist",
      totalVerses: 0,
      totalChapters: 0,
      expectedChapters: 1189,
      missingChapters: [],
    };
  }

  let data;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(raw);
  } catch (err) {
    return {
      isComplete: false,
      reason: `Corrupted JSON (${err.message})`,
      totalVerses: 0,
      totalChapters: 0,
      expectedChapters: 1189,
      missingChapters: [],
    };
  }

  if (!data || typeof data !== "object" || !data.books) {
    return {
      isComplete: false,
      reason: "Missing 'books' data object in JSON",
      totalVerses: 0,
      totalChapters: 0,
      expectedChapters: 1189,
      missingChapters: [],
    };
  }

  let totalVerses = 0;
  let totalChapters = 0;
  let expectedChapters = 0;
  const missingChapters = [];

  // TPT covers New Testament + Psalms, Proverbs, Song of Solomon
  const isTPT = ver.code === "TPT";
  const booksToCheck = isTPT
    ? BIBLE_BOOKS.filter((b) => [19, 20, 22].includes(b.id) || b.id >= 40)
    : BIBLE_BOOKS;

  for (const book of booksToCheck) {
    expectedChapters += book.chapters;
    const bookData = data.books[book.id] || data.books[String(book.id)];
    if (!bookData || !bookData.chapters) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        missingChapters.push({ bookId: book.id, bookName: book.name, chapter: ch });
      }
      continue;
    }

    for (let ch = 1; ch <= book.chapters; ch++) {
      const chVerses = bookData.chapters[ch] || bookData.chapters[String(ch)];
      if (Array.isArray(chVerses) && chVerses.length > 0) {
        totalVerses += chVerses.length;
        totalChapters++;
      } else {
        // Special case for Malachi 4 where verses 19-24 are in Malachi 3 (Hebrew versification)
        if (book.id === 39 && ch === 4) {
          const mal3 = bookData.chapters[3] || bookData.chapters["3"];
          if (Array.isArray(mal3) && mal3.length > 18) {
            totalChapters++;
            continue;
          }
        }
        missingChapters.push({ bookId: book.id, bookName: book.name, chapter: ch });
      }
    }
  }

  const minExpectedVerses = isTPT ? 10000 : 25000;
  const isComplete =
    missingChapters.length === 0 &&
    totalChapters === expectedChapters &&
    totalVerses >= minExpectedVerses;

  return {
    isComplete,
    reason: isComplete
      ? "Complete"
      : missingChapters.length > 0
      ? `Missing ${missingChapters.length} chapter(s) (${missingChapters.slice(0, 3).map(m => `${m.bookName} ${m.chapter}`).join(", ")}${missingChapters.length > 3 ? "..." : ""})`
      : `Low verse count (${totalVerses} verses)`,
    totalVerses,
    totalChapters,
    expectedChapters,
    missingChapters,
    existingData: data,
  };
}

// Download a full translation using bolls.life API with parallel batching
async function downloadVersion(ver) {
  console.log(`\n📦 Processing Bible version: ${ver.name} (${ver.code})...`);
  const versionCacheDir = path.join(CACHE_DIR, ver.code);
  if (!fs.existsSync(versionCacheDir)) fs.mkdirSync(versionCacheDir, { recursive: true });

  const fullFilePath = path.join(BIBLES_DIR, `${ver.code}.json`);
  let existingData = null;
  if (fs.existsSync(fullFilePath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(fullFilePath, "utf-8"));
    } catch {}
  }

  const bibleData = {
    version: ver.code,
    name: ver.name,
    books: {}
  };

  const isTPT = ver.code === "TPT";
  const booksToProcess = isTPT
    ? BIBLE_BOOKS.filter((b) => [19, 20, 22].includes(b.id) || b.id >= 40)
    : BIBLE_BOOKS;

  let totalChapters = 0;
  for (const b of booksToProcess) totalChapters += b.chapters;
  let processedCount = 0;
  let newlyFetchedCount = 0;

  // Process book by book
  for (const book of booksToProcess) {
    bibleData.books[book.id] = {
      name: book.name,
      chapters: {}
    };

    // Parallel batch 6 chapters at a time
    const chapterList = [];
    for (let ch = 1; ch <= book.chapters; ch++) chapterList.push(ch);

    const batchSize = 6;
    for (let i = 0; i < chapterList.length; i += batchSize) {
      const batch = chapterList.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (ch) => {
          const cacheFile = path.join(versionCacheDir, `${book.id}_${ch}.json`);
          let verses = null;

          // 1. Check existing consolidated JSON file first
          const existingVerses =
            existingData?.books?.[book.id]?.chapters?.[ch] ||
            existingData?.books?.[String(book.id)]?.chapters?.[String(ch)];
          if (Array.isArray(existingVerses) && existingVerses.length > 0) {
            verses = existingVerses;
            if (!fs.existsSync(cacheFile)) {
              try { fs.writeFileSync(cacheFile, JSON.stringify(verses), "utf-8"); } catch {}
            }
          }

          // 2. Check disk cache file if not found in consolidated JSON
          if (!verses && fs.existsSync(cacheFile)) {
            try {
              verses = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
            } catch {}
          }

          // 3. Special handling for Malachi 4:1-6
          if ((!verses || verses.length === 0) && book.id === 39 && ch === 4) {
            if (ver.code === "YOR") {
              verses = YORUBA_MALACHI_4;
              fs.writeFileSync(cacheFile, JSON.stringify(verses), "utf-8");
            } else {
              const mal3 =
                bibleData.books[39]?.chapters?.[3] ||
                existingData?.books?.[39]?.chapters?.[3] ||
                existingData?.books?.["39"]?.chapters?.["3"];
              if (Array.isArray(mal3) && mal3.length > 18) {
                verses = mal3.slice(18).map((v, idx) => ({
                  verse: idx + 1,
                  text: v.text,
                }));
                fs.writeFileSync(cacheFile, JSON.stringify(verses), "utf-8");
              }
            }
          }

          // 4. Fetch missing chapters from remote API (only if not local provider)
          if ((!verses || verses.length === 0) && ver.provider !== "local") {
            let retries = 3;
            while (retries > 0 && !verses) {
              try {
                let url;
                if (ver.provider === "bible-api") {
                  url = `https://bible-api.com/${encodeURIComponent(book.name)}%20${ch}?translation=${ver.bollsCode.toLowerCase()}`;
                } else {
                  url = `https://bolls.life/get-chapter/${ver.bollsCode}/${book.id}/${ch}/`;
                }
                const res = await fetch(url, {
                  headers: { "User-Agent": "EasyPresenterStudio/2.0" },
                  signal: AbortSignal.timeout(8000),
                });
                if (res.ok) {
                  const data = await res.json();
                  const list = Array.isArray(data) ? data : (data.verses || []);
                  if (Array.isArray(list) && list.length > 0) {
                    verses = list.map((v) => {
                      let raw = v.text || "";
                      if (raw.includes("<br/>")) {
                        raw = raw.split("<br/>").slice(1).join(" ");
                      }
                      const clean = raw
                        .replace(/<S>\d+<\/S>/g, "")
                        .replace(/<[^>]*>/g, "")
                        .replace(/\s+/g, " ")
                        .trim();
                      return { verse: v.verse, text: clean };
                    });
                    fs.writeFileSync(cacheFile, JSON.stringify(verses), "utf-8");
                    newlyFetchedCount++;
                  }
                } else {
                  retries--;
                  await sleep(300);
                }
              } catch {
                retries--;
                await sleep(500);
              }
            }
          }

          if (verses && verses.length > 0) {
            bibleData.books[book.id].chapters[ch] = verses;
          }
          processedCount++;
        })
      );

      const pct = ((processedCount / totalChapters) * 100).toFixed(1);
      process.stdout.write(`\r  ⏳ [${ver.code}] Progress: ${processedCount}/${totalChapters} chapters (${pct}%)`);
      await sleep(30);
    }
  }

  // Save complete consolidated JSON file
  fs.writeFileSync(fullFilePath, JSON.stringify(bibleData), "utf-8");
  console.log(`\n  ✅ Saved complete translation to ${fullFilePath} (${newlyFetchedCount} newly fetched chapters)`);
}

async function main() {
  console.log("=================================================");
  console.log("  📖 EasyStream Bible Offline Bulk Downloader");
  console.log("=================================================");
  console.log(`Target Directory: ${BIBLES_DIR}`);

  const args = process.argv.slice(2);
  const isForce = args.includes("--force") || args.includes("-f");
  const requestedCodes = args
    .filter((a) => !a.startsWith("-"))
    .map((r) => r.toUpperCase());

  const versionsToCheck = requestedCodes.length > 0
    ? TARGET_VERSIONS.filter((v) => requestedCodes.includes(v.code))
    : TARGET_VERSIONS;

  console.log(`\nChecking ${versionsToCheck.length} translation(s) for completeness${isForce ? " (FORCE RE-DOWNLOAD ENABLED)" : ""}...`);

  const toDownload = [];
  const completeList = [];

  for (const ver of versionsToCheck) {
    const status = checkTranslationStatus(ver);
    if (status.isComplete && !isForce) {
      console.log(`  ⏩ [SKIP] ${ver.code.padEnd(6)}: Complete (${status.totalVerses.toLocaleString()} verses across ${status.totalChapters} chapters)`);
      completeList.push(ver);
    } else {
      console.log(`  📥 [NEED] ${ver.code.padEnd(6)}: Incomplete -> ${status.reason}`);
      toDownload.push({ ver, status });
    }
  }

  if (toDownload.length === 0) {
    console.log("\n=================================================");
    console.log("  🎉 All checked Bible translations are already 100% complete!");
    console.log("  ⚡ No downloads were needed. (Use --force to force re-download)");
    console.log("=================================================");
    return;
  }

  console.log(`\nStarting download for ${toDownload.length} incomplete translation(s)...`);

  for (const { ver } of toDownload) {
    try {
      await downloadVersion(ver);
    } catch (err) {
      console.error(`\n❌ Error downloading ${ver.code}:`, err.message);
    }
  }

  console.log("\n=================================================");
  console.log("  🎉 Incomplete Bible downloads finished!");
  console.log("=================================================");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
