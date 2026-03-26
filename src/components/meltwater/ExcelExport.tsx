import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Tweet {
  id: number;
  text: string;
  author: string;
  sentiment: string;
  emotion: string;
  keywords: string[];
  reach: number;
  engagement: { likes: number; retweets: number; replies: number };
}

interface ExcelExportProps {
  tweets: Tweet[];
  reportDate: string;
}

// Topic categories (mirrored from TopicCategorization)
const topicCategories = [
  { key: 'football', label: 'كرة القدم والمباريات', keywords: ['رونالدو', 'الهلال', 'النصر', 'دوري روشن', 'هدف', 'مراوغة', 'الدوري', 'مباراة', 'فيليكس', 'اسيست', 'ضمك', 'الفيحاء', 'VAR', 'الحكم'] },
  { key: 'broadcast', label: 'البث والنقل التقني', keywords: ['بث', 'نقل', 'تقطيع', 'كاميرات', 'beIN', '4K', 'IPTV', 'قناة ثمانية', 'لقطة'] },
  { key: 'bias', label: 'اتهامات التحيز', keywords: ['تحيز', 'هلالية', 'ابومالح', 'أبو مالح', 'إخفاء', 'شعبية', 'تطبل', 'استغلال'] },
  { key: 'content', label: 'المحتوى التعليمي', keywords: ['اليمن', 'تاريخي', 'توثيقي', 'شرح', 'حلقة', 'سرد', 'إنتاج', 'جودة'] },
  { key: 'commentary', label: 'التعليق والمعلقين', keywords: ['فارس عوض', 'راب', 'معلق', 'تعليق'] },
  { key: 'other', label: 'أخرى', keywords: [] }
];

const THAMANYAH_KEYWORDS = ['ثمانية', 'thamanyah', 'قناة ثمانية', 'بودكاست', 'تلفاز11', 'telfaz11'];

const categorizeTweet = (text: string, keywords: string[]): string => {
  const lower = text.toLowerCase();
  const lowerKw = keywords.map(k => k.toLowerCase());
  for (const cat of topicCategories) {
    if (cat.key === 'other') continue;
    if (cat.keywords.some(k => lower.includes(k.toLowerCase()) || lowerKw.some(kw => kw.includes(k.toLowerCase())))) {
      return cat.label;
    }
  }
  return 'أخرى';
};

const isThamanyah = (t: Tweet) => {
  const text = t.text.toLowerCase();
  return THAMANYAH_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
};

export const ExcelExport = ({ tweets, reportDate }: ExcelExportProps) => {
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const total = tweets.length;
    const totalReach = tweets.reduce((s, t) => s + t.reach, 0);
    const totalLikes = tweets.reduce((s, t) => s + t.engagement.likes, 0);
    const totalRetweets = tweets.reduce((s, t) => s + t.engagement.retweets, 0);
    const totalReplies = tweets.reduce((s, t) => s + t.engagement.replies, 0);
    const totalEngagement = totalLikes + totalRetweets + totalReplies;

    // ───── Sheet 1: Dashboard Summary ─────
    const summaryData = [
      { 'المؤشر': 'تاريخ التقرير', 'القيمة': reportDate, 'النسبة': '' },
      { 'المؤشر': 'إجمالي التغريدات', 'القيمة': total, 'النسبة': '100%' },
      { 'المؤشر': 'إجمالي الوصول', 'القيمة': totalReach, 'النسبة': '' },
      { 'المؤشر': 'متوسط الوصول لكل تغريدة', 'القيمة': Math.round(totalReach / total), 'النسبة': '' },
      { 'المؤشر': 'إجمالي التفاعل', 'القيمة': totalEngagement, 'النسبة': '' },
      { 'المؤشر': 'إجمالي الإعجابات', 'القيمة': totalLikes, 'النسبة': '' },
      { 'المؤشر': 'إجمالي إعادات التغريد', 'القيمة': totalRetweets, 'النسبة': '' },
      { 'المؤشر': 'إجمالي الردود', 'القيمة': totalReplies, 'النسبة': '' },
      { 'المؤشر': 'متوسط التفاعل لكل تغريدة', 'القيمة': Math.round(totalEngagement / total), 'النسبة': '' },
      { 'المؤشر': '', 'القيمة': '', 'النسبة': '' },
      { 'المؤشر': '--- المشاعر ---', 'القيمة': '', 'النسبة': '' },
    ];
    const positive = tweets.filter(t => t.sentiment === 'إيجابي').length;
    const negative = tweets.filter(t => t.sentiment === 'سلبي').length;
    const neutral = tweets.filter(t => t.sentiment === 'محايد').length;
    summaryData.push(
      { 'المؤشر': 'إيجابي', 'القيمة': positive, 'النسبة': `${((positive / total) * 100).toFixed(1)}%` },
      { 'المؤشر': 'سلبي', 'القيمة': negative, 'النسبة': `${((negative / total) * 100).toFixed(1)}%` },
      { 'المؤشر': 'محايد', 'القيمة': neutral, 'النسبة': `${((neutral / total) * 100).toFixed(1)}%` },
    );
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'ملخص التقرير');

    // ───── Sheet 2: All Tweets (comprehensive) ─────
    const tweetsData = tweets.map(t => ({
      'رقم': t.id,
      'النص': t.text,
      'الكاتب': t.author,
      'المشاعر': t.sentiment,
      'العاطفة': t.emotion,
      'الموضوع': categorizeTweet(t.text, t.keywords),
      'عن ثمانية': isThamanyah(t) ? 'نعم' : 'لا',
      'الكلمات المفتاحية': t.keywords.join(', '),
      'الوصول': t.reach,
      'إعجابات': t.engagement.likes,
      'إعادات تغريد': t.engagement.retweets,
      'ردود': t.engagement.replies,
      'إجمالي التفاعل': t.engagement.likes + t.engagement.retweets + t.engagement.replies,
      'نسبة التفاعل للوصول': t.reach > 0 ? `${(((t.engagement.likes + t.engagement.retweets + t.engagement.replies) / t.reach) * 100).toFixed(2)}%` : '0%',
    }));
    const ws2 = XLSX.utils.json_to_sheet(tweetsData);
    ws2['!cols'] = [{ wch: 5 }, { wch: 60 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'جميع التغريدات');

    // ───── Sheet 3: Sentiment Breakdown ─────
    const sentimentData = [
      { 'المشاعر': 'إيجابي', 'العدد': positive, 'النسبة': `${((positive / total) * 100).toFixed(1)}%`, 'إجمالي الوصول': tweets.filter(t => t.sentiment === 'إيجابي').reduce((s, t) => s + t.reach, 0), 'متوسط الوصول': Math.round(tweets.filter(t => t.sentiment === 'إيجابي').reduce((s, t) => s + t.reach, 0) / (positive || 1)) },
      { 'المشاعر': 'سلبي', 'العدد': negative, 'النسبة': `${((negative / total) * 100).toFixed(1)}%`, 'إجمالي الوصول': tweets.filter(t => t.sentiment === 'سلبي').reduce((s, t) => s + t.reach, 0), 'متوسط الوصول': Math.round(tweets.filter(t => t.sentiment === 'سلبي').reduce((s, t) => s + t.reach, 0) / (negative || 1)) },
      { 'المشاعر': 'محايد', 'العدد': neutral, 'النسبة': `${((neutral / total) * 100).toFixed(1)}%`, 'إجمالي الوصول': tweets.filter(t => t.sentiment === 'محايد').reduce((s, t) => s + t.reach, 0), 'متوسط الوصول': Math.round(tweets.filter(t => t.sentiment === 'محايد').reduce((s, t) => s + t.reach, 0) / (neutral || 1)) },
      { 'المشاعر': 'الإجمالي', 'العدد': total, 'النسبة': '100%', 'إجمالي الوصول': totalReach, 'متوسط الوصول': Math.round(totalReach / total) },
    ];
    const ws3 = XLSX.utils.json_to_sheet(sentimentData);
    ws3['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'تحليل المشاعر');

    // ───── Sheet 4: Emotions ─────
    const emotionCounts: Record<string, { count: number; reach: number; likes: number; retweets: number; replies: number }> = {};
    tweets.forEach(t => {
      if (!emotionCounts[t.emotion]) emotionCounts[t.emotion] = { count: 0, reach: 0, likes: 0, retweets: 0, replies: 0 };
      emotionCounts[t.emotion].count++;
      emotionCounts[t.emotion].reach += t.reach;
      emotionCounts[t.emotion].likes += t.engagement.likes;
      emotionCounts[t.emotion].retweets += t.engagement.retweets;
      emotionCounts[t.emotion].replies += t.engagement.replies;
    });
    const emotionData = Object.entries(emotionCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([emotion, stats]) => ({
        'العاطفة': emotion,
        'العدد': stats.count,
        'النسبة': `${((stats.count / total) * 100).toFixed(1)}%`,
        'إجمالي الوصول': stats.reach,
        'متوسط الوصول': Math.round(stats.reach / stats.count),
        'إعجابات': stats.likes,
        'إعادات تغريد': stats.retweets,
        'ردود': stats.replies,
      }));
    const ws4 = XLSX.utils.json_to_sheet(emotionData);
    ws4['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'تحليل العواطف');

    // ───── Sheet 5: Topic Categories ─────
    const topicCounts: Record<string, { count: number; reach: number; positive: number; negative: number; neutral: number }> = {};
    tweets.forEach(t => {
      const topic = categorizeTweet(t.text, t.keywords);
      if (!topicCounts[topic]) topicCounts[topic] = { count: 0, reach: 0, positive: 0, negative: 0, neutral: 0 };
      topicCounts[topic].count++;
      topicCounts[topic].reach += t.reach;
      if (t.sentiment === 'إيجابي') topicCounts[topic].positive++;
      else if (t.sentiment === 'سلبي') topicCounts[topic].negative++;
      else topicCounts[topic].neutral++;
    });
    const topicData = Object.entries(topicCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([topic, stats]) => ({
        'الموضوع': topic,
        'العدد': stats.count,
        'النسبة': `${((stats.count / total) * 100).toFixed(1)}%`,
        'إجمالي الوصول': stats.reach,
        'إيجابي': stats.positive,
        'سلبي': stats.negative,
        'محايد': stats.neutral,
        'نسبة السلبي': `${((stats.negative / stats.count) * 100).toFixed(1)}%`,
      }));
    const ws5 = XLSX.utils.json_to_sheet(topicData);
    ws5['!cols'] = [{ wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'تحليل المواضيع');

    // ───── Sheet 6: Keywords with Pulse ─────
    const kwStats: Record<string, { count: number; reach: number; posSent: number; negSent: number }> = {};
    tweets.forEach(t => {
      t.keywords.forEach(kw => {
        if (!kwStats[kw]) kwStats[kw] = { count: 0, reach: 0, posSent: 0, negSent: 0 };
        kwStats[kw].count++;
        kwStats[kw].reach += t.reach;
        if (t.sentiment === 'إيجابي') kwStats[kw].posSent++;
        if (t.sentiment === 'سلبي') kwStats[kw].negSent++;
      });
    });
    const kwData = Object.entries(kwStats)
      .sort((a, b) => b[1].reach - a[1].reach)
      .map(([kw, stats]) => ({
        'الكلمة المفتاحية': kw,
        'التكرار': stats.count,
        'إجمالي الوصول': stats.reach,
        'النبض (وصول/تكرار)': Math.round(stats.reach / stats.count),
        'إيجابي': stats.posSent,
        'سلبي': stats.negSent,
        'نسبة الإيجابي': `${((stats.posSent / stats.count) * 100).toFixed(1)}%`,
      }));
    const ws6 = XLSX.utils.json_to_sheet(kwData);
    ws6['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws6, 'الكلمات المفتاحية');

    // ───── Sheet 7: Authors Analytics ─────
    const authorStats: Record<string, { tweets: number; reach: number; likes: number; retweets: number; replies: number; positive: number; negative: number }> = {};
    tweets.forEach(t => {
      if (!authorStats[t.author]) authorStats[t.author] = { tweets: 0, reach: 0, likes: 0, retweets: 0, replies: 0, positive: 0, negative: 0 };
      authorStats[t.author].tweets++;
      authorStats[t.author].reach += t.reach;
      authorStats[t.author].likes += t.engagement.likes;
      authorStats[t.author].retweets += t.engagement.retweets;
      authorStats[t.author].replies += t.engagement.replies;
      if (t.sentiment === 'إيجابي') authorStats[t.author].positive++;
      if (t.sentiment === 'سلبي') authorStats[t.author].negative++;
    });
    const authorData = Object.entries(authorStats)
      .sort((a, b) => b[1].reach - a[1].reach)
      .map(([author, stats]) => ({
        'الكاتب': author,
        'عدد التغريدات': stats.tweets,
        'إجمالي الوصول': stats.reach,
        'متوسط الوصول': Math.round(stats.reach / stats.tweets),
        'إعجابات': stats.likes,
        'إعادات تغريد': stats.retweets,
        'ردود': stats.replies,
        'إجمالي التفاعل': stats.likes + stats.retweets + stats.replies,
        'تغريدات إيجابية': stats.positive,
        'تغريدات سلبية': stats.negative,
      }));
    const ws7 = XLSX.utils.json_to_sheet(authorData);
    ws7['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws7, 'تحليل الكتاب');

    // ───── Sheet 8: Thamanyah vs Others ─────
    const thamTweets = tweets.filter(isThamanyah);
    const otherTweets = tweets.filter(t => !isThamanyah(t));
    const thamPos = thamTweets.filter(t => t.sentiment === 'إيجابي').length;
    const thamNeg = thamTweets.filter(t => t.sentiment === 'سلبي').length;
    const otherPos = otherTweets.filter(t => t.sentiment === 'إيجابي').length;
    const otherNeg = otherTweets.filter(t => t.sentiment === 'سلبي').length;
    const brandData = [
      { 'الفئة': 'عن ثمانية', 'العدد': thamTweets.length, 'النسبة': `${((thamTweets.length / total) * 100).toFixed(1)}%`, 'الوصول': thamTweets.reduce((s, t) => s + t.reach, 0), 'إيجابي': thamPos, 'سلبي': thamNeg, 'نسبة الإيجابي': thamTweets.length > 0 ? `${((thamPos / thamTweets.length) * 100).toFixed(1)}%` : '0%' },
      { 'الفئة': 'ليست عن ثمانية', 'العدد': otherTweets.length, 'النسبة': `${((otherTweets.length / total) * 100).toFixed(1)}%`, 'الوصول': otherTweets.reduce((s, t) => s + t.reach, 0), 'إيجابي': otherPos, 'سلبي': otherNeg, 'نسبة الإيجابي': otherTweets.length > 0 ? `${((otherPos / otherTweets.length) * 100).toFixed(1)}%` : '0%' },
    ];
    const ws8 = XLSX.utils.json_to_sheet(brandData);
    ws8['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws8, 'ثمانية مقابل أخرى');

    // ───── Sheet 9: Top 10 by Reach ─────
    const topByReach = [...tweets].sort((a, b) => b.reach - a.reach).slice(0, 10).map((t, i) => ({
      'الترتيب': i + 1,
      'الكاتب': t.author,
      'النص': t.text,
      'الوصول': t.reach,
      'المشاعر': t.sentiment,
      'إعجابات': t.engagement.likes,
      'إعادات تغريد': t.engagement.retweets,
    }));
    const ws9 = XLSX.utils.json_to_sheet(topByReach);
    ws9['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 60 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws9, 'أعلى 10 وصولاً');

    // ───── Sheet 10: Top 10 by Engagement ─────
    const topByEng = [...tweets].sort((a, b) => (b.engagement.likes + b.engagement.retweets + b.engagement.replies) - (a.engagement.likes + a.engagement.retweets + a.engagement.replies)).slice(0, 10).map((t, i) => ({
      'الترتيب': i + 1,
      'الكاتب': t.author,
      'النص': t.text,
      'إجمالي التفاعل': t.engagement.likes + t.engagement.retweets + t.engagement.replies,
      'إعجابات': t.engagement.likes,
      'إعادات تغريد': t.engagement.retweets,
      'ردود': t.engagement.replies,
      'المشاعر': t.sentiment,
    }));
    const ws10 = XLSX.utils.json_to_sheet(topByEng);
    ws10['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 60 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws10, 'أعلى 10 تفاعلاً');

    XLSX.writeFile(wb, `تقرير_ثمانية_${reportDate}.xlsx`);
  };

  return (
    <Card className="border border-border bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <FileSpreadsheet className="h-5 w-5" />
          تصدير البيانات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-emerald-700 mb-2">
          تصدير شامل لجميع بيانات وتحليلات التقرير في 10 أوراق Excel:
        </p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['ملخص التقرير', 'جميع التغريدات', 'تحليل المشاعر', 'تحليل العواطف', 'تحليل المواضيع', 'الكلمات المفتاحية', 'تحليل الكتاب', 'ثمانية مقابل أخرى', 'أعلى 10 وصولاً', 'أعلى 10 تفاعلاً'].map(sheet => (
            <span key={sheet} className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">{sheet}</span>
          ))}
        </div>
        <Button 
          onClick={exportToExcel}
          className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
        >
          <Download className="h-4 w-4" />
          تحميل ملف Excel
        </Button>
      </CardContent>
    </Card>
  );
};
