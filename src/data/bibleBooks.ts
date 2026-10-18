export interface BibleBook {
  id: number;
  name: string;
  testament: 'OT' | 'NT';
  chapters: number;
  aliases: string[];
  popularVerses: string[];
}

export interface BibleSuggestion {
  text: string;
  type: 'book' | 'chapter' | 'verse' | 'version';
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface BibleVersionOption {
  id: string;
  name: string;
  category: string;
}

export const AVAILABLE_BIBLE_VERSIONS: BibleVersionOption[] = [
  { id: 'KJV', name: 'King James Version', category: 'Classic' },
  { id: 'NKJV', name: 'New King James Version', category: 'Modern' },
  { id: 'NIV', name: 'New International Version', category: 'Modern' },
  { id: 'ESV', name: 'English Standard Version', category: 'Modern' },
  { id: 'NLT', name: 'New Living Translation', category: 'Modern' },
  { id: 'NASB', name: 'New American Standard', category: 'Modern' },
  { id: 'AMP', name: 'Amplified Bible', category: 'Study' },
  { id: 'CSB', name: 'Christian Standard Bible', category: 'Modern' },
  { id: 'WEB', name: 'World English Bible', category: 'Public' },
  { id: 'ASV', name: 'American Standard Version', category: 'Classic' },
  { id: 'RSV', name: 'Revised Standard Version', category: 'Classic' },
  { id: 'MSG', name: 'The Message', category: 'Paraphrase' },
  { id: 'NIRV', name: "New International Reader's Version", category: 'Modern' },
  { id: 'BSB', name: 'Berean Standard Bible', category: 'Study' },
  { id: 'TLV', name: 'Tree of Life Version', category: 'Messianic' },
  { id: 'CEB', name: 'Common English Bible', category: 'Modern' },
  { id: 'BBE', name: 'Bible in Basic English', category: 'Basic' },
  { id: 'DARBY', name: 'Darby Bible', category: 'Classic' },
  { id: 'DRA', name: 'Douay-Rheims', category: 'Catholic' },
  { id: 'YLT', name: "Young's Literal Translation", category: 'Literal' },
  { id: 'GNT', name: 'Good News Translation', category: 'Modern' },
  { id: 'TPT', name: 'The Passion Translation', category: 'Devotional' },
  { id: 'YOR', name: 'Bibeli Mímọ́ (Yoruba)', category: 'African' },
];

export const BIBLE_BOOKS: BibleBook[] = [
  // --- Old Testament (39 Books) ---
  {
    id: 1,
    name: 'Genesis',
    testament: 'OT',
    chapters: 50,
    aliases: ['gen', 'ge', 'gn'],
    popularVerses: ['Genesis 1:1', 'Genesis 1:1-3', 'Genesis 1:26-27', 'Genesis 12:1-3', 'Genesis 50:20'],
  },
  {
    id: 2,
    name: 'Exodus',
    testament: 'OT',
    chapters: 40,
    aliases: ['exo', 'ex', 'exod'],
    popularVerses: ['Exodus 3:14', 'Exodus 14:14', 'Exodus 20:1-17', 'Exodus 33:14'],
  },
  {
    id: 3,
    name: 'Leviticus',
    testament: 'OT',
    chapters: 27,
    aliases: ['lev', 'le', 'lv'],
    popularVerses: ['Leviticus 19:2', 'Leviticus 19:18'],
  },
  {
    id: 4,
    name: 'Numbers',
    testament: 'OT',
    chapters: 36,
    aliases: ['num', 'nu', 'nm', 'nb'],
    popularVerses: ['Numbers 6:24-26', 'Numbers 23:19'],
  },
  {
    id: 5,
    name: 'Deuteronomy',
    testament: 'OT',
    chapters: 34,
    aliases: ['deut', 'dt', 'de'],
    popularVerses: ['Deuteronomy 6:4-5', 'Deuteronomy 31:6', 'Deuteronomy 31:8'],
  },
  {
    id: 6,
    name: 'Joshua',
    testament: 'OT',
    chapters: 24,
    aliases: ['josh', 'jos', 'jsh'],
    popularVerses: ['Joshua 1:9', 'Joshua 24:15'],
  },
  {
    id: 7,
    name: 'Judges',
    testament: 'OT',
    chapters: 21,
    aliases: ['judg', 'jdg', 'jg', 'jdgs'],
    popularVerses: ['Judges 5:31'],
  },
  {
    id: 8,
    name: 'Ruth',
    testament: 'OT',
    chapters: 4,
    aliases: ['rth', 'ru'],
    popularVerses: ['Ruth 1:16-17'],
  },
  {
    id: 9,
    name: '1 Samuel',
    testament: 'OT',
    chapters: 31,
    aliases: ['1 samuel', '1samuel', '1 sam', '1sam', '1 s', '1s', '1sa', '1 sm'],
    popularVerses: ['1 Samuel 16:7', '1 Samuel 17:45-47'],
  },
  {
    id: 10,
    name: '2 Samuel',
    testament: 'OT',
    chapters: 24,
    aliases: ['2 samuel', '2samuel', '2 sam', '2sam', '2 s', '2s', '2sa', '2 sm'],
    popularVerses: ['2 Samuel 7:22', '2 Samuel 22:2-4'],
  },
  {
    id: 11,
    name: '1 Kings',
    testament: 'OT',
    chapters: 22,
    aliases: ['1 kings', '1kings', '1 kgs', '1kgs', '1 k', '1k', '1ki'],
    popularVerses: ['1 Kings 3:9', '1 Kings 18:38-39'],
  },
  {
    id: 12,
    name: '2 Kings',
    testament: 'OT',
    chapters: 25,
    aliases: ['2 kings', '2kings', '2 kgs', '2kgs', '2 k', '2k', '2ki'],
    popularVerses: ['2 Kings 6:16-17'],
  },
  {
    id: 13,
    name: '1 Chronicles',
    testament: 'OT',
    chapters: 29,
    aliases: ['1 chronicles', '1chronicles', '1 chr', '1chr', '1 ch', '1ch'],
    popularVerses: ['1 Chronicles 16:11', '1 Chronicles 16:34', '1 Chronicles 29:11-12'],
  },
  {
    id: 14,
    name: '2 Chronicles',
    testament: 'OT',
    chapters: 36,
    aliases: ['2 chronicles', '2chronicles', '2 chr', '2chr', '2 ch', '2ch'],
    popularVerses: ['2 Chronicles 7:14', '2 Chronicles 20:15'],
  },
  {
    id: 15,
    name: 'Ezra',
    testament: 'OT',
    chapters: 10,
    aliases: ['ezr'],
    popularVerses: ['Ezra 7:10'],
  },
  {
    id: 16,
    name: 'Nehemiah',
    testament: 'OT',
    chapters: 13,
    aliases: ['neh', 'ne'],
    popularVerses: ['Nehemiah 8:10'],
  },
  {
    id: 17,
    name: 'Esther',
    testament: 'OT',
    chapters: 10,
    aliases: ['est', 'esth', 'es'],
    popularVerses: ['Esther 4:14'],
  },
  {
    id: 18,
    name: 'Job',
    testament: 'OT',
    chapters: 42,
    aliases: ['jb'],
    popularVerses: ['Job 19:25', 'Job 42:2'],
  },
  {
    id: 19,
    name: 'Psalms',
    testament: 'OT',
    chapters: 150,
    aliases: ['psalm', 'psalms', 'psa', 'pss', 'ps'],
    popularVerses: [
      'Psalm 23:1-6',
      'Psalm 91:1-4',
      'Psalm 100:1-5',
      'Psalm 103:1-5',
      'Psalm 119:105',
      'Psalm 121:1-8',
      'Psalm 139:13-14',
      'Psalm 150:1-6'
    ],
  },
  {
    id: 20,
    name: 'Proverbs',
    testament: 'OT',
    chapters: 31,
    aliases: ['prov', 'pro', 'prv', 'pr'],
    popularVerses: ['Proverbs 3:5-6', 'Proverbs 4:23', 'Proverbs 18:10', 'Proverbs 31:25-30'],
  },
  {
    id: 21,
    name: 'Ecclesiastes',
    testament: 'OT',
    chapters: 12,
    aliases: ['eccles', 'eccl', 'ecc', 'ec'],
    popularVerses: ['Ecclesiastes 3:1-8', 'Ecclesiastes 12:13'],
  },
  {
    id: 22,
    name: 'Song of Solomon',
    testament: 'OT',
    chapters: 8,
    aliases: ['song of songs', 'song', 'sos'],
    popularVerses: ['Song of Solomon 2:4', 'Song of Solomon 8:6-7'],
  },
  {
    id: 23,
    name: 'Isaiah',
    testament: 'OT',
    chapters: 66,
    aliases: ['isa', 'is'],
    popularVerses: ['Isaiah 9:6', 'Isaiah 40:29-31', 'Isaiah 41:10', 'Isaiah 53:4-5', 'Isaiah 55:8-9'],
  },
  {
    id: 24,
    name: 'Jeremiah',
    testament: 'OT',
    chapters: 52,
    aliases: ['jer', 'je', 'jr'],
    popularVerses: ['Jeremiah 29:11', 'Jeremiah 33:3'],
  },
  {
    id: 25,
    name: 'Lamentations',
    testament: 'OT',
    chapters: 5,
    aliases: ['lam', 'la'],
    popularVerses: ['Lamentations 3:22-24'],
  },
  {
    id: 26,
    name: 'Ezekiel',
    testament: 'OT',
    chapters: 48,
    aliases: ['ezek', 'eze', 'ezk'],
    popularVerses: ['Ezekiel 36:26', 'Ezekiel 37:1-14'],
  },
  {
    id: 27,
    name: 'Daniel',
    testament: 'OT',
    chapters: 12,
    aliases: ['dan', 'da', 'dn'],
    popularVerses: ['Daniel 3:17-18', 'Daniel 12:3'],
  },
  {
    id: 28,
    name: 'Hosea',
    testament: 'OT',
    chapters: 14,
    aliases: ['hos', 'ho'],
    popularVerses: ['Hosea 6:3'],
  },
  {
    id: 29,
    name: 'Joel',
    testament: 'OT',
    chapters: 3,
    aliases: ['jl', 'joe'],
    popularVerses: ['Joel 2:28-29'],
  },
  {
    id: 30,
    name: 'Amos',
    testament: 'OT',
    chapters: 9,
    aliases: ['am'],
    popularVerses: ['Amos 5:24'],
  },
  {
    id: 31,
    name: 'Obadiah',
    testament: 'OT',
    chapters: 1,
    aliases: ['obad', 'oba', 'ob'],
    popularVerses: ['Obadiah 1:21'],
  },
  {
    id: 32,
    name: 'Jonah',
    testament: 'OT',
    chapters: 4,
    aliases: ['jon', 'jnh'],
    popularVerses: ['Jonah 2:9'],
  },
  {
    id: 33,
    name: 'Micah',
    testament: 'OT',
    chapters: 7,
    aliases: ['mic', 'mc'],
    popularVerses: ['Micah 6:8', 'Micah 7:18-19'],
  },
  {
    id: 34,
    name: 'Nahum',
    testament: 'OT',
    chapters: 3,
    aliases: ['nah', 'na'],
    popularVerses: ['Nahum 1:7'],
  },
  {
    id: 35,
    name: 'Habakkuk',
    testament: 'OT',
    chapters: 3,
    aliases: ['hab', 'hb'],
    popularVerses: ['Habakkuk 2:4', 'Habakkuk 3:17-19'],
  },
  {
    id: 36,
    name: 'Zephaniah',
    testament: 'OT',
    chapters: 3,
    aliases: ['zeph', 'zep', 'zp'],
    popularVerses: ['Zephaniah 3:17'],
  },
  {
    id: 37,
    name: 'Haggai',
    testament: 'OT',
    chapters: 2,
    aliases: ['hag', 'hg'],
    popularVerses: ['Haggai 2:9'],
  },
  {
    id: 38,
    name: 'Zechariah',
    testament: 'OT',
    chapters: 14,
    aliases: ['zech', 'zec', 'zc'],
    popularVerses: ['Zechariah 4:6'],
  },
  {
    id: 39,
    name: 'Malachi',
    testament: 'OT',
    chapters: 4,
    aliases: ['mal', 'ml'],
    popularVerses: ['Malachi 3:10', 'Malachi 4:2'],
  },

  // --- New Testament (27 Books) ---
  {
    id: 40,
    name: 'Matthew',
    testament: 'NT',
    chapters: 28,
    aliases: ['matt', 'mat', 'mt'],
    popularVerses: [
      'Matthew 5:14-16',
      'Matthew 6:9-13',
      'Matthew 6:33',
      'Matthew 11:28-30',
      'Matthew 28:18-20'
    ],
  },
  {
    id: 41,
    name: 'Mark',
    testament: 'NT',
    chapters: 16,
    aliases: ['mrk', 'mar', 'mk'],
    popularVerses: ['Mark 10:45', 'Mark 11:24', 'Mark 16:15'],
  },
  {
    id: 42,
    name: 'Luke',
    testament: 'NT',
    chapters: 24,
    aliases: ['luk', 'lu', 'lk'],
    popularVerses: ['Luke 1:37', 'Luke 2:10-14', 'Luke 10:27', 'Luke 19:10'],
  },
  {
    id: 43,
    name: 'John',
    testament: 'NT',
    chapters: 21,
    aliases: ['jhn', 'jn', 'joh'],
    popularVerses: [
      'John 1:1-5',
      'John 1:14',
      'John 3:16-17',
      'John 10:10',
      'John 14:6',
      'John 14:27',
      'John 15:5'
    ],
  },
  {
    id: 44,
    name: 'Acts',
    testament: 'NT',
    chapters: 28,
    aliases: ['act', 'ac'],
    popularVerses: ['Acts 1:8', 'Acts 2:1-4', 'Acts 2:38', 'Acts 4:12', 'Acts 16:31'],
  },
  {
    id: 45,
    name: 'Romans',
    testament: 'NT',
    chapters: 16,
    aliases: ['rom', 'ro', 'rm'],
    popularVerses: [
      'Romans 3:23',
      'Romans 5:8',
      'Romans 6:23',
      'Romans 8:1-2',
      'Romans 8:28-31',
      'Romans 8:38-39',
      'Romans 10:9-10',
      'Romans 12:1-2'
    ],
  },
  {
    id: 46,
    name: '1 Corinthians',
    testament: 'NT',
    chapters: 16,
    aliases: ['1 corinthians', '1corinthians', '1 cor', '1cor', '1 co', '1co'],
    popularVerses: ['1 Corinthians 13:4-8', '1 Corinthians 13:13', '1 Corinthians 15:57'],
  },
  {
    id: 47,
    name: '2 Corinthians',
    testament: 'NT',
    chapters: 13,
    aliases: ['2 corinthians', '2corinthians', '2 cor', '2cor', '2 co', '2co'],
    popularVerses: ['2 Corinthians 5:17', '2 Corinthians 5:21', '2 Corinthians 12:9'],
  },
  {
    id: 48,
    name: 'Galatians',
    testament: 'NT',
    chapters: 6,
    aliases: ['gal', 'ga'],
    popularVerses: ['Galatians 2:20', 'Galatians 5:22-23'],
  },
  {
    id: 49,
    name: 'Ephesians',
    testament: 'NT',
    chapters: 6,
    aliases: ['eph', 'ep'],
    popularVerses: ['Ephesians 2:8-10', 'Ephesians 3:20-21', 'Ephesians 6:10-18'],
  },
  {
    id: 50,
    name: 'Philippians',
    testament: 'NT',
    chapters: 4,
    aliases: ['phil', 'php', 'pp'],
    popularVerses: ['Philippians 4:4-7', 'Philippians 4:8', 'Philippians 4:13', 'Philippians 4:19'],
  },
  {
    id: 51,
    name: 'Colossians',
    testament: 'NT',
    chapters: 4,
    aliases: ['col', 'co'],
    popularVerses: ['Colossians 1:16-17', 'Colossians 3:12-14', 'Colossians 3:23'],
  },
  {
    id: 52,
    name: '1 Thessalonians',
    testament: 'NT',
    chapters: 5,
    aliases: ['1 thessalonians', '1thessalonians', '1 thess', '1thess', '1 th', '1th'],
    popularVerses: ['1 Thessalonians 5:16-18'],
  },
  {
    id: 53,
    name: '2 Thessalonians',
    testament: 'NT',
    chapters: 3,
    aliases: ['2 thessalonians', '2thessalonians', '2 thess', '2thess', '2 th', '2th'],
    popularVerses: ['2 Thessalonians 3:3'],
  },
  {
    id: 54,
    name: '1 Timothy',
    testament: 'NT',
    chapters: 6,
    aliases: ['1 timothy', '1timothy', '1 tim', '1tim', '1 ti', '1ti'],
    popularVerses: ['1 Timothy 4:12', '1 Timothy 6:12'],
  },
  {
    id: 55,
    name: '2 Timothy',
    testament: 'NT',
    chapters: 4,
    aliases: ['2 timothy', '2timothy', '2 tim', '2tim', '2 ti', '2ti'],
    popularVerses: ['2 Timothy 1:7', '2 Timothy 3:16-17'],
  },
  {
    id: 56,
    name: 'Titus',
    testament: 'NT',
    chapters: 3,
    aliases: ['tit', 'ti'],
    popularVerses: ['Titus 2:11-12', 'Titus 3:5'],
  },
  {
    id: 57,
    name: 'Philemon',
    testament: 'NT',
    chapters: 1,
    aliases: ['philem', 'phm', 'pm'],
    popularVerses: ['Philemon 1:6'],
  },
  {
    id: 58,
    name: 'Hebrews',
    testament: 'NT',
    chapters: 13,
    aliases: ['heb', 'he'],
    popularVerses: ['Hebrews 4:12', 'Hebrews 11:1', 'Hebrews 11:6', 'Hebrews 12:1-2', 'Hebrews 13:8'],
  },
  {
    id: 59,
    name: 'James',
    testament: 'NT',
    chapters: 5,
    aliases: ['jas', 'jm'],
    popularVerses: ['James 1:2-4', 'James 1:5', 'James 1:22', 'James 4:7-8', 'James 5:16'],
  },
  {
    id: 60,
    name: '1 Peter',
    testament: 'NT',
    chapters: 5,
    aliases: ['1 peter', '1peter', '1 pet', '1pet', '1 pe', '1pe', '1 pt', '1pt'],
    popularVerses: ['1 Peter 2:9', '1 Peter 5:7'],
  },
  {
    id: 61,
    name: '2 Peter',
    testament: 'NT',
    chapters: 3,
    aliases: ['2 peter', '2peter', '2 pet', '2pet', '2 pe', '2pe', '2 pt', '2pt'],
    popularVerses: ['2 Peter 1:3', '2 Peter 3:9'],
  },
  {
    id: 62,
    name: '1 John',
    testament: 'NT',
    chapters: 5,
    aliases: ['1 john', '1john', '1 jhn', '1jhn', '1 jn', '1jn'],
    popularVerses: ['1 John 1:9', '1 John 3:1', '1 John 4:4', '1 John 4:7-8', '1 John 4:18-19'],
  },
  {
    id: 63,
    name: '2 John',
    testament: 'NT',
    chapters: 1,
    aliases: ['2 john', '2john', '2 jhn', '2jhn', '2 jn', '2jn'],
    popularVerses: ['2 John 1:6'],
  },
  {
    id: 64,
    name: '3 John',
    testament: 'NT',
    chapters: 1,
    aliases: ['3 john', '3john', '3 jhn', '3jhn', '3 jn', '3jn'],
    popularVerses: ['3 John 1:2'],
  },
  {
    id: 65,
    name: 'Jude',
    testament: 'NT',
    chapters: 1,
    aliases: ['jud', 'jd'],
    popularVerses: ['Jude 1:24-25'],
  },
  {
    id: 66,
    name: 'Revelation',
    testament: 'NT',
    chapters: 22,
    aliases: ['rev', 're', 'rv', 'apocalypse'],
    popularVerses: ['Revelation 1:8', 'Revelation 3:20', 'Revelation 21:3-4', 'Revelation 22:20'],
  },
];

/**
 * Fast lookup map from lowercase book name or alias to the BibleBook object
 */
export const BIBLE_BOOK_MAP: Record<string, BibleBook> = {};
BIBLE_BOOKS.forEach(book => {
  BIBLE_BOOK_MAP[book.name.toLowerCase()] = book;
  book.aliases.forEach(alias => {
    BIBLE_BOOK_MAP[alias.toLowerCase()] = book;
  });
});

/**
 * Fast helper to find the best BibleBook match for any query or abbreviation
 */
export function findBestBookMatch(input: string): BibleBook | null {
  const clean = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!clean) return null;

  // 1. Direct map lookup (exact book name or alias)
  if (BIBLE_BOOK_MAP[clean]) {
    return BIBLE_BOOK_MAP[clean];
  }

  // 2. Exact prefix match on canonical book name (e.g. "joh" -> "John", "ps" -> "Psalm", "1co" -> "1 Corinthians")
  const exactPrefixBook = BIBLE_BOOKS.find(b => b.name.toLowerCase().startsWith(clean));
  if (exactPrefixBook) return exactPrefixBook;

  // 3. Exact prefix match on alias (e.g. "1co", "gen", "mat", "rom", "rev")
  const exactPrefixAlias = BIBLE_BOOKS.find(b => b.aliases.some(a => a.toLowerCase().startsWith(clean)));
  if (exactPrefixAlias) return exactPrefixAlias;

  // 4. Word boundary match / includes match
  const includesBook = BIBLE_BOOKS.find(b => b.name.toLowerCase().includes(clean));
  if (includesBook) return includesBook;

  return null;
}

/**
 * Generate contextual Bible autocomplete suggestions based on partial user input
 */
export function getBibleSuggestions(
  input: string,
  activeVersion = 'KJV'
): BibleSuggestion[] {
  const query = input.trim();
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions: BibleSuggestion[] = [];

  // Stage 1: Try to parse if input has Book + Chapter (e.g. "John 3", "John 3:", "1 Cor 13", "Psalm 23")
  const parsedMatch = query.match(/^([1-3]?\s*[a-zA-Z\s]+?)\s*(\d+)(?:\s*[:\s]\s*(\d+)?(?:\s*[-–—]\s*(\d+)?)?)?$/);

  if (parsedMatch) {
    const bookPrefix = parsedMatch[1].trim().toLowerCase().replace(/\s+/g, ' ');
    const chapterNum = parseInt(parsedMatch[2], 10);
    const verseStart = parsedMatch[3] ? parseInt(parsedMatch[3], 10) : null;
    const verseEnd = parsedMatch[4] ? parseInt(parsedMatch[4], 10) : null;

    // Look for matching book
    const matchedBook = findBestBookMatch(bookPrefix);

    if (matchedBook) {
      const bName = matchedBook.name;

      if (verseStart !== null) {
        // User typed Book + Chapter + Verse (e.g. "John 3:16" or "John 3:16-18")
        if (verseEnd !== null && verseEnd > verseStart) {
          const rangeRef = `${bName} ${chapterNum}:${verseStart}-${verseEnd}`;
          suggestions.push({
            text: rangeRef,
            type: 'verse',
            label: rangeRef,
            subLabel: `${verseEnd - verseStart + 1} Verses (${matchedBook.testament === 'OT' ? 'Old' : 'New'} Testament)`,
            badge: activeVersion,
          });
        }

        const baseRef = `${bName} ${chapterNum}:${verseStart}`;
        
        // Exact verse
        suggestions.push({
          text: baseRef,
          type: 'verse',
          label: baseRef,
          subLabel: `${matchedBook.testament === 'OT' ? 'Old' : 'New'} Testament`,
          badge: activeVersion,
        });

        // Common 2-3 verse ranges
        suggestions.push({
          text: `${baseRef}-${verseStart + 1}`,
          type: 'verse',
          label: `${baseRef}-${verseStart + 1}`,
          subLabel: '2 Verses',
          badge: activeVersion,
        });

        suggestions.push({
          text: `${baseRef}-${verseStart + 2}`,
          type: 'verse',
          label: `${baseRef}-${verseStart + 2}`,
          subLabel: '3 Verses',
          badge: activeVersion,
        });

        // Version completions
        if (!query.toUpperCase().includes('KJV')) {
          suggestions.push({
            text: `${baseRef} KJV`,
            type: 'version',
            label: `${baseRef} KJV`,
            subLabel: 'King James Version',
            badge: 'KJV',
          });
        }
        if (!query.toUpperCase().includes('NIV')) {
          suggestions.push({
            text: `${baseRef} NIV`,
            type: 'version',
            label: `${baseRef} NIV`,
            subLabel: 'New International Version',
            badge: 'NIV',
          });
        }

        return suggestions.slice(0, 6);
      }

      // User typed Book + Chapter (e.g. "John 3" or "John 3:" or "Psalm 23")
      // 1. Check if this book has popular verses in this chapter (e.g. John 3:16)
      const chapterPopular = matchedBook.popularVerses.filter(pv => pv.startsWith(`${bName} ${chapterNum}:`));
      chapterPopular.forEach(pv => {
        suggestions.push({
          text: pv,
          type: 'verse',
          label: pv,
          subLabel: 'Popular Passage',
          badge: activeVersion,
        });
      });

      // 2. Offer verse 1 starter
      if (!chapterPopular.some(pv => pv.startsWith(`${bName} ${chapterNum}:1`))) {
        suggestions.push({
          text: `${bName} ${chapterNum}:1-5`,
          type: 'verse',
          label: `${bName} ${chapterNum}:1-5`,
          subLabel: 'Passage Starter',
          badge: activeVersion,
        });
        suggestions.push({
          text: `${bName} ${chapterNum}:1`,
          type: 'verse',
          label: `${bName} ${chapterNum}:1`,
          subLabel: 'Verse 1',
          badge: activeVersion,
        });
      }

      // 3. Offer full chapter
      suggestions.push({
        text: `${bName} ${chapterNum}`,
        type: 'chapter',
        label: `${bName} ${chapterNum}`,
        subLabel: `Whole Chapter (${matchedBook.chapters} total in ${bName})`,
        badge: activeVersion,
      });

      return suggestions.slice(0, 6);
    }
  }

  // Stage 2: User is typing a book name or abbreviation (e.g. "j", "jo", "ps", "1co", "rom")
  const matchedBooks: BibleBook[] = [];

  for (const book of BIBLE_BOOKS) {
    const bookLower = book.name.toLowerCase();
    const isNameMatch = bookLower.startsWith(lowerQuery) || bookLower.includes(lowerQuery);
    const isAliasMatch = book.aliases.some(a => a.startsWith(lowerQuery) || a === lowerQuery);

    if (isNameMatch || isAliasMatch) {
      matchedBooks.push(book);
    }
  }

  // Sort exact prefix matches first
  matchedBooks.sort((a, b) => {
    const aPrefix = a.name.toLowerCase().startsWith(lowerQuery);
    const bPrefix = b.name.toLowerCase().startsWith(lowerQuery);
    if (aPrefix && !bPrefix) return -1;
    if (!aPrefix && bPrefix) return 1;
    return a.id - b.id;
  });

  matchedBooks.slice(0, 6).forEach(book => {
    // Offer the canonical book name
    suggestions.push({
      text: book.name,
      type: 'book',
      label: book.name,
      subLabel: `${book.testament === 'OT' ? 'Old' : 'New'} Testament • ${book.chapters} ${book.chapters === 1 ? 'Chapter' : 'Chapters'}`,
      badge: book.aliases[0]?.toUpperCase(),
    });

    // Also include the top popular verse for this book if available
    if (book.popularVerses && book.popularVerses[0]) {
      suggestions.push({
        text: book.popularVerses[0],
        type: 'verse',
        label: book.popularVerses[0],
        subLabel: 'Popular Sermon Verse',
        badge: activeVersion,
      });
    }
  });

  return suggestions.slice(0, 7);
}
