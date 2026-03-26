import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TweetsTable } from './TweetsTable';
import { SentimentPieChart } from './SentimentPieChart';
import { BarChart3, TrendingUp, MessageSquare, Hash } from 'lucide-react';

interface TweetSample {
  text: string;
  author: string;
  authorName?: string;
  authorVerified?: boolean;
  authorBlueVerified?: boolean;
  likes: number;
  retweets: number;
  replies: number;
  quotes?: number;
  bookmarks?: number;
  createdAt?: string;
  isRetweet?: boolean;
  isQuote?: boolean;
  reason: string;
  confidence: number;
  emotion: string;
  keywords: string[];
  url: string;
  matchedSearchTerms?: string[];
  matchedHandles?: string[];
}

interface AnalysisResultsProps {
  results: {
    totalTweets: number;
    analyzedTweets: number;
    sentiments: {
      positive: number;
      negative: number;
      neutral: number;
      percentages: {
        positive: string;
        negative: string;
        neutral: string;
      };
    };
    emotions?: Record<string, number>;
    topKeywords?: Array<{ keyword: string; count: number }>;
    themes?: string[];
    mainIssues?: string[];
    insights: string;
    recommendations: string | string[]; // Support both string and array
    sentimentSummary?: {
      dominant_sentiment: string;
      trend: string;
      engagement_correlation: string;
    };
    allTweets?: TweetSample[]; // All analyzed tweets
    sampleTweets: {
      positive: TweetSample[];
      negative: TweetSample[];
      neutral: TweetSample[];
    };
    performance?: {
      totalDuration: number;
      dataCollectionDuration: number;
      analysisDuration: number;
    };
  };
}

export const AnalysisResults = ({ results }: AnalysisResultsProps) => {
  // Emotion mapping for Arabic display
  const emotionMap: Record<string, string> = {
    'فرح': 'فرح',
    'غضب': 'غضب',
    'حزن': 'حزن',
    'مفاجأة': 'مفاجأة',
    'محايد': 'محايد',
    'حماس': 'حماس',
    'إحباط': 'إحباط',
    'قلق': 'قلق',
    // English fallbacks (in case old data exists)
    'joy': 'فرح',
    'anger': 'غضب',
    'sadness': 'حزن',
    'surprise': 'مفاجأة',
    'neutral': 'محايد',
    'excitement': 'حماس',
    'frustration': 'إحباط',
    'anxiety': 'قلق'
  };

  // Use allTweets if available, otherwise fall back to sample tweets
  const allTweets = results.allTweets && results.allTweets.length > 0 
    ? results.allTweets.map(tweet => ({
        ...tweet,
        // Ensure all numeric fields have defaults
        likes: tweet.likes ?? 0,
        retweets: tweet.retweets ?? 0,
        replies: tweet.replies ?? 0,
        quotes: tweet.quotes ?? 0,
        bookmarks: tweet.bookmarks ?? 0,
        confidence: tweet.confidence ?? 0,
        // Ensure all string fields have defaults
        text: tweet.text || '',
        author: tweet.author || 'مجهول',
        authorName: tweet.authorName || tweet.author || 'مجهول',
        reason: tweet.reason || '',
        emotion: tweet.emotion || '',
        url: tweet.url || '',
        createdAt: tweet.createdAt || '',
        // Ensure arrays exist
        keywords: Array.isArray(tweet.keywords) ? tweet.keywords : [],
        matchedSearchTerms: Array.isArray(tweet.matchedSearchTerms) ? tweet.matchedSearchTerms : [],
        matchedHandles: Array.isArray(tweet.matchedHandles) ? tweet.matchedHandles : []
      }))
    : [
        ...results.sampleTweets.positive.map(t => ({ 
          ...t, 
          sentiment: 'positive' as const,
          likes: t.likes ?? 0,
          retweets: t.retweets ?? 0,
          replies: t.replies ?? 0,
          quotes: t.quotes ?? 0,
          bookmarks: t.bookmarks ?? 0,
          confidence: t.confidence ?? 0,
          text: t.text || '',
          author: t.author || 'مجهول',
          authorName: t.authorName || t.author || 'مجهول',
          reason: t.reason || '',
          emotion: t.emotion || '',
          url: t.url || '',
          createdAt: t.createdAt || '',
          keywords: Array.isArray(t.keywords) ? t.keywords : [],
          matchedSearchTerms: Array.isArray(t.matchedSearchTerms) ? t.matchedSearchTerms : [],
          matchedHandles: Array.isArray(t.matchedHandles) ? t.matchedHandles : []
        })),
        ...results.sampleTweets.negative.map(t => ({ 
          ...t, 
          sentiment: 'negative' as const,
          likes: t.likes ?? 0,
          retweets: t.retweets ?? 0,
          replies: t.replies ?? 0,
          quotes: t.quotes ?? 0,
          bookmarks: t.bookmarks ?? 0,
          confidence: t.confidence ?? 0,
          text: t.text || '',
          author: t.author || 'مجهول',
          authorName: t.authorName || t.author || 'مجهول',
          reason: t.reason || '',
          emotion: t.emotion || '',
          url: t.url || '',
          createdAt: t.createdAt || '',
          keywords: Array.isArray(t.keywords) ? t.keywords : [],
          matchedSearchTerms: Array.isArray(t.matchedSearchTerms) ? t.matchedSearchTerms : [],
          matchedHandles: Array.isArray(t.matchedHandles) ? t.matchedHandles : []
        })),
        ...results.sampleTweets.neutral.map(t => ({ 
          ...t, 
          sentiment: 'neutral' as const,
          likes: t.likes ?? 0,
          retweets: t.retweets ?? 0,
          replies: t.replies ?? 0,
          quotes: t.quotes ?? 0,
          bookmarks: t.bookmarks ?? 0,
          confidence: t.confidence ?? 0,
          text: t.text || '',
          author: t.author || 'مجهول',
          authorName: t.authorName || t.author || 'مجهول',
          reason: t.reason || '',
          emotion: t.emotion || '',
          url: t.url || '',
          createdAt: t.createdAt || '',
          keywords: Array.isArray(t.keywords) ? t.keywords : [],
          matchedSearchTerms: Array.isArray(t.matchedSearchTerms) ? t.matchedSearchTerms : [],
          matchedHandles: Array.isArray(t.matchedHandles) ? t.matchedHandles : []
        }))
      ];

  // Convert recommendations to array if it's a string
  const recommendationsArray = Array.isArray(results.recommendations) 
    ? results.recommendations 
    : results.recommendations.split('\n').filter(line => line.trim());

  console.log('📊 Analysis Results:', {
    totalTweets: results.totalTweets,
    analyzedTweets: results.analyzedTweets,
    allTweetsCount: allTweets.length,
    hasAllTweets: !!results.allTweets,
    firstTweetSample: allTweets[0] ? {
      text: allTweets[0].text?.substring(0, 50),
      likes: allTweets[0].likes,
      author: allTweets[0].author,
      url: allTweets[0].url
    } : 'No tweets'
  });

  return (
    <div className="space-y-12">
      {/* Statistics Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-muted-foreground">إجمالي التغريدات</p>
              <p className="text-5xl font-bold mt-2">{results.totalTweets}</p>
              <p className="text-xs mt-1">تم تحليل {results.analyzedTweets}</p>
            </div>
            <MessageSquare className="h-16 w-16 text-foreground" strokeWidth={2.5} />
          </div>
        </Card>

        <Card className="p-6 border border-border bg-foreground text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold opacity-80">المشاعر الإيجابية</p>
              <p className="text-5xl font-bold mt-2">{results.sentiments.positive}</p>
              <p className="text-xs mt-1 opacity-70">{results.sentiments.percentages.positive}%</p>
            </div>
            <TrendingUp className="h-16 w-16" strokeWidth={2.5} />
          </div>
        </Card>

        <Card className="p-6 border border-border bg-foreground/90 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold opacity-80">المشاعر السلبية</p>
              <p className="text-5xl font-bold mt-2">{results.sentiments.negative}</p>
              <p className="text-xs mt-1 opacity-70">{results.sentiments.percentages.negative}%</p>
            </div>
            <BarChart3 className="h-16 w-16" strokeWidth={2.5} />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <SentimentPieChart
          positive={results.sentiments.positive}
          negative={results.sentiments.negative}
          neutral={results.sentiments.neutral}
        />

        {/* Key Topics */}
        {results.themes && results.themes.length > 0 && (
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Hash className="h-6 w-6" strokeWidth={2.5} />
              <h3 className="text-2xl font-bold">المواضيع المتكررة</h3>
            </div>
            <div className="space-y-3">
              {results.themes.map((theme, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-foreground text-primary-foreground flex items-center justify-center rounded-xl font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-lg font-bold">{theme}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Keywords */}
        {results.topKeywords && results.topKeywords.length > 0 && (
          <Card className="p-6 border border-border">
            <h3 className="text-2xl font-bold mb-6">الكلمات المفتاحية</h3>
            <div className="space-y-2">
              {results.topKeywords.map(({ keyword, count }, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 border border-gray-300">
                  <span className="font-bold">{keyword}</span>
                  <Badge variant="outline" className="font-bold">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Emotions Distribution */}
        {results.emotions && Object.keys(results.emotions).length > 0 && (
          <Card className="p-6 border border-border">
            <h3 className="text-2xl font-bold mb-6">العواطف السائدة</h3>
            <div className="space-y-3">
              {Object.entries(results.emotions)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, count]) => (
                  <div key={emotion} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{emotionMap[emotion] || emotion}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="h-3 bg-gray-200 border border-border">
                      <div
                        className="h-full bg-foreground"
                        style={{ width: `${(count / results.totalTweets) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      {/* Insights & Recommendations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {results.mainIssues && results.mainIssues.length > 0 && (
          <Card className="p-6 border-2 border-red-600 bg-red-50">
            <h3 className="text-2xl font-bold mb-4 border-b-2 border-red-600 pb-2 text-red-900">
              🚨 المشاكل والشكاوى الرئيسية
            </h3>
            <ul className="space-y-3">
              {results.mainIssues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-3 text-red-900">
                  <span className="flex-shrink-0 w-6 h-6 bg-thmanyah-red text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-bold leading-relaxed">{issue}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {results.insights && (
          <Card className="p-6 border border-border">
            <h3 className="text-2xl font-bold mb-4 border-b-2 border-border pb-2">
              الرؤى والملاحظات
            </h3>
            <p className="leading-relaxed whitespace-pre-wrap font-medium">
              {results.insights}
            </p>
          </Card>
        )}

        {results.recommendations && (
          <Card className="p-6 border border-border bg-foreground text-primary-foreground">
            <h3 className="text-2xl font-bold mb-4 border-b-2 border-white pb-2">
              التوصيات
            </h3>
            <ul className="space-y-3">
              {recommendationsArray.map((recommendation, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-card text-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Tweets Table */}
      <TweetsTable tweets={allTweets} title="جميع التغريدات المحللة" />
    </div>
  );
};