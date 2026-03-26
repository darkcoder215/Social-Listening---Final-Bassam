import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertTriangle, Heart, Zap, Hash, MessageSquare, X, ExternalLink } from 'lucide-react';
import { TweetSortControls, sortTweets, type SortKey, type TweetWithEngagement } from './TweetSortControls';

interface Tweet extends TweetWithEngagement {}

interface TopicKPIsProps {
  tweets: Tweet[];
}

export const TopicKPIs = ({ tweets }: TopicKPIsProps) => {
  const [selectedKPI, setSelectedKPI] = useState<{ type: string; keyword?: string } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('reach');
  const [sortDirection, setSortDirection] = useState<import('./TweetSortControls').SortDirection>('desc');

  const totalTweets = tweets.length;
  const totalReach = tweets.reduce((sum, t) => sum + t.reach, 0);
  const negativeTweets = tweets.filter(t => t.sentiment === 'سلبي');
  const positiveTweets = tweets.filter(t => t.sentiment === 'إيجابي');

  const problemKeywords: Record<string, { count: number; reach: number }> = {};
  negativeTweets.forEach(t => {
    t.keywords.forEach(kw => {
      if (!problemKeywords[kw]) problemKeywords[kw] = { count: 0, reach: 0 };
      problemKeywords[kw].count++;
      problemKeywords[kw].reach += t.reach;
    });
  });
  const topProblems = Object.entries(problemKeywords).sort((a, b) => b[1].reach - a[1].reach).slice(0, 5);

  const positiveKeywords: Record<string, { count: number; reach: number }> = {};
  positiveTweets.forEach(t => {
    t.keywords.forEach(kw => {
      if (!positiveKeywords[kw]) positiveKeywords[kw] = { count: 0, reach: 0 };
      positiveKeywords[kw].count++;
      positiveKeywords[kw].reach += t.reach;
    });
  });
  const topPositive = Object.entries(positiveKeywords).sort((a, b) => b[1].reach - a[1].reach).slice(0, 5);

  const allKeywords: Record<string, { count: number; reach: number; avgReach: number }> = {};
  tweets.forEach(t => {
    t.keywords.forEach(kw => {
      if (!allKeywords[kw]) allKeywords[kw] = { count: 0, reach: 0, avgReach: 0 };
      allKeywords[kw].count++;
      allKeywords[kw].reach += t.reach;
    });
  });
  Object.keys(allKeywords).forEach(kw => { allKeywords[kw].avgReach = allKeywords[kw].reach / allKeywords[kw].count; });
  const highPulseWords = Object.entries(allKeywords).filter(([_, s]) => s.count >= 2).sort((a, b) => b[1].reach - a[1].reach).slice(0, 6);

  const topicCounts: Record<string, number> = {};
  tweets.forEach(t => { t.keywords.forEach(kw => { topicCounts[kw] = (topicCounts[kw] || 0) + 1; }); });
  const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Get filtered tweets based on selection
  const filteredTweets = useMemo(() => {
    if (!selectedKPI) return [];
    let result: Tweet[] = [];
    if (selectedKPI.type === 'positive') result = positiveTweets;
    else if (selectedKPI.type === 'negative') result = negativeTweets;
    else if (selectedKPI.type === 'all') result = tweets;
    else if (selectedKPI.type === 'keyword' && selectedKPI.keyword) {
      result = tweets.filter(t => t.keywords.includes(selectedKPI.keyword!));
    }
    return sortTweets(result, sortKey, sortDirection);
  }, [selectedKPI, tweets, sortKey]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'إيجابي': return 'bg-green-100 text-green-800 border-green-300';
      case 'سلبي': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-secondary text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main KPI Row - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`border border-border bg-gradient-to-br from-blue-50 to-blue-100 cursor-pointer hover:shadow-lg transition-shadow ${selectedKPI?.type === 'all' ? 'ring-2 ring-foreground' : ''}`} onClick={() => setSelectedKPI(selectedKPI?.type === 'all' ? null : { type: 'all' })}>
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-3xl font-bold text-blue-800">{totalTweets}</p>
              <p className="text-sm text-blue-600 font-medium">إجمالي التغريدات</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-gradient-to-br from-purple-50 to-purple-100 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedKPI(selectedKPI?.type === 'all' ? null : { type: 'all' })}>
          <CardContent className="pt-6">
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-3xl font-bold text-purple-800">{(totalReach / 1000).toFixed(1)}K</p>
              <p className="text-sm text-purple-600 font-medium">إجمالي الوصول</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border border-border bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:shadow-lg transition-shadow ${selectedKPI?.type === 'positive' ? 'ring-2 ring-green-600' : ''}`} onClick={() => setSelectedKPI(selectedKPI?.type === 'positive' ? null : { type: 'positive' })}>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-3xl font-bold text-green-800">{positiveTweets.length}</p>
              <p className="text-sm text-green-600 font-medium">تغريدات إيجابية</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border border-border bg-gradient-to-br from-red-50 to-red-100 cursor-pointer hover:shadow-lg transition-shadow ${selectedKPI?.type === 'negative' ? 'ring-2 ring-red-600' : ''}`} onClick={() => setSelectedKPI(selectedKPI?.type === 'negative' ? null : { type: 'negative' })}>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-3xl font-bold text-red-800">{negativeTweets.length}</p>
              <p className="text-sm text-red-600 font-medium">شكاوى ومشاكل</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed KPIs - Clickable items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 text-lg">
              <AlertTriangle className="h-5 w-5" />
              أكثر المشاكل انتشاراً
            </CardTitle>
            <p className="text-xs text-red-600">اضغط على أي كلمة لعرض التغريدات</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topProblems.map(([keyword, stats], index) => (
                <button
                  key={keyword}
                  className={`w-full flex items-center justify-between p-2 bg-card rounded-2xl border border-red-200 hover:border-red-500 transition-colors cursor-pointer ${selectedKPI?.keyword === keyword ? 'ring-2 ring-red-500' : ''}`}
                  onClick={() => setSelectedKPI(selectedKPI?.keyword === keyword ? null : { type: 'keyword', keyword })}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-thmanyah-red text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <span className="font-medium text-sm">{keyword}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-red-300">{stats.count}x</Badge>
                    <Badge className="bg-thmanyah-red text-white text-xs">{(stats.reach / 1000).toFixed(1)}K</Badge>
                  </div>
                </button>
              ))}
              {topProblems.length === 0 && <p className="text-sm text-gray-500 text-center py-4">لا توجد مشاكل مسجلة</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 text-lg">
              <Heart className="h-5 w-5" />
              أكثر الإيجابيات انتشاراً
            </CardTitle>
            <p className="text-xs text-green-600">اضغط على أي كلمة لعرض التغريدات</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPositive.map(([keyword, stats], index) => (
                <button
                  key={keyword}
                  className={`w-full flex items-center justify-between p-2 bg-card rounded-2xl border border-green-200 hover:border-green-500 transition-colors cursor-pointer ${selectedKPI?.keyword === keyword ? 'ring-2 ring-green-500' : ''}`}
                  onClick={() => setSelectedKPI(selectedKPI?.keyword === keyword ? null : { type: 'keyword', keyword })}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-thmanyah-green text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <span className="font-medium text-sm">{keyword}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-green-300">{stats.count}x</Badge>
                    <Badge className="bg-thmanyah-green text-white text-xs">{(stats.reach / 1000).toFixed(1)}K</Badge>
                  </div>
                </button>
              ))}
              {topPositive.length === 0 && <p className="text-sm text-gray-500 text-center py-4">لا توجد تغريدات إيجابية</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 text-lg">
              <Zap className="h-5 w-5" />
              كلمات عالية النبض
            </CardTitle>
            <p className="text-xs text-purple-600">اضغط على أي كلمة لعرض التغريدات</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {highPulseWords.map(([keyword, stats], index) => (
                <button
                  key={keyword}
                  className={`w-full flex items-center justify-between p-2 bg-card rounded-2xl border border-purple-200 hover:border-purple-500 transition-colors cursor-pointer ${selectedKPI?.keyword === keyword ? 'ring-2 ring-purple-500' : ''}`}
                  onClick={() => setSelectedKPI(selectedKPI?.keyword === keyword ? null : { type: 'keyword', keyword })}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                    <span className="font-medium text-sm">{keyword}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge className="bg-purple-600 text-white text-xs">{(stats.reach / 1000).toFixed(1)}K وصول</Badge>
                    <span className="text-xs text-purple-600 mt-1">معدل: {(stats.avgReach / 1000).toFixed(1)}K</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Common Topics - Clickable */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            المواضيع الأكثر تكراراً
          </CardTitle>
          <p className="text-xs text-muted-foreground">اضغط على أي موضوع لعرض التغريدات</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {topTopics.map(([topic, count], index) => (
              <button
                key={topic}
                className={`flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border-2 border-gray-300 hover:border-border transition-colors cursor-pointer ${selectedKPI?.keyword === topic ? 'border-border bg-gray-200' : ''}`}
                onClick={() => setSelectedKPI(selectedKPI?.keyword === topic ? null : { type: 'keyword', keyword: topic })}
              >
                <span className="w-5 h-5 bg-foreground text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</span>
                <span className="font-bold">{topic}</span>
                <Badge variant="secondary">{count}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expanded tweets panel */}
      {selectedKPI && filteredTweets.length > 0 && (
        <Card className="border border-border bg-blue-50 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                {selectedKPI.keyword ? `تغريدات "${selectedKPI.keyword}"` : selectedKPI.type === 'positive' ? 'التغريدات الإيجابية' : selectedKPI.type === 'negative' ? 'الشكاوى والمشاكل' : 'جميع التغريدات'}
                <Badge className="bg-foreground text-primary-foreground">{filteredTweets.length}</Badge>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedKPI(null)} className="border border-border">
                <X className="h-4 w-4 ml-1" /> إغلاق
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TweetSortControls activeSort={sortKey} onSortChange={setSortKey} direction={sortDirection} onDirectionChange={setSortDirection} />
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {filteredTweets.map(tweet => (
                <div key={tweet.id} className="p-4 bg-card border-2 rounded-2xl hover:border-border transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-bold">{tweet.author}</p>
                      <p className="text-sm mt-1">{tweet.text}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {tweet.keywords.map((kw, i) => (
                          <Badge key={i} variant={kw === selectedKPI.keyword ? 'default' : 'secondary'} className={`text-xs ${kw === selectedKPI.keyword ? 'bg-foreground text-primary-foreground' : ''}`}>{kw}</Badge>
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
