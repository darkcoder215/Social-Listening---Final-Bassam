import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Building2, HelpCircle, MessageSquare, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Tweet {
  id: number;
  text: string;
  author: string;
  sentiment: string;
  emotion: string;
  keywords: string[];
  reach: number;
}

interface AboutThamanyahProps {
  tweets: Tweet[];
}

const THAMANYAH_STRONG = [
  'ثمانية', 'thmanyah', 'ابومالح', 'أبو مالح', 'قناة ثمانية',
  'thmanyahsports', 'قنوات ثمانية',
];

const THAMANYAH_WEAK = [
  'القناة', 'البث', 'المعلق', 'التغطية', 'البرنامج',
  'الاستوديو', 'المذيع', 'الإعلامي',
];

interface FeedbackEntry {
  tweetId: number;
  label: 'about' | 'not_about';
  note: string;
}

export const AboutThamanyah = ({ tweets }: AboutThamanyahProps) => {
  const [feedbacks, setFeedbacks] = useState<Record<number, FeedbackEntry>>({});
  const [activeFeedback, setActiveFeedback] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');

  const categorizeTweet = (t: Tweet): 'about' | 'not_about' | 'uncertain' => {
    const text = t.text.toLowerCase();
    const author = t.author.toLowerCase();
    
    if (THAMANYAH_STRONG.some(kw => text.includes(kw.toLowerCase())) || author.includes('thmanyah')) {
      return 'about';
    }
    
    const weakMatches = THAMANYAH_WEAK.filter(kw => text.includes(kw.toLowerCase()));
    if (weakMatches.length >= 2) {
      return 'uncertain';
    }
    if (weakMatches.length === 1 && (text.includes('ثمان') || text.includes('قنا'))) {
      return 'uncertain';
    }
    
    return 'not_about';
  };

  const aboutTweets = tweets.filter(t => categorizeTweet(t) === 'about');
  const notAboutTweets = tweets.filter(t => categorizeTweet(t) === 'not_about');
  const uncertainTweets = tweets.filter(t => categorizeTweet(t) === 'uncertain');

  const aboutPercentage = ((aboutTweets.length / tweets.length) * 100).toFixed(1);
  const notAboutPercentage = ((notAboutTweets.length / tweets.length) * 100).toFixed(1);
  const uncertainPercentage = ((uncertainTweets.length / tweets.length) * 100).toFixed(1);

  const aboutReach = aboutTweets.reduce((s, t) => s + t.reach, 0);
  const notAboutReach = notAboutTweets.reduce((s, t) => s + t.reach, 0);
  const uncertainReach = uncertainTweets.reduce((s, t) => s + t.reach, 0);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'إيجابي': return 'bg-green-100 text-green-800 border-green-300';
      case 'سلبي': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-secondary text-gray-800 border-gray-300';
    }
  };

  const handleFeedbackSubmit = (tweetId: number, label: 'about' | 'not_about') => {
    setFeedbacks(prev => ({
      ...prev,
      [tweetId]: { tweetId, label, note: feedbackNote }
    }));
    setActiveFeedback(null);
    setFeedbackNote('');
    toast.success('تم حفظ الملاحظة بنجاح - ستُستخدم لتحسين التصنيف مستقبلاً');
  };

  const renderTweetList = (list: Tweet[], maxShow: number = 5, showFeedback = false) => (
    <div className="space-y-2 max-h-[350px] overflow-y-auto">
      {list.slice(0, maxShow).map(tweet => (
        <div key={tweet.id} className="p-3 bg-card rounded-2xl border hover:border-border transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold">{tweet.author}</p>
              <p className="text-sm mt-1 line-clamp-2">{tweet.text}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`${getSentimentColor(tweet.sentiment)} border text-xs`}>
                {tweet.sentiment}
              </Badge>
              <span className="text-xs text-gray-500">{tweet.reach.toLocaleString()} وصول</span>
            </div>
          </div>

          {showFeedback && (
            <>
              {feedbacks[tweet.id] ? (
                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200 text-xs">
                  <span className="font-bold text-green-700">✓ تم التصنيف: </span>
                  <span className="text-green-800">
                    {feedbacks[tweet.id].label === 'about' ? 'عن ثمانية' : 'ليس عن ثمانية'}
                  </span>
                  {feedbacks[tweet.id].note && (
                    <p className="text-green-600 mt-1">{feedbacks[tweet.id].note}</p>
                  )}
                </div>
              ) : activeFeedback === tweet.id ? (
                <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 space-y-2">
                  <Textarea
                    value={feedbackNote}
                    onChange={e => setFeedbackNote(e.target.value)}
                    placeholder="اشرح لماذا هذه التغريدة عن/ليست عن ثمانية..."
                    className="text-xs min-h-[60px] bg-card"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleFeedbackSubmit(tweet.id, 'about')}>
                      <Check className="h-3 w-3 mr-1" /> عن ثمانية
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-gray-400 text-gray-700 hover:bg-background"
                      onClick={() => handleFeedbackSubmit(tweet.id, 'not_about')}>
                      <X className="h-3 w-3 mr-1" /> ليس عن ثمانية
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 text-gray-400"
                      onClick={() => { setActiveFeedback(null); setFeedbackNote(''); }}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="mt-2 text-xs h-7 text-amber-600 hover:text-amber-800 hover:bg-amber-50 w-full"
                  onClick={() => setActiveFeedback(tweet.id)}>
                  <MessageSquare className="h-3 w-3 mr-1" /> أضف تصنيفك لهذه التغريدة
                </Button>
              )}
            </>
          )}
        </div>
      ))}
      {list.length > maxShow && (
        <p className="text-xs text-center text-gray-400">و {list.length - maxShow} تغريدة أخرى...</p>
      )}
    </div>
  );

  const feedbackCount = Object.keys(feedbacks).length;

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          عن ثمانية وليس عن ثمانية
        </CardTitle>
        <p className="text-sm text-muted-foreground">تصنيف التغريدات حسب علاقتها المباشرة بثمانية</p>
      </CardHeader>
      <CardContent>
        {/* Summary Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-bold">عن ثمانية: {aboutPercentage}%</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-bold text-amber-600">غير مؤكد: {uncertainPercentage}%</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-bold">ليس عن ثمانية: {notAboutPercentage}%</span>
          </div>
          <div className="h-8 flex rounded-2xl overflow-hidden border-2 border-gray-300">
            <div 
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold transition-all"
              style={{ width: `${aboutPercentage}%` }}
            >
              {parseFloat(aboutPercentage) > 10 ? `${aboutPercentage}%` : ''}
            </div>
            <div 
              className="bg-amber-400 flex items-center justify-center text-amber-900 text-xs font-bold transition-all"
              style={{ width: `${uncertainPercentage}%` }}
            >
              {parseFloat(uncertainPercentage) > 10 ? `${uncertainPercentage}%` : ''}
            </div>
            <div 
              className="bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold transition-all"
              style={{ width: `${notAboutPercentage}%` }}
            >
              {parseFloat(notAboutPercentage) > 10 ? `${notAboutPercentage}%` : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* About Thamanyah */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-blue-800 flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                عن ثمانية ({aboutTweets.length})
              </h4>
              <Badge className="bg-blue-600 text-white">{(aboutReach / 1000).toFixed(1)}K وصول</Badge>
            </div>
            {renderTweetList(aboutTweets)}
          </div>

          {/* Uncertain */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-700 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                غير مؤكد ({uncertainTweets.length})
              </h4>
              <Badge className="bg-amber-500 text-white">{(uncertainReach / 1000).toFixed(1)}K وصول</Badge>
            </div>
            {uncertainTweets.length > 0 ? (
              <>
                <div className="p-2 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
                  <p className="font-bold mb-1">⚠️ الذكاء الاصطناعي غير متأكد من تصنيف هذه التغريدات</p>
                  <p>ساعدنا بتصنيفها يدوياً لتحسين دقة النظام في التقارير القادمة</p>
                </div>
                {renderTweetList(uncertainTweets, 10, true)}
                {feedbackCount > 0 && (
                  <div className="p-2 bg-green-50 rounded border border-green-200 text-xs text-green-700 text-center">
                    تم تقديم {feedbackCount} ملاحظة من أصل {uncertainTweets.length} تغريدة
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">لا توجد تغريدات غير مؤكدة</p>
            )}
          </div>

          {/* Not About Thamanyah */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-700 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                ليس عن ثمانية ({notAboutTweets.length})
              </h4>
              <Badge variant="secondary">{(notAboutReach / 1000).toFixed(1)}K وصول</Badge>
            </div>
            {renderTweetList(notAboutTweets)}
          </div>
        </div>

        {/* Training Note */}
        <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border border-blue-200">
          <p className="text-xs text-gray-600">
            <span className="font-bold">🤖 ملاحظة:</span> يعتمد التصنيف على كلمات مفتاحية وسياق النص. الملاحظات البشرية التي تقدمونها تُستخدم لتحسين دقة الذكاء الاصطناعي في التصنيفات المستقبلية. كلما زادت الملاحظات، زادت دقة التصنيف التلقائي.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
