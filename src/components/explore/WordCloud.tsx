import { useMemo, useState, useRef, useEffect } from "react";
import { Cloud } from "lucide-react";

/* ── Arabic Stop Words (expanded with Gulf dialect, media terms) ── */
const STOP_WORDS = new Set([
  // Prepositions & particles
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'بين', 'حتى', 'منذ', 'خلال', 'حول',
  'بعد', 'قبل', 'عند', 'دون', 'فوق', 'تحت', 'أمام', 'وراء', 'ضد',
  'و', 'أو', 'ثم', 'بل', 'لكن', 'ف', 'ب', 'ل', 'ك',
  // Pronouns
  'هو', 'هي', 'هم', 'هن', 'أنا', 'أنت', 'أنتم', 'نحن', 'أنتي',
  'له', 'لها', 'لهم', 'لنا', 'لك', 'لكم',
  // Verbs
  'كان', 'يكون', 'يمكن', 'كانت', 'كانوا', 'يكن',
  'لم', 'لن', 'قد', 'سوف', 'سـ',
  // Demonstratives
  'هذا', 'هذه', 'ذلك', 'تلك', 'هؤلاء', 'أولئك',
  // Relative pronouns
  'التي', 'الذي', 'اللذان', 'اللتان', 'الذين', 'اللاتي', 'اللواتي',
  // Quantifiers & misc
  'كل', 'بعض', 'غير', 'ما', 'لا', 'إن', 'أن', 'إذا', 'كما', 'مثل',
  'أيضا', 'أيضاً', 'فقط', 'جدا', 'جداً', 'حيث', 'ليس', 'ليست',
  'أي', 'عبر', 'ضمن', 'نحو', 'لدى', 'لدي', 'أكثر', 'أقل',
  // Interjections
  'يا', 'آه', 'آخ', 'إلخ', 'الخ',
  // Religious
  'الله', 'سبحان', 'ماشاء', 'ماشاءالله', 'الحمدلله', 'إنشاء', 'انشاء',
  'اللهم', 'صلى', 'وسلم', 'عليه', 'رضي', 'عنه', 'عنها',
  // Courtesy
  'شكرا', 'شكراً', 'جزاك', 'جزاكم', 'بارك', 'يارب', 'آمين', 'امين',
  // Numbers
  'اول', 'أول', 'ثاني', 'واحد', 'اثنين',
  '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩',
  // English
  'the', 'is', 'are', 'was', 'and', 'or', 'for', 'not', 'you', 'this',
  'that', 'with', 'have', 'from', 'they', 'been', 'has', 'will',
  // Brand
  'ثمانية', 'thmanyah', 'thmanyahsports', 'thmanyahexit', 'thmanyahliving', 'radiothmanyah',
  // Gulf dialect
  'مو', 'بس', 'اللي', 'الي', 'اني', 'انه', 'عشان', 'ليه', 'كذا', 'فيه', 'فيها',
  'مره', 'اكثر', 'كلش', 'والله', 'يعني', 'طيب', 'خلاص', 'ابد',
  'وش', 'ايش', 'هالشي', 'كثير', 'حق', 'عاد', 'يعني', 'شوي', 'زين',
  'ابي', 'يبي', 'تبي', 'نبي', 'ودي', 'يبغى', 'لين', 'وين', 'كيف',
  'حلو', 'حلوه', 'يله', 'يلا', 'خلنا', 'قولو', 'صح',
  // Media / YouTube / social
  'فيديو', 'لايك', 'سبسكرايب', 'اشتراك', 'تعليق', 'رد', 'مقطع', 'كليب',
  'حلقة', 'حلقه', 'بودكاست', 'قناة', 'قناه',
]);

const BRAND_COLORS = [
  "#00C17A", "#0072F9", "#F24935", "#FFBC0A", "#8B5CF6",
  "#FF00B7", "#84DBE5", "#FF9172",
];

interface WordItem {
  text: string;
  count: number;  // number of unique comments containing this word
  type: "word" | "bigram";
}

/** Check if word is just repeated letters (e.g. ااااا, ييييي) — excludes هـ (laughter) */
function isRepeatedLetterWord(word: string): boolean {
  const uniqueChars = new Set(word);
  if (uniqueChars.size <= 2 && word.length > 3) {
    // Allow هـ repetitions — they represent laughter
    return !uniqueChars.has('ه');
  }
  return false;
}

/** Normalize هههه variants (ههه, هههههههه, etc.) into one canonical form */
function normalizeWord(word: string): string {
  if (/^ه{3,}$/.test(word)) return 'هههه';
  return word;
}

function cleanText(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}]/gu, '')
    .replace(/[٠-٩0-9]/g, '')
    .replace(/[a-zA-Z]/g, '')
    .replace(/#\S+/g, '')
    .replace(/@\S+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function analyzeComments(texts: string[]): WordItem[] {
  // Count unique comments containing each word/bigram
  const wordCommentCount: Record<string, number> = {};
  const bigramCommentCount: Record<string, number> = {};

  for (const text of texts) {
    const cleaned = cleanText(text);
    const words = cleaned.split(' ')
      .filter(w => w.length > 1 && !STOP_WORDS.has(w) && !isRepeatedLetterWord(w))
      .map(normalizeWord);

    // Deduplicate within this comment
    const uniqueWords = new Set(words);
    for (const word of uniqueWords) {
      wordCommentCount[word] = (wordCommentCount[word] || 0) + 1;
    }

    const uniqueBigrams = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) {
      uniqueBigrams.add(`${words[i]} ${words[i + 1]}`);
    }
    for (const bigram of uniqueBigrams) {
      bigramCommentCount[bigram] = (bigramCommentCount[bigram] || 0) + 1;
    }
  }

  const combined: WordItem[] = [];

  for (const [word, count] of Object.entries(wordCommentCount)) {
    if (count >= 3) combined.push({ text: word, count, type: "word" });
  }
  for (const [bigram, count] of Object.entries(bigramCommentCount)) {
    if (count >= 2) combined.push({ text: bigram, count, type: "bigram" });
  }

  combined.sort((a, b) => b.count - a.count);
  return combined.slice(0, 80);
}

/* ── Spiral placement algorithm ── */
interface PlacedWord {
  text: string;
  count: number;
  type: "word" | "bigram";
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  width: number;
  height: number;
}

function computeLayout(
  words: WordItem[],
  containerWidth: number,
  containerHeight: number,
  customColors?: string[],
): PlacedWord[] {
  if (words.length === 0 || containerWidth <= 0 || containerHeight <= 0) return [];

  const maxCount = words[0]?.count || 1;
  const minCount = words[words.length - 1]?.count || 1;
  const minSize = 12;
  const maxSize = 48;
  const placed: PlacedWord[] = [];

  // Estimate text dimensions using font size
  const estimateWidth = (text: string, fontSize: number) => {
    // Arabic characters are roughly 0.6x fontSize wide
    return text.length * fontSize * 0.55 + 8;
  };

  const estimateHeight = (fontSize: number) => fontSize * 1.3;

  const collides = (x: number, y: number, w: number, h: number) => {
    for (const p of placed) {
      if (
        x < p.x + p.width &&
        x + w > p.x &&
        y < p.y + p.height &&
        y + h > p.y
      ) {
        return true;
      }
    }
    return false;
  };

  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const ratio = maxCount === minCount ? 1 : (w.count - minCount) / (maxCount - minCount);
    const fontSize = minSize + (maxSize - minSize) * Math.pow(ratio, 0.7);
    const fontWeight = ratio > 0.5 ? 700 : ratio > 0.2 ? 600 : 400;
    const palette = customColors || BRAND_COLORS;
    const color = palette[i % palette.length];
    const wordWidth = estimateWidth(w.text, fontSize);
    const wordHeight = estimateHeight(fontSize);

    // Spiral placement: try positions along Archimedean spiral
    let didPlace = false;
    const spiralStep = 0.3;
    const radiusStep = 0.5;

    for (let t = 0; t < 600; t++) {
      const angle = spiralStep * t;
      const radius = radiusStep * t;
      const x = centerX + radius * Math.cos(angle) - wordWidth / 2;
      const y = centerY + radius * Math.sin(angle) - wordHeight / 2;

      // Bounds check
      if (x < 0 || y < 0 || x + wordWidth > containerWidth || y + wordHeight > containerHeight) {
        continue;
      }

      if (!collides(x, y, wordWidth, wordHeight)) {
        placed.push({
          text: w.text,
          count: w.count,
          type: w.type,
          x,
          y,
          fontSize,
          fontWeight,
          color,
          width: wordWidth,
          height: wordHeight,
        });
        didPlace = true;
        break;
      }
    }

    if (!didPlace) {
      // Skip words that can't be placed
      continue;
    }
  }

  return placed;
}

/* ── Component ── */
interface Props {
  texts: string[];
  isLoading: boolean;
  onWordClick?: (word: string) => void;
  colors?: string[];
  title?: string;
  containerBg?: string;
  height?: number;
}

function toArabicNum(n: number): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).replace(/[0-9]/g, (d) => arabicDigits[+d]);
}

export default function WordCloud({ texts, isLoading, onWordClick, colors, title, containerBg, height }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const CONTAINER_HEIGHT = height || 400;

  const words = useMemo(() => analyzeComments(texts), [texts]);

  // Measure container width with multiple fallbacks
  useEffect(() => {
    if (!expanded || !containerRef.current) return;

    const measure = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.getBoundingClientRect().width;
      if (w > 0) setContainerWidth(w);
      return w;
    };

    // Try immediately
    const w = measure();

    // ResizeObserver for ongoing changes
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        if (newW > 0) setContainerWidth(newW);
      }
    });
    observer.observe(containerRef.current);

    // Fallback retries if initial measurement was 0 (CSS transition not complete)
    let timers: ReturnType<typeof setTimeout>[] = [];
    if (!w || w <= 0) {
      timers = [
        setTimeout(measure, 50),
        setTimeout(measure, 200),
        setTimeout(measure, 500),
      ];
    }

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [expanded]);

  const placedWords = useMemo(
    () => computeLayout(words, containerWidth, CONTAINER_HEIGHT, colors),
    [words, containerWidth, CONTAINER_HEIGHT, colors]
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/40 p-4">
        <h4 className="text-[12px] font-display font-bold text-foreground/70 mb-3">{title || "سحابة الكلمات"}</h4>
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-pulse flex flex-wrap gap-2 justify-center p-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-muted/20"
                style={{
                  width: 40 + Math.random() * 60,
                  height: 16 + Math.random() * 16,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (words.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border/40 p-4" style={containerBg ? { backgroundColor: containerBg } : undefined}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-right mb-3"
      >
        <Cloud className="w-3.5 h-3.5 text-muted-foreground/40" />
        <h4 className="text-[12px] font-display font-bold text-foreground/70 flex-1">{title || "سحابة الكلمات"}</h4>
        <svg
          className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden"
          style={{ minHeight: CONTAINER_HEIGHT, height: CONTAINER_HEIGHT }}
        >
          {placedWords.map((w, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <button
                key={w.text}
                onClick={() => onWordClick?.(w.text)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="absolute cursor-pointer transition-transform duration-150 select-none"
                style={{
                  left: w.x,
                  top: w.y,
                  fontSize: `${w.fontSize}px`,
                  fontWeight: w.fontWeight,
                  lineHeight: 1.3,
                  color: w.color,
                  opacity: isHovered ? 1 : 0.85,
                  transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                  transformOrigin: 'center center',
                  whiteSpace: 'nowrap',
                }}
              >
                {w.text}
                {isHovered && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1a1a2e] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xl border border-white/10 z-50 pointer-events-none">
                    ظهرت في {toArabicNum(w.count)} تعليق
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
