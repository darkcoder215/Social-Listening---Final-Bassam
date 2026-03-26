import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Heart, 
  TrendingUp, 
  MessageSquare, 
  Target, 
  Lightbulb,
  AlertCircle,
  BarChart3,
  Users,
  CheckCircle,
  Save,
  X,
  Check,
  FileText,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface ApprovalStatus {
  [key: string]: 'approved' | 'rejected' | null;
}

interface Notes {
  [key: string]: string;
}

export const AnalysisDocumentation = () => {
  const [notes, setNotes] = useState<Notes>({
    sentimentClassification: '',
    emotionAnalysis: '',
    keywordsExtraction: '',
    themesIdentification: '',
    engagementMetrics: '',
    insightsGeneration: '',
    mainIssues: '',
    recommendations: '',
    finalReport: ''
  });

  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>({
    sentimentClassification: null,
    emotionAnalysis: null,
    keywordsExtraction: null,
    themesIdentification: null,
    engagementMetrics: null,
    insightsGeneration: null,
    mainIssues: null,
    recommendations: null,
    finalReport: null
  });

  useEffect(() => {
    const savedNotes = localStorage.getItem('analysisDocNotes');
    const savedApprovals = localStorage.getItem('analysisDocApprovals');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    if (savedApprovals) {
      setApprovalStatus(JSON.parse(savedApprovals));
    }
  }, []);

  const handleNoteChange = (section: string, value: string) => {
    setNotes(prev => ({ ...prev, [section]: value }));
  };

  const handleApproval = (section: string, status: 'approved' | 'rejected') => {
    setApprovalStatus(prev => ({ ...prev, [section]: status }));
  };

  const saveAll = () => {
    localStorage.setItem('analysisDocNotes', JSON.stringify(notes));
    localStorage.setItem('analysisDocApprovals', JSON.stringify(approvalStatus));
    toast.success('تم حفظ جميع الملاحظات والموافقات بنجاح');
  };

  const ApprovalButtons = ({ section }: { section: string }) => (
    <div className="flex gap-2 mt-3">
      <Button
        variant={approvalStatus[section] === 'approved' ? 'default' : 'outline'}
        className={`gap-2 ${approvalStatus[section] === 'approved' ? 'bg-thmanyah-green hover:bg-green-700' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
        onClick={() => handleApproval(section, 'approved')}
      >
        <Check className="h-4 w-4" />
        معتمد
      </Button>
      <Button
        variant={approvalStatus[section] === 'rejected' ? 'default' : 'outline'}
        className={`gap-2 ${approvalStatus[section] === 'rejected' ? 'bg-thmanyah-red hover:bg-red-700' : 'border-red-600 text-red-600 hover:bg-red-50'}`}
        onClick={() => handleApproval(section, 'rejected')}
      >
        <X className="h-4 w-4" />
        غير معتمد
      </Button>
    </div>
  );

  const NoteSection = ({ section, placeholder }: { section: string; placeholder: string }) => (
    <div className="bg-muted/50 p-4 rounded-2xl border mt-4">
      <div className="flex items-center justify-between mb-2">
        <label className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          ملاحظات الفريق
        </label>
        {approvalStatus[section] && (
          <Badge className={approvalStatus[section] === 'approved' ? 'bg-thmanyah-green' : 'bg-thmanyah-red'}>
            {approvalStatus[section] === 'approved' ? 'معتمد ✓' : 'غير معتمد ✗'}
          </Badge>
        )}
      </div>
      <Textarea 
        placeholder={placeholder}
        value={notes[section]}
        onChange={(e) => handleNoteChange(section, e.target.value)}
        className="min-h-[80px] text-right"
        dir="rtl"
      />
      <ApprovalButtons section={section} />
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">دليل تحليل التغريدات</h2>
          <p className="text-muted-foreground mt-1">
            شرح شامل لكل ما نحلله ونستخرجه من التغريدات
          </p>
        </div>
        <Button onClick={saveAll} className="gap-2">
          <Save className="h-4 w-4" />
          حفظ الكل
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['sentiment', 'emotion', 'keywords']} className="space-y-4">
        
        {/* تصنيف المشاعر */}
        <AccordionItem value="sentiment" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-md">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة الأولى: تصنيف المشاعر</h3>
                <p className="text-sm text-muted-foreground">هل التغريدة إيجابية أم سلبية أم محايدة؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                نقرأ كل تغريدة ونحدد هل صاحبها يعبر عن شعور إيجابي (رضا، إعجاب، سعادة) أو سلبي (شكوى، غضب، انتقاد) أو محايد (خبر، معلومة بدون رأي)
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-green-500 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    إيجابي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">معناه:</p>
                  <p className="text-sm mb-3">الشخص راضي أو سعيد أو يمدح الخدمة/المنتج</p>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-2xl">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">مثال:</p>
                    <p className="text-sm italic">"خدمة ممتازة! فريق العمل تجاوز توقعاتي 🎉"</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-red-500 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    سلبي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">معناه:</p>
                  <p className="text-sm mb-3">الشخص غاضب أو محبط أو يشتكي من مشكلة</p>
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">مثال:</p>
                    <p className="text-sm italic">"خدمة العملاء سيئة جداً! 3 أيام وما أحد رد علي"</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-400 border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-600 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    محايد
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 font-semibold">معناه:</p>
                  <p className="text-sm mb-3">مجرد خبر أو معلومة بدون تعبير عن رأي واضح</p>
                  <div className="p-3 bg-background dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">مثال:</p>
                    <p className="text-sm italic">"الشركة أعلنت عن أسعار جديدة الشهر الجاي"</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>نسبة التغريدات الإيجابية من المجموع</li>
                <li>نسبة التغريدات السلبية من المجموع</li>
                <li>نسبة التغريدات المحايدة من المجموع</li>
                <li>رسم بياني دائري يوضح التوزيع</li>
              </ul>
            </div>
            
            <NoteSection 
              section="sentimentClassification" 
              placeholder="أضف ملاحظاتك هنا عن طريقة تصنيف المشاعر..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* تحليل المشاعر التفصيلي */}
        <AccordionItem value="emotion" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة الثانية: تحديد نوع الشعور</h3>
                <p className="text-sm text-muted-foreground">ما هو الشعور بالتحديد؟ (فرح، غضب، حزن، إلخ)</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                بعد معرفة إذا التغريدة إيجابية أو سلبية، نحدد الشعور الدقيق - مثلاً: هل هو غضب؟ إحباط؟ قلق؟ فرح؟ حماس؟
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { emotion: 'فرح', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', example: 'سعادة بالخدمة، احتفال بإنجاز' },
                { emotion: 'غضب', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', example: 'غضب شديد من مشكلة' },
                { emotion: 'حزن', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', example: 'خيبة أمل، حزن من تجربة' },
                { emotion: 'مفاجأة', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', example: 'صدمة من خبر غير متوقع' },
                { emotion: 'حماس', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', example: 'تشوق وحماس لشيء جديد' },
                { emotion: 'إحباط', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300', example: 'مشاكل متكررة بدون حل' },
                { emotion: 'قلق', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', example: 'خوف من المستقبل' },
                { emotion: 'محايد', color: 'bg-secondary text-gray-800 dark:bg-gray-800/50 dark:text-gray-300', example: 'بدون شعور واضح' }
              ].map((item) => (
                <Card key={item.emotion} className="border">
                  <CardContent className="p-3">
                    <Badge className={`${item.color} mb-2`}>{item.emotion}</Badge>
                    <p className="text-xs text-muted-foreground">{item.example}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>قائمة بكل المشاعر المكتشفة</li>
                <li>عدد التغريدات لكل نوع شعور</li>
                <li>الشعور الأكثر شيوعاً بين الناس</li>
              </ul>
            </div>
            
            <NoteSection 
              section="emotionAnalysis" 
              placeholder="أضف ملاحظاتك هنا عن أنواع المشاعر المطلوبة..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* استخراج الكلمات المفتاحية */}
        <AccordionItem value="keywords" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-md">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة الثالثة: استخراج الكلمات المهمة</h3>
                <p className="text-sm text-muted-foreground">ما هي الكلمات التي تتكرر كثيراً؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                نستخرج الكلمات والعبارات الأكثر أهمية وتكراراً في التغريدات لفهم ما يتحدث عنه الناس بالضبط
              </p>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">مثال على الكلمات المستخرجة:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-sm">خدمة العملاء (45 مرة)</Badge>
                  <Badge variant="secondary" className="text-sm">التطبيق (32 مرة)</Badge>
                  <Badge variant="secondary" className="text-sm">الأسعار (28 مرة)</Badge>
                  <Badge variant="secondary" className="text-sm">التوصيل (24 مرة)</Badge>
                  <Badge variant="secondary" className="text-sm">الجودة (20 مرة)</Badge>
                  <Badge variant="secondary" className="text-sm">الدعم الفني (18 مرة)</Badge>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>قائمة بأهم 10 كلمات مع عدد تكرار كل واحدة</li>
                <li>الكلمات الأكثر ارتباطاً بالتغريدات السلبية</li>
                <li>الكلمات الأكثر ارتباطاً بالتغريدات الإيجابية</li>
              </ul>
            </div>
            
            <NoteSection 
              section="keywordsExtraction" 
              placeholder="أضف ملاحظاتك هنا عن الكلمات المفتاحية المطلوبة..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* تحديد المواضيع */}
        <AccordionItem value="themes" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة الرابعة: تحديد المواضيع الرئيسية</h3>
                <p className="text-sm text-muted-foreground">ما هي المواضيع التي يتحدث عنها الناس؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-2xl border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                نجمع التغريدات المتشابهة ونحدد المواضيع الكبيرة اللي يتكلم عنها الناس - مثلاً: مشاكل التوصيل، جودة المنتج، خدمة العملاء
              </p>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">مثال على المواضيع المكتشفة:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                  <Badge className="bg-blue-500">1</Badge>
                  <div>
                    <p className="font-semibold">جودة خدمة العملاء</p>
                    <p className="text-sm text-muted-foreground">35% من التغريدات تتحدث عن هذا الموضوع</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                  <Badge className="bg-green-500">2</Badge>
                  <div>
                    <p className="font-semibold">الأسعار والتسعير</p>
                    <p className="text-sm text-muted-foreground">25% من التغريدات تتحدث عن هذا الموضوع</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                  <Badge className="bg-orange-500">3</Badge>
                  <div>
                    <p className="font-semibold">سرعة التوصيل</p>
                    <p className="text-sm text-muted-foreground">20% من التغريدات تتحدث عن هذا الموضوع</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>قائمة بأهم 5 مواضيع يتحدث عنها الناس</li>
                <li>نسبة كل موضوع من إجمالي التغريدات</li>
                <li>هل الموضوع أغلبه إيجابي أو سلبي</li>
              </ul>
            </div>
            
            <NoteSection 
              section="themesIdentification" 
              placeholder="أضف ملاحظاتك هنا عن تصنيف المواضيع..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* مقاييس التفاعل */}
        <AccordionItem value="engagement" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-md">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة الخامسة: قياس التفاعل</h3>
                <p className="text-sm text-muted-foreground">كم إعجاب وريتويت وتعليق حصلت كل تغريدة؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-2xl border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                نجمع أرقام التفاعل على كل تغريدة (إعجابات، ريتويت، ردود) لنعرف أي التغريدات انتشرت أكثر وأي المشاكل وصلت لأكبر عدد من الناس
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="text-center border-2">
                <CardContent className="p-4">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="font-bold text-lg">إعجابات</p>
                  <p className="text-sm text-muted-foreground">عدد الناس اللي عجبتهم التغريدة</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2">
                <CardContent className="p-4">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-bold text-lg">إعادة تغريد</p>
                  <p className="text-sm text-muted-foreground">عدد الناس اللي نشروا التغريدة</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2">
                <CardContent className="p-4">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-bold text-lg">ردود</p>
                  <p className="text-sm text-muted-foreground">عدد التعليقات على التغريدة</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2">
                <CardContent className="p-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="font-bold text-lg">وصول</p>
                  <p className="text-sm text-muted-foreground">تقدير عدد الناس اللي شافوها</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>أكثر 10 تغريدات حصلت على تفاعل</li>
                <li>متوسط التفاعل على التغريدات الإيجابية مقارنة بالسلبية</li>
                <li>هل التغريدات السلبية تنتشر أكثر؟</li>
              </ul>
            </div>
            
            <NoteSection 
              section="engagementMetrics" 
              placeholder="أضف ملاحظاتك هنا عن مقاييس التفاعل..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* الرؤى والاستنتاجات */}
        <AccordionItem value="insights" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500 rounded-md">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة السادسة: استخلاص الرؤى</h3>
                <p className="text-sm text-muted-foreground">ما هي الاستنتاجات والملاحظات المهمة؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-cyan-50 dark:bg-cyan-950/30 p-4 rounded-2xl border border-cyan-200 dark:border-cyan-800">
              <h4 className="font-semibold text-cyan-800 dark:text-cyan-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                بعد تحليل كل شيء، نكتب ملخص ذكي يشرح ما وجدناه بطريقة واضحة ومفهومة لصانعي القرار
              </p>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">مثال على رؤية مستخلصة:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-2xl border-r-4 border-cyan-500">
                  <p className="text-sm leading-relaxed">
                    "لاحظنا زيادة ملحوظة في الشكاوى المتعلقة بتأخر التوصيل خلال الأسبوع الماضي بنسبة 40%. أغلب هذه الشكاوى جاءت من منطقة الرياض تحديداً. التغريدات السلبية عن التوصيل حصلت على تفاعل أعلى بـ 3 مرات من المتوسط مما يدل على أن الموضوع يهم شريحة كبيرة من العملاء."
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>ملخص تنفيذي في 3-5 نقاط</li>
                <li>أهم الملاحظات التي تحتاج انتباه</li>
                <li>مقارنة مع الفترة السابقة إن وجدت</li>
              </ul>
            </div>
            
            <NoteSection 
              section="insightsGeneration" 
              placeholder="أضف ملاحظاتك هنا عن نوعية الرؤى المطلوبة..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* المشاكل الرئيسية */}
        <AccordionItem value="issues" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-md">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة السابعة: تحديد المشاكل الرئيسية</h3>
                <p className="text-sm text-muted-foreground">ما هي أكبر المشاكل التي يشتكي منها الناس؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-2xl border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                نركز على التغريدات السلبية ونجمع المشاكل المتشابهة في قائمة مرتبة حسب الأهمية وعدد التكرار
              </p>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">مثال على المشاكل المكتشفة:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                  <Badge className="bg-thmanyah-red mt-1">1</Badge>
                  <div>
                    <p className="font-semibold">تأخر الرد على الاستفسارات</p>
                    <p className="text-sm text-muted-foreground">تكرر في 23 تغريدة - "انتظرت 3 أيام ولا أحد رد"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                  <Badge className="bg-red-500 mt-1">2</Badge>
                  <div>
                    <p className="font-semibold">تأخر التوصيل عن الموعد</p>
                    <p className="text-sm text-muted-foreground">تكرر في 18 تغريدة - "الطلب ما وصل في الوقت"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl">
                  <Badge className="bg-red-400 mt-1">3</Badge>
                  <div>
                    <p className="font-semibold">مشاكل في التطبيق</p>
                    <p className="text-sm text-muted-foreground">تكرر في 12 تغريدة - "التطبيق يعلق ويطلع"</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>قائمة بأهم 5 مشاكل مرتبة حسب التكرار</li>
                <li>أمثلة حقيقية من التغريدات لكل مشكلة</li>
                <li>نسبة كل مشكلة من إجمالي الشكاوى</li>
              </ul>
            </div>
            
            <NoteSection 
              section="mainIssues" 
              placeholder="أضف ملاحظاتك هنا عن تصنيف المشاكل..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* التوصيات */}
        <AccordionItem value="recommendations" className="border-2 rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">المرحلة الثامنة: التوصيات</h3>
                <p className="text-sm text-muted-foreground">ما الذي يجب فعله لتحسين الوضع؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">ماذا نفعل؟</h4>
              <p className="text-sm">
                بناءً على المشاكل والرؤى المكتشفة، نقدم توصيات عملية وواضحة يمكن تنفيذها لتحسين تجربة العملاء
              </p>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">مثال على التوصيات:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-1" />
                  <div>
                    <p className="font-semibold">تقليل وقت الرد على العملاء</p>
                    <p className="text-sm text-muted-foreground">نقترح تعيين موظفين إضافيين أو استخدام ردود آلية للاستفسارات الشائعة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-1" />
                  <div>
                    <p className="font-semibold">تحسين نظام تتبع الطلبات</p>
                    <p className="text-sm text-muted-foreground">إضافة إشعارات تلقائية للعميل عند كل مرحلة من مراحل التوصيل</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-1" />
                  <div>
                    <p className="font-semibold">إصلاح مشاكل التطبيق</p>
                    <p className="text-sm text-muted-foreground">مراجعة تقارير الأخطاء وإصدار تحديث عاجل لإصلاح مشاكل التعليق</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">🎯 ما يظهر في التقرير النهائي:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>3-5 توصيات عملية وقابلة للتنفيذ</li>
                <li>ترتيب التوصيات حسب الأولوية والتأثير</li>
                <li>ربط كل توصية بالمشكلة التي تحلها</li>
              </ul>
            </div>
            
            <NoteSection 
              section="recommendations" 
              placeholder="أضف ملاحظاتك هنا عن نوعية التوصيات المطلوبة..."
            />
          </AccordionContent>
        </AccordionItem>

        {/* شكل التقرير النهائي */}
        <AccordionItem value="finalReport" className="border-2 border-primary rounded-2xl overflow-hidden">
          <AccordionTrigger className="px-6 py-4 bg-primary/10 hover:bg-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-md">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">شكل التقرير النهائي</h3>
                <p className="text-sm text-muted-foreground">كيف يبدو التقرير الذي نقدمه؟</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 py-4 space-y-4">
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20">
              <h4 className="font-semibold mb-2">التقرير النهائي يتكون من:</h4>
            </div>

            <div className="space-y-4">
              <Card className="border-r-4 border-primary">
                <CardContent className="p-4">
                  <h5 className="font-bold mb-2">1. ملخص تنفيذي</h5>
                  <p className="text-sm text-muted-foreground">
                    فقرة قصيرة تلخص أهم النتائج في 3-5 جمل - مناسبة للمدير التنفيذي الذي ليس لديه وقت لقراءة التقرير كاملاً
                  </p>
                </CardContent>
              </Card>

              <Card className="border-r-4 border-green-500">
                <CardContent className="p-4">
                  <h5 className="font-bold mb-2">2. الأرقام والإحصائيات</h5>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>عدد التغريدات المحللة</li>
                    <li>نسب المشاعر (إيجابي/سلبي/محايد) مع رسم بياني</li>
                    <li>أكثر الكلمات تكراراً</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-r-4 border-blue-500">
                <CardContent className="p-4">
                  <h5 className="font-bold mb-2">3. المواضيع الرئيسية</h5>
                  <p className="text-sm text-muted-foreground">
                    قائمة بأهم 5 مواضيع يتحدث عنها الناس مع نسبة كل موضوع
                  </p>
                </CardContent>
              </Card>

              <Card className="border-r-4 border-red-500">
                <CardContent className="p-4">
                  <h5 className="font-bold mb-2">4. المشاكل والشكاوى</h5>
                  <p className="text-sm text-muted-foreground">
                    قائمة بأهم المشاكل مرتبة حسب الأهمية مع أمثلة من التغريدات الحقيقية
                  </p>
                </CardContent>
              </Card>

              <Card className="border-r-4 border-emerald-500">
                <CardContent className="p-4">
                  <h5 className="font-bold mb-2">5. التوصيات</h5>
                  <p className="text-sm text-muted-foreground">
                    خطوات عملية مقترحة لتحسين الوضع بناءً على ما وجدناه
                  </p>
                </CardContent>
              </Card>

              <Card className="border-r-4 border-purple-500">
                <CardContent className="p-4">
                  <h5 className="font-bold mb-2">6. عينة من التغريدات</h5>
                  <p className="text-sm text-muted-foreground">
                    أمثلة من التغريدات الأكثر تفاعلاً (إيجابية وسلبية) مع تفاصيل كل تغريدة
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <NoteSection 
              section="finalReport" 
              placeholder="أضف ملاحظاتك هنا عن شكل التقرير النهائي المطلوب..."
            />
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
};
