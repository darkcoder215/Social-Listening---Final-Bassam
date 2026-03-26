import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Download, ChevronDown, ChevronUp, Link2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React, { useState, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface Tweet {
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
  url: string;
  sentiment?: string;
  confidence?: number;
  emotion?: string;
  reason?: string;
  keywords?: string[];
  matchedSearchTerms?: string[];
  matchedHandles?: string[];
}

interface TweetsTableProps {
  tweets: Tweet[];
  title: string;
}

export const TweetsTable = ({ tweets, title }: TweetsTableProps) => {
  const [sortBy, setSortBy] = useState<'date' | 'engagement' | 'sentiment' | 'confidence' | 'likes'>('engagement');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [tweetComments, setTweetComments] = useState<Record<number, string[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const handleAddComment = (idx: number) => {
    const text = (commentInputs[idx] || "").trim();
    if (!text) return;
    setTweetComments((prev) => ({ ...prev, [idx]: [...(prev[idx] || []), text] }));
    setCommentInputs((prev) => ({ ...prev, [idx]: "" }));
  };

  const handleCopyLink = (tweet: any, idx: number) => {
    const url = tweet.url && tweet.url !== '#' ? tweet.url : `${window.location.origin}/?tweet=${idx}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "تم نسخ الرابط", description: "تم نسخ رابط التغريدة إلى الحافظة" });
    });
  };

  // Safety check - ensure tweets is an array and filter out any invalid entries
  const validTweets = useMemo(() => {
    if (!Array.isArray(tweets)) {
      console.error('❌ tweets is not an array:', tweets);
      return [];
    }
    
    return tweets.filter(tweet => {
      if (!tweet || typeof tweet !== 'object') {
        console.warn('⚠️ Invalid tweet object:', tweet);
        return false;
      }
      if (!tweet.text) {
        console.warn('⚠️ Tweet missing text:', tweet);
        return false;
      }
      return true;
    }).map(tweet => ({
      ...tweet,
      // Ensure all numeric fields have safe defaults
      likes: tweet.likes ?? 0,
      retweets: tweet.retweets ?? 0,
      replies: tweet.replies ?? 0,
      quotes: tweet.quotes ?? 0,
      bookmarks: tweet.bookmarks ?? 0,
      confidence: tweet.confidence ?? 0,
      // Ensure all string fields have safe defaults
      text: tweet.text || '',
      author: tweet.author || 'unknown',
      authorName: tweet.authorName || tweet.author || 'مجهول',
      url: tweet.url || '',
      sentiment: tweet.sentiment || 'neutral',
      emotion: tweet.emotion || '',
      reason: tweet.reason || '',
      createdAt: tweet.createdAt || ''
    }));
  }, [tweets]);

  console.log('📋 TweetsTable rendering:', {
    inputTweets: tweets?.length || 0,
    validTweets: validTweets.length,
    firstTweet: validTweets[0] ? {
      text: validTweets[0].text?.substring(0, 30),
      likes: validTweets[0].likes,
      author: validTweets[0].author,
      url: validTweets[0].url
    } : null
  });

  if (validTweets.length === 0) {
    return (
      <div className="border border-border rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-muted-foreground">لا توجد تغريدات لعرضها</p>
      </div>
    );
  }

  const toggleRow = (idx: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedRows(newExpanded);
  };

  const toggleAllRows = () => {
    if (expandedRows.size === sortedTweets.length) {
      // If all are expanded, collapse all
      setExpandedRows(new Set());
    } else {
      // Otherwise, expand all
      setExpandedRows(new Set(sortedTweets.map((_, idx) => idx)));
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = sortedTweets.map((tweet, idx) => ({
        '#': idx + 1,
        'التغريدة': tweet.text,
        'الكاتب': `@${tweet.author}`,
        'الاسم': tweet.authorName || '-',
        'نوع المصدر': tweet.matchedHandles && tweet.matchedHandles.length > 0 ? 'من حساب' : tweet.matchedSearchTerms && tweet.matchedSearchTerms.length > 0 ? 'من كلمة مفتاحية' : '-',
        'التاريخ': formatDate(tweet.createdAt),
        'الإعجابات': tweet.likes,
        'إعادة التغريد': tweet.retweets,
        'الردود': tweet.replies,
        'الاقتباسات': tweet.quotes || 0,
        'الحفظ': tweet.bookmarks || 0,
        'التصنيف': tweet.sentiment === 'positive' ? 'إيجابي' : tweet.sentiment === 'negative' ? 'سلبي' : 'محايد',
        'المشاعر': getArabicEmotion(tweet.emotion),
        'الثقة': tweet.confidence ? `${(tweet.confidence * 100).toFixed(0)}%` : '-',
        'السبب': tweet.reason || '-',
        'الكلمات المفتاحية': tweet.keywords?.join(', ') || '-',
        'كلمات البحث': tweet.matchedSearchTerms?.join(', ') || '-',
        'الحسابات': tweet.matchedHandles?.join(', ') || '-',
        'الرابط': tweet.url
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'تحليل التغريدات');
      
      // Set column widths
      const colWidths = [
        { wch: 5 }, { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 40 }, { wch: 30 },
        { wch: 30 }, { wch: 30 }, { wch: 50 }
      ];
      worksheet['!cols'] = colWidths;

      const fileName = `تحليل_التغريدات_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${sortedTweets.length} تغريدة إلى ملف Excel`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive",
      });
    }
  };

  const sortedTweets = useMemo(() => {
    const tweetsToSort = [...validTweets];
    
    return tweetsToSort.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          compareValue = dateA - dateB;
          break;
          
        case 'engagement':
          const engagementA = (a.likes || 0) + (a.retweets || 0) + (a.replies || 0) + (a.quotes || 0) + (a.bookmarks || 0);
          const engagementB = (b.likes || 0) + (b.retweets || 0) + (b.replies || 0) + (b.quotes || 0) + (b.bookmarks || 0);
          compareValue = engagementA - engagementB;
          break;
          
        case 'likes':
          compareValue = (a.likes || 0) - (b.likes || 0);
          break;
          
        case 'sentiment':
          const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
          const sentimentA = sentimentOrder[a.sentiment as keyof typeof sentimentOrder] || 0;
          const sentimentB = sentimentOrder[b.sentiment as keyof typeof sentimentOrder] || 0;
          compareValue = sentimentA - sentimentB;
          break;
          
        case 'confidence':
          compareValue = (a.confidence || 0) - (b.confidence || 0);
          break;
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue;
    });
  }, [validTweets, sortBy, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
    
    const variants: Record<string, { label: string; className: string }> = {
      positive: { label: 'إيجابي', className: 'bg-thmanyah-green text-white' },
      negative: { label: 'سلبي', className: 'bg-thmanyah-red text-white' },
      neutral: { label: 'محايد', className: 'bg-secondary text-foreground' }
    };

    const config = variants[sentiment] || variants.neutral;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getEmotionBadge = (emotion?: string) => {
    if (!emotion) return null;
    
    const variants: Record<string, { label: string; className: string }> = {
      // Arabic emotions
      'فرح': { label: '😊 فرح', className: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
      'غضب': { label: '😠 غضب', className: 'bg-red-100 text-red-800 border border-red-300' },
      'حزن': { label: '😢 حزن', className: 'bg-blue-100 text-blue-800 border border-blue-300' },
      'مفاجأة': { label: '😲 مفاجأة', className: 'bg-purple-100 text-purple-800 border border-purple-300' },
      'حماس': { label: '🎉 حماس', className: 'bg-orange-100 text-orange-800 border border-orange-300' },
      'محايد': { label: '😐 محايد', className: 'bg-secondary text-gray-800 border border-gray-300' },
      'إحباط': { label: '😞 إحباط', className: 'bg-indigo-100 text-indigo-800 border border-indigo-300' },
      'قلق': { label: '😰 قلق', className: 'bg-pink-100 text-pink-800 border border-pink-300' },
      // English fallbacks (for old data)
      'joy': { label: '😊 فرح', className: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
      'anger': { label: '😠 غضب', className: 'bg-red-100 text-red-800 border border-red-300' },
      'sadness': { label: '😢 حزن', className: 'bg-blue-100 text-blue-800 border border-blue-300' },
      'surprise': { label: '😲 مفاجأة', className: 'bg-purple-100 text-purple-800 border border-purple-300' },
      'excitement': { label: '🎉 حماس', className: 'bg-orange-100 text-orange-800 border border-orange-300' },
      'neutral': { label: '😐 محايد', className: 'bg-secondary text-gray-800 border border-gray-300' }
    };

    const config = variants[emotion] || variants['محايد'];
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getArabicEmotion = (emotion?: string) => {
    if (!emotion) return '-';
    
    const emotionMap: Record<string, string> = {
      'فرح': 'فرح',
      'غضب': 'غضب',
      'حزن': 'حزن',
      'مفاجأة': 'مفاجأة',
      'حماس': 'حماس',
      'محايد': 'محايد',
      'إحباط': 'إحباط',
      'قلق': 'قلق',
      'joy': 'فرح',
      'anger': 'غضب',
      'sadness': 'حزن',
      'surprise': 'مفاجأة',
      'excitement': 'حماس',
      'neutral': 'محايد'
    };
    
    return emotionMap[emotion] || emotion;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-2xl font-bold">{title}</h3>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={exportToExcel}
            variant="default"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>

          <Button
            onClick={toggleAllRows}
            variant="outline"
            className="gap-2"
          >
            {expandedRows.size === sortedTweets.length ? (
              <>
                <ChevronUp className="h-4 w-4" />
                طي الكل
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                توسيع الكل
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">ترتيب حسب:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engagement">إجمالي التفاعل</SelectItem>
                <SelectItem value="likes">الإعجابات</SelectItem>
                <SelectItem value="date">التاريخ</SelectItem>
                <SelectItem value="sentiment">التصنيف</SelectItem>
                <SelectItem value="confidence">الثقة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDirection}
            className="flex-shrink-0"
            title={sortDirection === 'asc' ? 'تصاعدي' : 'تنازلي'}
          >
            {sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        عرض {sortedTweets.length} تغريدة
      </div>
      
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-foreground hover:bg-foreground">
                <TableHead className="text-primary-foreground font-bold text-right min-w-[50px]">#</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[300px]">التغريدة</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[150px]">الكاتب</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[150px]">المصدر</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[100px]">التاريخ</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[120px]">التفاعل</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[100px]">التصنيف</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[100px]">المشاعر</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[80px]">الثقة</TableHead>
                <TableHead className="text-primary-foreground font-bold text-right min-w-[200px]">السبب</TableHead>
                <TableHead className="text-white font-bold text-right min-w-[80px]">رابط</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTweets.map((tweet, idx) => (
                <React.Fragment key={idx}>
                <TableRow className="hover:bg-background">
                  <TableCell className="font-bold">{idx + 1}</TableCell>
                  
                  <TableCell className="max-w-md">
                    <Collapsible open={expandedRows.has(idx)} onOpenChange={() => toggleRow(idx)}>
                      <div className="space-y-2">
                        <CollapsibleTrigger className="flex items-start gap-2 w-full text-right hover:opacity-70">
                          <div className="flex-1">
                            <p className={`whitespace-pre-wrap break-words ${expandedRows.has(idx) ? "text-sm" : "line-clamp-2 text-sm"}`}>
                              {tweet.text}
                            </p>
                          </div>
                          {expandedRows.has(idx) ? (
                            <ChevronUp className="h-4 w-4 flex-shrink-0 mt-1" />
                          ) : (
                            <ChevronDown className="h-4 w-4 flex-shrink-0 mt-1" />
                          )}
                        </CollapsibleTrigger>
                        {tweet.keywords && tweet.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tweet.keywords.slice(0, 3).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Collapsible>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-sm">@{tweet.author}</span>
                        {tweet.authorVerified && <span title="موثق">✓</span>}
                        {tweet.authorBlueVerified && <span title="Twitter Blue">🔵</span>}
                      </div>
                      {tweet.authorName && tweet.authorName !== tweet.author && (
                        <p className="text-xs text-muted-foreground">{tweet.authorName}</p>
                      )}
                      {(tweet.isRetweet || tweet.isQuote) && (
                        <div className="flex gap-1">
                          {tweet.isRetweet && (
                            <Badge variant="outline" className="text-xs">🔁 إعادة</Badge>
                          )}
                          {tweet.isQuote && (
                            <Badge variant="outline" className="text-xs">💬 اقتباس</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {tweet.matchedHandles && tweet.matchedHandles.length > 0 ? (
                        <div className="space-y-1">
                          <Badge className="bg-thmanyah-green text-white text-xs font-bold mb-1">
                            من حساب
                          </Badge>
                          {tweet.matchedHandles.map((handle, i) => (
                            <Badge key={i} className="bg-green-100 text-green-800 text-xs">
                              @{handle}
                            </Badge>
                          ))}
                        </div>
                      ) : tweet.matchedSearchTerms && tweet.matchedSearchTerms.length > 0 ? (
                        <div className="space-y-1">
                          <Badge className="bg-blue-600 text-white text-xs font-bold mb-1">
                            من كلمة مفتاحية
                          </Badge>
                          {tweet.matchedSearchTerms.map((term, i) => (
                            <Badge key={i} className="bg-blue-100 text-blue-800 text-xs">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-xs">
                    {formatDate(tweet.createdAt)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <span>❤️ {(tweet.likes || 0).toLocaleString()}</span>
                      <span>🔁 {(tweet.retweets || 0).toLocaleString()}</span>
                      <span>💬 {(tweet.replies || 0).toLocaleString()}</span>
                      {tweet.quotes !== undefined && tweet.quotes > 0 && (
                        <span>💭 {tweet.quotes.toLocaleString()}</span>
                      )}
                      {tweet.bookmarks !== undefined && tweet.bookmarks > 0 && (
                        <span>🔖 {tweet.bookmarks.toLocaleString()}</span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getSentimentBadge(tweet.sentiment)}
                  </TableCell>
                  
                  <TableCell>
                    {getEmotionBadge(tweet.emotion)}
                  </TableCell>
                  
                  <TableCell>
                    {tweet.confidence ? (
                      <span className="font-bold">{(tweet.confidence * 100).toFixed(0)}%</span>
                    ) : '-'}
                  </TableCell>
                  
                  <TableCell className="max-w-xs">
                    {tweet.reason ? (
                      <Collapsible open={expandedRows.has(idx)} onOpenChange={() => toggleRow(idx)}>
                        <CollapsibleTrigger className="text-right w-full hover:opacity-70">
                          <p className={`text-xs whitespace-pre-wrap break-words ${expandedRows.has(idx) ? "" : "line-clamp-2"}`}>
                            <span className="font-bold">السبب: </span>
                            {tweet.reason}
                          </p>
                        </CollapsibleTrigger>
                      </Collapsible>
                    ) : '-'}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={tweet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-xs font-bold">عرض</span>
                      </a>
                      <button
                        onClick={() => handleCopyLink(tweet, idx)}
                        className="p-1 rounded-md hover:bg-muted/30 transition-colors"
                        title="نسخ الرابط"
                      >
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-thmanyah-blue transition-colors" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
                {/* ── Comment Section Row ── */}
                {expandedRows.has(idx) && (
                  <TableRow key={`comment-${idx}`} className="bg-muted/5 hover:bg-muted/5">
                    <TableCell colSpan={11} className="p-3">
                      <div className="max-w-2xl">
                        <div className="text-[10px] font-bold text-muted-foreground/40 mb-2">التعليقات</div>
                        {(tweetComments[idx] || []).length > 0 && (
                          <div className="space-y-1.5 mb-2.5">
                            {(tweetComments[idx] || []).map((c, ci) => (
                              <div key={ci} className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border/20">
                                <div className="w-5 h-5 rounded-full bg-thmanyah-green/10 flex items-center justify-center shrink-0">
                                  <span className="text-[8px] font-bold text-thmanyah-green">أ</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-muted-foreground/40">أنت</span>
                                  <p className="text-[11px] font-bold text-foreground/70">{c}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentInputs[idx] || ""}
                            onChange={(e) => setCommentInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(idx); }}
                            placeholder="أضف تعليقاً..."
                            className="flex-1 py-2 px-3 rounded-lg bg-card border border-border/30 text-[11px] font-bold text-foreground/80 placeholder:text-muted-foreground/25 placeholder:font-bold focus:outline-none focus:ring-1 focus:ring-thmanyah-green/20 focus:border-thmanyah-green/30 transition-all"
                          />
                          <button
                            onClick={() => handleAddComment(idx)}
                            className="p-2 rounded-lg bg-thmanyah-green/10 border border-thmanyah-green/20 hover:bg-thmanyah-green/20 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5 text-thmanyah-green" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};