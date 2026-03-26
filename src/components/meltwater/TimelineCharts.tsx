import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, AlertTriangle, Clock, X, ExternalLink, Calendar, ChevronRight } from 'lucide-react';
import { TweetSortControls, sortTweets, type SortKey, type TweetWithEngagement } from './TweetSortControls';

interface Tweet extends TweetWithEngagement {
  problem?: string;
}

interface TimelineChartsProps {
  tweets: Tweet[];
}

// Problem categories
const problemCategories = [
  { key: 'technical', label: 'مشاكل تقنية', keywords: ['تقطيع', 'بث', 'نقل سيء', 'مشاكل', 'بدائية'] },
  { key: 'bias', label: 'تحيز', keywords: ['تحيز', 'هلالية', 'ابومالح', 'إخفاء', 'تطبل'] },
  { key: 'missing', label: 'لقطات ناقصة', keywords: ['ماشفش', 'ما لقطوا', 'ما شفناها', 'لقطة'] },
  { key: 'commentary', label: 'تعليق', keywords: ['فارس عوض', 'معلق', 'راب'] }
];

const categorizeProblem = (tweet: Tweet): string | null => {
  if (tweet.sentiment !== 'سلبي') return null;
  const text = tweet.text.toLowerCase();
  for (const cat of problemCategories) {
    if (cat.keywords.some(kw => text.includes(kw.toLowerCase()))) return cat.key;
  }
  return 'other';
};

// Time slots for simulation
const DAY_HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

type DrillLevel = 'day' | 'hour' | 'minute';

export const TimelineCharts = ({ tweets }: TimelineChartsProps) => {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<'sentiment' | 'problems'>('sentiment');
  const [sortKey, setSortKey] = useState<SortKey>('reach');
  const [sortDirection, setSortDirection] = useState<import('./TweetSortControls').SortDirection>('desc');
  const [drillLevel, setDrillLevel] = useState<DrillLevel>('day');
  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  // Assign simulated timestamps to tweets
  const tweetsWithTime = useMemo(() => {
    return tweets.map((tweet, index) => {
      const hour = DAY_HOURS[index % DAY_HOURS.length];
      const minute = String(Math.floor((index / DAY_HOURS.length) * 60) % 60).padStart(2, '0');
      return { ...tweet, timestamp: `${hour}:${minute}` };
    });
  }, [tweets]);

  // Build stats based on drill level
  const slotStats = useMemo(() => {
    const stats: Record<string, {
      slot: string;
      total: number;
      positive: number;
      negative: number;
      neutral: number;
      problems: Record<string, number>;
      tweets: Tweet[];
    }> = {};

    let filteredTweets = tweetsWithTime;

    // If drilling into an hour, only show tweets from that hour
    if (drillLevel === 'minute' && selectedHour) {
      filteredTweets = tweetsWithTime.filter(t => t.timestamp?.startsWith(selectedHour.substring(0, 2)));
    }

    filteredTweets.forEach(tweet => {
      let slot: string;
      if (drillLevel === 'day') {
        slot = tweet.timestamp!.substring(0, 5); // HH:00
      } else if (drillLevel === 'minute' && selectedHour) {
        const min = tweet.timestamp!.substring(6, 8) || String(Math.floor(Math.random() * 60)).padStart(2, '0');
        slot = `${selectedHour.substring(0, 5)}:${min}`;
      } else {
        slot = tweet.timestamp!.substring(0, 5);
      }

      if (!stats[slot]) {
        stats[slot] = { slot, total: 0, positive: 0, negative: 0, neutral: 0, problems: { technical: 0, bias: 0, missing: 0, commentary: 0, other: 0 }, tweets: [] };
      }
      stats[slot].total++;
      stats[slot].tweets.push(tweet);
      if (tweet.sentiment === 'إيجابي') stats[slot].positive++;
      else if (tweet.sentiment === 'سلبي') {
        stats[slot].negative++;
        const problem = categorizeProblem(tweet);
        if (problem) stats[slot].problems[problem] = (stats[slot].problems[problem] || 0) + 1;
      } else stats[slot].neutral++;
    });

    return stats;
  }, [tweetsWithTime, drillLevel, selectedHour]);

  const chartData = useMemo(() => 
    Object.values(slotStats).sort((a, b) => a.slot.localeCompare(b.slot)),
    [slotStats]
  );

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'إيجابي': return 'bg-green-100 text-green-800 border-green-300';
      case 'سلبي': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-secondary text-gray-800 border-gray-300';
    }
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, stroke, r = 6 } = props;
    if (!cx || !cy) return null;
    return (
      <circle
        cx={cx} cy={cy}
        r={expandedSlot === payload?.slot ? r + 3 : r}
        fill={expandedSlot === payload?.slot ? stroke : 'white'}
        stroke={stroke} strokeWidth={3}
        style={{ cursor: 'pointer', pointerEvents: 'all' }}
      />
    );
  };

  const handleChartClick = (data: any) => {
    if (!data?.activePayload?.[0]?.payload?.slot) return;
    const slot = data.activePayload[0].payload.slot;
    handleSlotClick(slot);
  };

  const handleSlotClick = (slot: string) => {
    if (drillLevel === 'day') {
      setDrillLevel('minute');
      setSelectedHour(slot);
      setExpandedSlot(null);
    } else {
      setExpandedSlot(expandedSlot === slot ? null : slot);
    }
  };

  const handleBackToDay = () => {
    setDrillLevel('day');
    setSelectedHour(null);
    setExpandedSlot(null);
  };

  const expandedTweets = useMemo(() => {
    if (!expandedSlot || !slotStats[expandedSlot]) return [];
    let t = slotStats[expandedSlot].tweets;
    if (activeChart === 'problems') t = t.filter(tw => tw.sentiment === 'سلبي');
    return sortTweets(t, sortKey, sortDirection);
  }, [expandedSlot, slotStats, activeChart, sortKey]);

  const levelLabel = drillLevel === 'day' ? 'حسب الساعة' : `دقائق الساعة ${selectedHour}`;

  return (
    <div className="space-y-6">
      {/* Drill-down breadcrumb */}
      <div className="flex items-center gap-2">
        <Button
          variant={drillLevel === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={handleBackToDay}
          className={`text-xs gap-1 ${drillLevel === 'day' ? 'bg-foreground text-primary-foreground' : ''}`}
        >
          <Calendar className="h-3 w-3" />
          عرض الساعات
        </Button>
        {drillLevel === 'minute' && selectedHour && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Badge className="bg-foreground text-primary-foreground">{selectedHour} - عرض الدقائق</Badge>
          </>
        )}
      </div>

      {/* Chart Toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => { setActiveChart('sentiment'); setExpandedSlot(null); }}
          className={`px-4 py-2 rounded-2xl font-bold border-2 transition-colors ${
            activeChart === 'sentiment' ? 'bg-foreground text-primary-foreground border-border' : 'bg-card text-foreground border-gray-300 hover:border-border'
          }`}
        >
          <TrendingUp className="h-4 w-4 inline ml-2" />
          المشاعر عبر الوقت
        </button>
        <button
          onClick={() => { setActiveChart('problems'); setExpandedSlot(null); }}
          className={`px-4 py-2 rounded-2xl font-bold border-2 transition-colors ${
            activeChart === 'problems' ? 'bg-thmanyah-red text-white border-red-600' : 'bg-white text-red-600 border-red-300 hover:border-red-600'
          }`}
        >
          <AlertTriangle className="h-4 w-4 inline ml-2" />
          المشاكل عبر الوقت
        </button>
      </div>

      {/* Slot selection buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground self-center ml-2">
          {drillLevel === 'day' ? 'اختر ساعة (اضغط للتعمق بالدقائق):' : 'اختر دقيقة:'}
        </span>
        {chartData.map(data => (
          <Button
            key={data.slot}
            variant={expandedSlot === data.slot ? "default" : "outline"}
            size="sm"
            onClick={() => handleSlotClick(data.slot)}
            className={`text-xs ${expandedSlot === data.slot ? 'bg-foreground text-primary-foreground' : ''}`}
          >
            {drillLevel === 'minute' ? data.slot.substring(6) + 'م' : data.slot}
            <Badge variant="secondary" className="mr-1 text-xs">{data.total}</Badge>
          </Button>
        ))}
      </div>

      {/* Chart */}
      <Card className={`border-2 ${activeChart === 'problems' ? 'border-red-300 bg-red-50' : 'border-border'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${activeChart === 'problems' ? 'text-red-800' : ''}`}>
            {activeChart === 'sentiment' ? <TrendingUp className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            {activeChart === 'sentiment' ? 'توزيع المشاعر' : 'تتبع المشاكل'} - {levelLabel}
          </CardTitle>
          <p className={`text-sm ${activeChart === 'problems' ? 'text-red-600' : 'text-muted-foreground'}`}>
            <Clock className="h-4 w-4 inline ml-1" />
            {drillLevel === 'day' ? 'اضغط على نقطة للتعمق بالدقائق' : 'اضغط على نقطة لعرض التغريدات'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="slot" label={{ value: 'الوقت', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'العدد', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-card p-3 border border-border rounded-2xl shadow-lg">
                          <p className="font-bold mb-2">{label}</p>
                          {payload.map((entry: any) => (
                            <p key={entry.name} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
                          ))}
                          <p className="text-xs text-blue-600 mt-2 font-bold">
                            🔍 {drillLevel === 'day' ? 'اضغط للتعمق' : 'اضغط للتوسيع'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {activeChart === 'sentiment' ? (
                  <>
                    <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={3} name="إيجابي" dot={<CustomDot stroke="#22c55e" />} />
                    <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={3} name="سلبي" dot={<CustomDot stroke="#ef4444" />} />
                    <Line type="monotone" dataKey="neutral" stroke="#6b7280" strokeWidth={2} name="محايد" dot={<CustomDot stroke="#6b7280" r={4} />} />
                  </>
                ) : (
                  <>
                    <Line type="monotone" dataKey="problems.technical" stroke="#dc2626" strokeWidth={3} name="مشاكل تقنية" dot={<CustomDot stroke="#dc2626" />} />
                    <Line type="monotone" dataKey="problems.bias" stroke="#ea580c" strokeWidth={3} name="تحيز" dot={<CustomDot stroke="#ea580c" />} />
                    <Line type="monotone" dataKey="problems.missing" stroke="#ca8a04" strokeWidth={2} name="لقطات ناقصة" dot={<CustomDot stroke="#ca8a04" r={5} />} />
                    <Line type="monotone" dataKey="problems.commentary" stroke="#9333ea" strokeWidth={2} name="تعليق" dot={<CustomDot stroke="#9333ea" r={4} />} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Tweets */}
      {expandedSlot && slotStats[expandedSlot] && (
        <Card className="border border-border bg-blue-50 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                تغريدات {expandedSlot}
                <Badge className="bg-foreground text-primary-foreground mr-2">{expandedTweets.length} تغريدة</Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setExpandedSlot(null)} className="border border-border">
                <X className="h-4 w-4 ml-1" /> إغلاق
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TweetSortControls activeSort={sortKey} onSortChange={setSortKey} direction={sortDirection} onDirectionChange={setSortDirection} />
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {expandedTweets.length === 0 ? (
                <div className="text-center py-8 text-gray-500">لا توجد تغريدات في هذه الفترة</div>
              ) : expandedTweets.map(tweet => (
                <div key={tweet.id} className="p-4 bg-card border-2 rounded-2xl hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1 font-bold">{tweet.author}</p>
                      <p className="text-sm">{tweet.text}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {tweet.keywords.slice(0, 3).map((kw, i) => (
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
