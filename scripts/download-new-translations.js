import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import { BIBLE_BOOKS } from "./download-bibles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");
const BIBLES_DIR = path.join(DATA_DIR, "bibles");

if (!fs.existsSync(BIBLES_DIR)) fs.mkdirSync(BIBLES_DIR, { recursive: true });

// Map of book id (1-66) to standard Book Name
const BOOK_NAMES = {};
for (const b of BIBLE_BOOKS) {
  BOOK_NAMES[b.id] = b.name;
}

// 66 Protestant canon book codes in order in vref.txt
const VREF_BOOK_CODES = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG",
  "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH",
  "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC",
  "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS",
  "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB",
  "ZEP", "HAG", "ZEC", "MAL", "MAT", "MRK", "LUK",
  "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH",
  "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT",
  "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN",
  "3JN", "JUD", "REV"
];

const CODE_TO_BOOK_ID = {};
VREF_BOOK_CODES.forEach((code, idx) => {
  CODE_TO_BOOK_ID[code] = idx + 1;
});

/**
 * Convert XML Bible format (from Beblia) to EasyPresenter JSON format
 */
async function buildXmlBible(versionCode, versionName, xmlUrl) {
  console.log(`\n📥 Fetching ${versionName} (${versionCode}) from ${xmlUrl}...`);
  const res = await fetch(xmlUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${versionCode} from ${xmlUrl}: ${res.status}`);
  }
  const xml = await res.text();
  console.log(`  Parsing XML (${(xml.length / 1024 / 1024).toFixed(2)} MB)...`);

  const $ = cheerio.load(xml, { xmlMode: true });
  const bibleData = {
    version: versionCode,
    name: versionName,
    books: {},
  };

  $("book").each((_, bookEl) => {
    const bookNum = parseInt($(bookEl).attr("number"), 10);
    if (isNaN(bookNum) || bookNum < 1 || bookNum > 66) return;

    const bookName = BOOK_NAMES[bookNum] || `Book ${bookNum}`;
    bibleData.books[bookNum] = {
      name: bookName,
      chapters: {},
    };

    $(bookEl).find("chapter").each((_, chEl) => {
      const chNum = parseInt($(chEl).attr("number"), 10);
      if (isNaN(chNum)) return;

      const verses = [];
      $(chEl).find("verse").each((_, vEl) => {
        const vNum = parseInt($(vEl).attr("number"), 10);
        let text = $(vEl).text() || "";
        text = text.replace(/\s+/g, " ").trim();
        if (text) {
          verses.push({ verse: vNum, text });
        }
      });

      if (verses.length > 0) {
        bibleData.books[bookNum].chapters[chNum] = verses;
      }
    });
  });

  const targetPath = path.join(BIBLES_DIR, `${versionCode}.json`);
  fs.writeFileSync(targetPath, JSON.stringify(bibleData), "utf-8");
  console.log(`  ✅ Successfully saved ${versionCode}.json (${(fs.statSync(targetPath).size / 1024 / 1024).toFixed(2)} MB)`);
  return bibleData;
}

/**
 * Build Yoruba Bible from BibleNLP/ebible corpus
 */
async function buildYorubaBible() {
  const versionCode = "YOR";
  const versionName = "Bibeli Mímọ́ (Yoruba Bible)";
  console.log(`\n📥 Fetching Yoruba Bible (Bibeli Mímọ́) from BibleNLP ebible corpus...`);

  const [vrefRes, yorRes] = await Promise.all([
    fetch("https://raw.githubusercontent.com/BibleNLP/ebible/main/metadata/vref.txt"),
    fetch("https://raw.githubusercontent.com/BibleNLP/ebible/main/corpus/yor-yor.txt")
  ]);

  if (!vrefRes.ok || !yorRes.ok) {
    throw new Error(`Failed to fetch Yoruba corpus: vref ${vrefRes.status}, yor ${yorRes.status}`);
  }

  const vrefText = await vrefRes.text();
  const yorText = await yorRes.text();

  const vrefLines = vrefText.split("\n");
  const yorLines = yorText.split("\n");

  const bibleData = {
    version: versionCode,
    name: versionName,
    books: {},
  };

  for (let i = 0; i < vrefLines.length; i++) {
    const vref = vrefLines[i]?.trim();
    const verseText = yorLines[i]?.trim();
    if (!vref || !verseText) continue;

    const parts = vref.split(" ");
    if (parts.length < 2) continue;

    const bookCode = parts[0];
    const bookId = CODE_TO_BOOK_ID[bookCode];
    if (!bookId) continue; // Skip non-canonical / apocrypha books

    const ref = parts[1]; // e.g. "3:16"
    const [chStr, vStr] = ref.split(":");
    const chNum = parseInt(chStr, 10);
    const vNum = parseInt(vStr, 10);

    if (!bibleData.books[bookId]) {
      bibleData.books[bookId] = {
        name: BOOK_NAMES[bookId] || bookCode,
        chapters: {},
      };
    }

    if (!bibleData.books[bookId].chapters[chNum]) {
      bibleData.books[bookId].chapters[chNum] = [];
    }

    bibleData.books[bookId].chapters[chNum].push({
      verse: vNum,
      text: verseText.replace(/\s+/g, " ").trim(),
    });
  }

  const targetPath = path.join(BIBLES_DIR, `${versionCode}.json`);
  fs.writeFileSync(targetPath, JSON.stringify(bibleData), "utf-8");
  console.log(`  ✅ Successfully saved ${versionCode}.json (${(fs.statSync(targetPath).size / 1024 / 1024).toFixed(2)} MB)`);
  return bibleData;
}

async function run() {
  console.log("====================================================");
  console.log("  Downloading & Building GNT, TPT, and YOR Bibles");
  console.log("====================================================");

  // 1. GNT: Good News Translation
  await buildXmlBible(
    "GNT",
    "Good News Translation",
    "https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishGNTBible.xml"
  );

  // 2. TPT: The Passion Translation
  await buildXmlBible(
    "TPT",
    "The Passion Translation",
    "https://raw.githubusercontent.com/Beblia/Holy-Bible-XML-Format/master/EnglishPassionBible.xml"
  );

  // 3. YOR: Yoruba Bible (Bibeli Mímọ́)
  await buildYorubaBible();

  console.log("\n🎉 All 3 translations downloaded and generated successfully!");
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
