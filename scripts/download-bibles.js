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
  { code: "DRA", bollsCode: "dra", name: "Douay-Rheims", provider: "bible-api" },
  { code: "YLT", bollsCode: "YLT", name: "Young's Literal Translation", provider: "bolls" },
  { code: "AMP", bollsCode: "AMP", name: "Amplified Bible", provider: "bolls" },
  { code: "RSV", bollsCode: "RSV", name: "Revised Standard Version", provider: "bolls" },
  { code: "MSG", bollsCode: "MSG", name: "The Message", provider: "bolls" },
  { code: "CSB", bollsCode: "CSB17", name: "Christian Standard Bible", provider: "bolls" },
  { code: "NIRV", bollsCode: "NIRV", name: "New International Reader's Version", provider: "bolls" },
  { code: "BSB", bollsCode: "BSB", name: "Berean Standard Bible", provider: "bolls" },
  { code: "TLV", bollsCode: "TLV", name: "Tree of Life Version", provider: "bolls" },
  { code: "CEB", bollsCode: "CEB", name: "Common English Bible", provider: "bolls" }
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Download a full translation using bolls.life API with parallel batching
async function downloadVersion(ver) {
  console.log(`\n📦 Downloading Bible version: ${ver.name} (${ver.code})...`);
  const versionCacheDir = path.join(CACHE_DIR, ver.code);
  if (!fs.existsSync(versionCacheDir)) fs.mkdirSync(versionCacheDir, { recursive: true });

  const bibleData = {
    version: ver.code,
    name: ver.name,
    books: {}
  };

  let totalChapters = 0;
  for (const b of BIBLE_BOOKS) totalChapters += b.chapters;
  let processedCount = 0;

  // Process book by book
  for (const book of BIBLE_BOOKS) {
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

          if (fs.existsSync(cacheFile)) {
            try {
              verses = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
            } catch {}
          }

          if (!verses) {
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

          if (verses) {
            bibleData.books[book.id].chapters[ch] = verses;
          }
          processedCount++;
        })
      );

      const pct = ((processedCount / totalChapters) * 100).toFixed(1);
      process.stdout.write(`\r  ⏳ [${ver.code}] Progress: ${processedCount}/${totalChapters} chapters (${pct}%)`);
      await sleep(50);
    }
  }

  // Save complete consolidated JSON file
  const fullFilePath = path.join(BIBLES_DIR, `${ver.code}.json`);
  fs.writeFileSync(fullFilePath, JSON.stringify(bibleData), "utf-8");
  console.log(`\n  ✅ Saved complete translation to ${fullFilePath}`);
}

async function main() {
  console.log("=================================================");
  console.log("  📖 EasyStream Bible Offline Bulk Downloader");
  console.log("=================================================");
  console.log(`Target Directory: ${BIBLES_DIR}`);

  const requested = process.argv.slice(2);
  const versionsToDownload = requested.length > 0
    ? TARGET_VERSIONS.filter(v => requested.map(r => r.toUpperCase()).includes(v.code))
    : TARGET_VERSIONS;

  console.log(`Versions selected: ${versionsToDownload.map(v => v.code).join(", ")}`);

  for (const ver of versionsToDownload) {
    try {
      await downloadVersion(ver);
    } catch (err) {
      console.error(`❌ Error downloading ${ver.code}:`, err.message);
    }
  }

  console.log("\n=================================================");
  console.log("  🎉 All selected Bible versions stored locally!");
  console.log("=================================================");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
