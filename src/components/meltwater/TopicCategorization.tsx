import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hash, Percent, Hash as NumberIcon, X, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TweetSortControls, sortTweets, type SortKey, type TweetWithEngagement } from './TweetSortControls';

interface Tweet extends TweetWithEngagement {
  topic?: string;
}

interface TopicCategorizationProps {
  tweets: Tweet[];
}

const topicCategories = [
  { key: 'football', label: 'كرة القدم والمباريات', keywords: ['رونالدو', 'الهلال', 'النصر', 'دوري روشن', 'هدف', 'مراوغة', 'الدوري', 'مباراة', 'فيليكس', 'اسيست', 'ضمك', 'الفيحاء', 'VAR', 'الحكم'] },
  { key: 'broadcast', label: 'البث والنقل التقني', keywords: ['بث', 'نقل', 'تقطيع', 'كاميرات', 'beIN', '4K', 'IPTV', 'قناة ثمانية', 'لقطة'] },
  { key: 'bias', label: 'اتهامات التحيز', keywords: ['تحيز', 'هلالية', 'ابومالح', 'أبو مالح', 'إخفاء', 'شعبية', 'تطبل', 'استغلال'] },
  { key: 'content', label: 'المحتوى التعليمي', keywords: ['اليمن', 'تاريخي', 'توثيقي', 'شرح', 'حلقة', 'سرد', 'إنتاج', 'جودة'] },
  { key: 'commentary', label: 'التعليق والمعلقين', keywords: ['فارس عوض', 'راب', 'معلق', 'تعليق'] },
  { key: 'other', label: 'أخرى', keywords: [] }
];

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280'];

export const TopicCategorization = ({ tweets }: TopicCategorizationProps) => {
  const [showPercentage, setShowPercentage] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('reach');
  const [sortDirection, setSortDirection] = useState<import('./TweetSortControls').SortDirection>('desc');

  const categorizedTweets = useMemo(() => {
    return tweets.map(tweet => {
      const tweetText = tweet.text.toLowerCase();
      const tweetKeywords = tweet.keywords.map(k => k.toLowerCase());
      for (const category of topicCategories) {
        if (category.key === 'other') continue;
        if (category.keywords.some(keyword => tweetText.includes(keyword.toLowerCase()) || tweetKeywords.some(k => k.includes(keyword.toLowerCase())))) {
          return { ...tweet, topic: category.key };
        }
      }
      return { ...tweet, topic: 'other' };
    });
  }, [tweets]);

  const topicCounts: Record<string, number> = {};
  categorizedTweets.forEach(tweet => { topicCounts[tweet.topic!] = (topicCounts[tweet.topic!] || 0) + 1; });

  const chartData = topicCategories.map((cat, index) => ({
    name: cat.label,
    shortName: cat.label.split(' ')[0],
    key: cat.key,
    value: topicCounts[cat.key] || 0,
    percentage: ((topicCounts[cat.key] || 0) / tweets.length * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const getTweetsByTopic = (topicKey: string) => categorizedTweets.filter(t => t.topic === topicKey);

  const selectedTopicTweets = useMemo(() => {
    if (!selectedTopic) return [];
    return sortTweets(getTweetsByTopic(selectedTopic), sortKey, sortDirection);
  }, [selectedTopic, categorizedTweets, sortKey]);

  const selectedTopicData = chartData.find(d => d.key === selectedTopic);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'إيجابي': return 'bg-green-100 text-green-800 border-green-300';
      case 'سلبي': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-secondary text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            توزيع المواضيع
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">اضغط على أي موضوع لعرض التغريدات</p>
            <Button
              variant="outline" size="sm"
              onClick={() => setShowPercentage(!showPercentage)}
              className="gap-2 border border-border font-bold"
            >
              {showPercentage ? <><Percent className="h-4 w-4" /> نسب مئوية</> : <><NumberIcon className="h-4 w-4" /> أرقام</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Clickable Percentage Bars */}
          <div className="space-y-4 mb-8">
            {chartData.map((topic) => (
              <button
                key={topic.key}
                className={`w-full text-right space-y-2 p-2 rounded-2xl transition-all cursor-pointer hover:bg-background ${selectedTopic === topic.key ? 'ring-2 ring-foreground bg-gray-50' : ''}`}
                onClick={() => setSelectedTopic(selectedTopic === topic.key ? null : topic.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-xl" style={{ backgroundColor: topic.color }} />
                    <span className="font-bold text-sm">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{topic.value} تغريدة</span>
                    <Badge className="font-bold text-white min-w-[60px] justify-center" style={{ backgroundColor: topic.color }}>
                      {showPercentage ? `${topic.percentage}%` : topic.value}
                    </Badge>
                  </div>
                </div>
                <div className="h-8 bg-secondary rounded-2xl overflow-hidden border-2 border-gray-200">
                  <div
                    className="h-full flex items-center justify-end px-3 transition-all duration-500 ease-out"
                    style={{ width: `${topic.percentage}%`, backgroundColor: topic.color, minWidth: topic.value > 0 ? '40px' : '0' }}
                  >
                    <span className="text-white font-bold text-sm">
                      {parseFloat(topic.percentage) > 10 ? (showPercentage ? `${topic.percentage}%` : topic.value) : ''}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Clickable Horizontal Bar Chart */}
          <div className="h-[250px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="shortName" width={90} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-card p-3 border border-border rounded-2xl shadow-lg">
                          <p className="font-bold mb-1">{data.name}</p>
                          <p className="text-sm">{data.value} تغريدة ({data.percentage}%)</p>
                          <p className="text-xs text-blue-600 mt-1 font-bold">🔍 اضغط للتوسيع</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} onClick={(data) => setSelectedTopic(selectedTopic === data.key ? null : data.key)} style={{ cursor: 'pointer' }}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expanded topic tweets */}
      {selectedTopic && selectedTopicData && (
        <Card className="border border-border bg-blue-50 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                تغريدات "{selectedTopicData.name}"
                <Badge className="bg-foreground text-primary-foreground">{selectedTopicTweets.length}</Badge>
                <Badge variant="outline" style={{ borderColor: selectedTopicData.color, color: selectedTopicData.color }}>
                  {selectedTopicData.percentage}%
                </Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedTopic(null)} className="border border-border">
                <X className="h-4 w-4 ml-1" /> إغلاق
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TweetSortControls activeSort={sortKey} onSortChange={setSortKey} direction={sortDirection} onDirectionChange={setSortDirection} />
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedTopicTweets.map(tweet => (
                <div key={tweet.id} className="p-4 bg-card border-2 rounded-2xl hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold">{tweet.author}</p>
                      <p className="text-sm mt-1">{tweet.text}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {tweet.keywords.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                      {tweet.engagement && (
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          <span>❤️ {tweet.engagement.likes}</span>
                          <span>🔁 {tweet.engagement.retweets}</span>
                          <span>💬 {tweet.engagement.replies}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${getSentimentColor(tweet.sentiment)} border text-xs`}>{tweet.sentiment}</Badge>
                      <span className="text-xs text-gray-500 font-bold">{tweet.reach.toLocaleString()} وصول</span>
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
