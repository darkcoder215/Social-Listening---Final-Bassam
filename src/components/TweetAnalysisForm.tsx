import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Plus, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { loadApiKeys, hasRequiredKeys, loadSelectedModel, loadMetrics, buildMetricsSchema, buildMetricsPromptSection } from '@/lib/settings';

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

interface AnalysisResult {
  success: boolean;
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
  recommendations: string | string[];
  sentimentSummary?: {
    dominant_sentiment: string;
    trend: string;
    engagement_correlation: string;
  };
  sampleTweets: {
    positive: TweetSample[];
    negative: TweetSample[];
    neutral: TweetSample[];
  };
}

interface TweetAnalysisFormProps {
  onResults: (results: AnalysisResult) => void;
  onAnalysisStart: () => void;
  onError: (error: string) => void;
}

export const TweetAnalysisForm = ({ onResults, onAnalysisStart, onError }: TweetAnalysisFormProps) => {
  const [searchTerms, setSearchTerms] = useState<string[]>(['ثمانية']);
  const [twitterHandles, setTwitterHandles] = useState<string[]>(['thmanyahsports']);
  const [maxItems, setMaxItems] = useState('20');
  const [sort, setSort] = useState('Latest');
  const [startDate, setStartDate] = useState('2025-08-01');
  const [endDate, setEndDate] = useState('2025-11-02');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addSearchTerm = () => {
    setSearchTerms([...searchTerms, '']);
  };

  const removeSearchTerm = (index: number) => {
    if (searchTerms.length > 1) {
      setSearchTerms(searchTerms.filter((_, i) => i !== index));
    }
  };

  const updateSearchTerm = (index: number, value: string) => {
    const updated = [...searchTerms];
    updated[index] = value;
    setSearchTerms(updated);
  };

  const addTwitterHandle = () => {
    setTwitterHandles([...twitterHandles, '']);
  };

  const removeTwitterHandle = (index: number) => {
    if (twitterHandles.length > 1) {
      setTwitterHandles(twitterHandles.filter((_, i) => i !== index));
    }
  };

  const updateTwitterHandle = (index: number, value: string) => {
    const updated = [...twitterHandles];
    updated[index] = value;
    setTwitterHandles(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validTerms = searchTerms.filter(term => term.trim().length > 0);
    const validHandles = twitterHandles.filter(handle => handle.trim().length > 0);
    
    if (validTerms.length === 0 && validHandles.length === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال كلمة بحث أو حساب تويتر واحد على الأقل',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    onAnalysisStart();

    try {
      console.log('🚀 Starting analysis...', { 
        searchTerms: validTerms, 
        twitterHandles: validHandles,
        maxItems, 
        sort,
        dateRange: { start: startDate, end: endDate }
      });

      // Set a client-side timeout (10 minutes max)
      const ANALYSIS_TIMEOUT = 600000; // 10 minutes
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('تجاوز وقت التحليل الحد الأقصى (10 دقائق). يرجى تقليل عدد التغريدات والمحاولة مرة أخرى.')), ANALYSIS_TIMEOUT);
      });

      // Pass locally-stored API keys so the edge function can use them as fallback
      const storedKeys = loadApiKeys();
      const selectedModel = loadSelectedModel();
      const metrics = loadMetrics();
      const metricsSchema = buildMetricsSchema(metrics);
      const metricsPrompt = buildMetricsPromptSection(metrics);

      const analysisPromise = supabase.functions.invoke('analyze-tweets', {
        body: {
          searchTerms: validTerms,
          twitterHandles: validHandles,
          maxItems: parseInt(maxItems),
          sort,
          start: startDate,
          end: endDate,
          ...(storedKeys.apify && { apifyToken: storedKeys.apify }),
          ...(storedKeys.openrouter && { openrouterKey: storedKeys.openrouter }),
          ...(selectedModel && { model: selectedModel }),
          ...(metricsSchema && { customMetricsSchema: metricsSchema }),
          ...(metricsPrompt && { customMetricsPrompt: metricsPrompt }),
        }
      });

      const { data, error } = await Promise.race([
        analysisPromise,
        timeoutPromise
      ]) as { data: any; error: any };

      console.log('📥 Received response:', { 
        hasData: !!data, 
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        errorDetails: error,
        allTweetsCount: data?.allTweets?.length,
        sampleTweetsCount: data?.sampleTweets ? 
          (data.sampleTweets.positive?.length || 0) + 
          (data.sampleTweets.negative?.length || 0) + 
          (data.sampleTweets.neutral?.length || 0) : 0
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        const errorMsg = error instanceof Error ? error.message : 'فشل الاتصال بخدمة التحليل';
        throw new Error(errorMsg);
      }

      if (!data) {
        console.error('❌ No data received from analysis');
        throw new Error('لم يتم استلام بيانات من التحليل. يرجى المحاولة مرة أخرى.');
      }

      // Handle "no tweets found" case with helpful message
      if (data.error) {
        console.error('❌ Analysis error:', data.error);
        
        if (data.error.includes('No tweets') || data.error.includes('matched your search criteria')) {
          toast({
            title: 'لم يتم العثور على تغريدات',
            description: 'لم نتمكن من العثور على تغريدات تطابق معايير البحث. جرّب: توسيع نطاق التاريخ، تقليل فلاتر التفاعل، أو تغيير كلمات البحث.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        onError(data.error);
        throw new Error(data.error);
      }

      if (!data.success) {
        console.error('❌ Analysis not successful:', data);
        throw new Error(data.error || 'فشل التحليل بدون سبب واضح');
      }

      console.log('✅ Analysis successful:', {
        totalTweets: data.totalTweets,
        analyzedTweets: data.analyzedTweets,
        hasAllTweets: !!data.allTweets,
        allTweetsCount: data.allTweets?.length || 0,
        isPartial: data.isPartialResult,
        performance: data.performance,
        metadata: data.metadata
      });

      // Show warning if partial results
      if (data.isPartialResult || data.metadata?.warning) {
        toast({
          title: '⚠️ تحليل جزئي',
          description: data.metadata?.warning || `تم تحليل ${data.analyzedTweets} من ${data.totalTweets} تغريدة. للحصول على تحليل كامل، قلل عدد التغريدات.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'نجح التحليل!',
          description: `تم تحليل ${data.analyzedTweets} تغريدة بنجاح في ${(data.performance?.totalDuration / 1000).toFixed(1)} ثانية`,
        });
      }

      onResults(data as AnalysisResult);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = 'حدث خطأ أثناء التحليل';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.message.includes('timeout') || error.message.includes('وقت')) {
          errorDetails = 'المشكلة: استغرق التحليل وقتًا طويلاً جدًا. الحل: قلل عدد التغريدات إلى 50 أو أقل.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorDetails = 'المشكلة: خطأ في الاتصال بالشبكة. الحل: تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
        } else if (error.message.includes('credentials')) {
          errorDetails = 'المشكلة: خطأ في الإعدادات. الحل: تحقق من إعدادات النظام.';
        } else if (error.message.includes('Rate limit')) {
          errorDetails = 'المشكلة: تم تجاوز الحد الأقصى للطلبات. الحل: انتظر بضع دقائق ثم حاول مرة أخرى.';
        }
      } else {
        errorMessage = String(error);
      }
      
      onError(errorMessage);
      
      toast({
        title: 'فشل التحليل',
        description: (
          <div className="space-y-2">
            <p className="font-bold">{errorMessage}</p>
            {errorDetails && <p className="text-sm">{errorDetails}</p>}
          </div>
        ),
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const keysStatus = hasRequiredKeys();

  return (
    <Card className="p-8 border border-border shadow-lg">
      {!keysStatus.all && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-thmanyah-amber/10 border border-thmanyah-amber/20">
          <AlertTriangle className="w-5 h-5 text-thmanyah-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-foreground/80">مفاتيح API مطلوبة</p>
            <p className="text-[11px] font-bold text-muted-foreground/50 mt-1">
              {!keysStatus.apify && !keysStatus.openrouter
                ? "أضف مفتاح Apify و OpenRouter من صفحة الإعدادات لتفعيل التحليل."
                : !keysStatus.apify
                ? "أضف مفتاح Apify من صفحة الإعدادات لجلب التغريدات."
                : "أضف مفتاح OpenRouter من صفحة الإعدادات لتحليل المشاعر."}
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label className="text-xl font-bold">كلمات البحث</Label>
          {searchTerms.map((term, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={term}
                onChange={(e) => updateSearchTerm(index, e.target.value)}
                placeholder="أدخل كلمة البحث..."
                className="text-right"
              />
              {searchTerms.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeSearchTerm(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addSearchTerm}
            className="w-full"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة كلمة بحث
          </Button>
        </div>

        <div className="space-y-4">
          <Label className="text-xl font-bold">حسابات تويتر</Label>
          {twitterHandles.map((handle, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={handle}
                onChange={(e) => updateTwitterHandle(index, e.target.value)}
                placeholder="أدخل اسم الحساب..."
                className="text-right"
              />
              {twitterHandles.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTwitterHandle(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addTwitterHandle}
            className="w-full"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة حساب
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">من تاريخ</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">إلى تاريخ</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-right"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maxItems">عدد التغريدات</Label>
            <Input
              id="maxItems"
              type="number"
              min="10"
              max="5000"
              value={maxItems}
              onChange={(e) => setMaxItems(e.target.value)}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort">ترتيب النتائج</Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger id="sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Latest">الأحدث</SelectItem>
                <SelectItem value="Top">الأكثر تفاعلاً</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black hover:bg-gray-800 text-white text-lg h-14 font-bold border border-border"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 ml-2 animate-spin" />
              جاري التحليل...
            </>
          ) : (
            <>
              <Search className="h-6 w-6 ml-2" />
              تحليل التغريدات
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};