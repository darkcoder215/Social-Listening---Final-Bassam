import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cloud, X, ExternalLink, Filter } from 'lucide-react';
import { TweetSortControls, sortTweets, type SortKey, type SortDirection, type TweetWithEngagement } from './TweetSortControls';

interface Tweet extends TweetWithEngagement {}

interface WordCloudProps {
  tweets: Tweet[];
}

/* ── Arabic Stop Words ── */
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
  'وش', 'ايش', 'هالشي', 'كثير', 'حق', 'عاد', 'شوي', 'زين',
  'ابي', 'يبي', 'تبي', 'نبي', 'ودي', 'يبغى', 'لين', 'وين', 'كيف',
  'حلو', 'حلوه', 'يله', 'يلا', 'خلنا', 'قولو', 'صح',
  // Media / YouTube / social
  'فيديو', 'لايك', 'سبسكرايب', 'اشتراك', 'تعليق', 'رد', 'مقطع', 'كليب',
  'حلقة', 'حلقه', 'بودكاست', 'قناة', 'قناه',
  // Meltwater / X specific
  'QT', 'RT', 'rt', 'qt', 'via', 'amp', 'retweet',
]);

function cleanText(text: string): string {
  return text
    // Remove emoji
    .replace(/[\u{1F600}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{20E3}]/gu, '')
    // Remove numbers
    .replace(/[٠-٩0-9]/g, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    .replace(/t\.co\/\S+/g, '')
    .replace(/www\.\S+/g, '')
    // Remove mentions and hashtags
    .replace(/#\S+/g, '')
    .replace(/@\S+/g, '')
    // Remove English
    .replace(/[a-zA-Z]/g, '')
    // Remove non-Arabic
    .replace(/[^\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRepeatedLetterWord(word: string): boolean {
  const uniqueChars = new Set(word);
  if (uniqueChars.size <= 2 && word.length > 3) {
    return !uniqueChars.has('ه');
  }
  return false;
}

function normalizeWord(word: string): string {
  if (/^ه{3,}$/.test(word)) return 'هههه';
  return word;
}

function extractWords(text: string): string[] {
  const cleaned = cleanText(text);
  return cleaned.split(' ')
    .filter(w => w.length > 1 && !STOP_WORDS.has(w) && !isRepeatedLetterWord(w))
    .map(normalizeWord);
}

const CLOUD_COLORS = [
  'rgba(239,68,68,', // red
  'rgba(249,115,22,', // orange
  'rgba(234,179,8,',  // yellow
  'rgba(34,197,94,',  // green
  'rgba(59,130,246,', // blue
  'rgba(168,85,247,', // purple
  'rgba(236,72,153,', // pink
  'rgba(20,184,166,', // teal
];

export const WordCloud = ({ tweets }: WordCloudProps) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('reach');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Extract words from tweet TEXT (not keywords column)
  const keywordStats = useMemo(() => {
    const stats: Record<string, { count: number; reach: number; tweets: Tweet[] }> = {};
    const filteredTweets = sentimentFilter ? tweets.filter(t => t.sentiment === sentimentFilter) : tweets;

    for (const tweet of filteredTweets) {
      // Per-tweet dedup: count each word once per tweet
      const words = extractWords(tweet.text);
      const uniqueWords = new Set(words);
      for (const word of uniqueWords) {
        if (!stats[word]) stats[word] = { count: 0, reach: 0, tweets: [] };
        stats[word].count++;
        stats[word].reach += tweet.reach;
        stats[word].tweets.push(tweet);
      }

      // Bigrams (also per-tweet dedup)
      const uniqueBigrams = new Set<string>();
      for (let i = 0; i < words.length - 1; i++) {
        uniqueBigrams.add(`${words[i]} ${words[i + 1]}`);
      }
      for (const bigram of uniqueBigrams) {
        if (!stats[bigram]) stats[bigram] = { count: 0, reach: 0, tweets: [] };
        stats[bigram].count++;
        stats[bigram].reach += tweet.reach;
        stats[bigram].tweets.push(tweet);
      }
    }

    // Filter: words must appear in at least 2 tweets, bigrams at least 2
    for (const [key, val] of Object.entries(stats)) {
      if (val.count < 2) delete stats[key];
    }

    return stats;
  }, [tweets, sentimentFilter]);

  const sortedWords = useMemo(() => {
    return Object.entries(keywordStats)
      .map(([word, stats]) => ({ word, ...stats, pulse: stats.reach / stats.count }))
      .sort((a, b) => b.reach - a.reach);
  }, [keywordStats]);

  const maxReach = sortedWords[0]?.reach || 1;

  const getWordStyle = (reach: number, index: number) => {
    const ratio = reach / maxReach;
    const fontSize = Math.max(14, Math.min(48, ratio * 52 + 12));
    const fontWeight = ratio > 0.4 ? 900 : ratio > 0.2 ? 700 : ratio > 0.1 ? 600 : 400;
    const colorBase = CLOUD_COLORS[index % CLOUD_COLORS.length];
    const opacity = Math.max(0.6, ratio);
    const rotation = ((index * 7) % 5) - 2;

    return {
      fontSize: `${fontSize}px`,
      fontWeight,
      color: `${colorBase}${opacity})`,
      transform: `rotate(${rotation}deg)`,
      padding: `${Math.max(2, ratio * 8)}px ${Math.max(6, ratio * 14)}px`,
      lineHeight: 1.2,
    };
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'إيجابي': return 'bg-green-100 text-green-800 border-green-300';
      case 'سلبي': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-secondary text-gray-800 border-gray-300';
    }
  };

  const sortedExpandedTweets = useMemo(() => {
    if (!selectedWord || !keywordStats[selectedWord]) return [];
    return sortTweets(keywordStats[selectedWord].tweets, sortKey, sortDirection);
  }, [selectedWord, keywordStats, sortKey, sortDirection]);

  return (
    <div className="space-y-4">
      <Card className="border border-border overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              سحابة الكلمات (حسب النبض)
            </CardTitle>
            <div className="flex gap-2">
              <Filter className="h-4 w-4 self-center text-muted-foreground" />
              {['إيجابي', 'سلبي', 'محايد'].map(s => (
                <Button
                  key={s}
                  variant={sentimentFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSentimentFilter(sentimentFilter === s ? null : s)}
                  className={`text-xs ${sentimentFilter === s ? 'bg-foreground text-primary-foreground' : ''}`}
                >
                  {s}
                </Button>
              ))}
              {sentimentFilter && (
                <Button variant="ghost" size="sm" onClick={() => setSentimentFilter(null)} className="text-xs">
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">حجم الكلمة يعكس إجمالي الوصول. اضغط على أي كلمة لعرض التغريدات.</p>
        </CardHeader>
        <CardContent>
          {/* Cloud shape container */}
          <div className="relative mx-auto" style={{ maxWidth: 700 }}>
            {/* Cloud background shape */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(var(--muted)/0.4) 0%, transparent 70%)',
                filter: 'blur(30px)',
                transform: 'scaleX(1.6) scaleY(0.9)',
              }}
            />
            <div className="relative flex flex-wrap items-center justify-center gap-1 py-8 px-4 min-h-[280px]">
              {sortedWords.map(({ word, reach, count }, index) => (
                <button
                  key={word}
                  onClick={() => setSelectedWord(selectedWord === word ? null : word)}
                  className={`cursor-pointer transition-all duration-200 hover:scale-125 rounded-2xl hover:bg-foreground/5 ${
                    selectedWord === word ? 'ring-2 ring-foreground bg-foreground/10 scale-110' : ''
                  }`}
                  style={getWordStyle(reach, index)}
                  title={`${word}: ${count}× | وصول: ${reach.toLocaleString()}`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-foreground/70" /> وصول عالي
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-foreground/30" /> وصول متوسط
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-foreground/10" /> وصول منخفض
            </span>
          </div>
        </CardContent>
      </Card>

      {selectedWord && keywordStats[selectedWord] && (
        <Card className="border border-border bg-blue-50 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                تغريدات تحتوي على "{selectedWord}"
                <Badge className="bg-foreground text-primary-foreground">{keywordStats[selectedWord].tweets.length}</Badge>
                <Badge variant="outline">{(keywordStats[selectedWord].reach / 1000).toFixed(1)}K وصول</Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedWord(null)} className="border border-border">
                <X className="h-4 w-4 ml-1" /> إغلاق
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TweetSortControls activeSort={sortKey} onSortChange={setSortKey} direction={sortDirection} onDirectionChange={setSortDirection} />
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {sortedExpandedTweets.map(tweet => (
                <div key={tweet.id} className="p-4 bg-card border-2 rounded-2xl hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-bold">{tweet.author}</p>
                      <p className="text-sm mt-1">{tweet.text}</p>
                      {tweet.engagement && (
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>❤️ {tweet.engagement.likes}</span>
                          <span>🔁 {tweet.engagement.retweets}</span>
                          <span>💬 {tweet.engagement.replies}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${getSentimentColor(tweet.sentiment)} border text-xs`}>{tweet.sentiment}</Badge>
                      <span className="text-xs text-muted-foreground font-bold">{tweet.reach.toLocaleString()} وصول</span>
                      <a href={`https://twitter.com/${tweet.author.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" /> عرض
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
