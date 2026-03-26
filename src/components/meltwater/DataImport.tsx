import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileUp, AlertCircle, CheckCircle, Table, Info, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import * as XLSX from 'xlsx';

interface DataImportProps {
  onImport: (tweets: any[]) => void;
}

export const DataImport = ({ onImport }: DataImportProps) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    setMessage('جاري قراءة الملف...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        setStatus('error');
        setMessage('الملف فارغ أو لا يحتوي على بيانات صالحة');
        return;
      }

      // Map common column names to our format
      const tweets = rows.map((row, index) => {
        const text = row['النص'] || row['text'] || row['Text'] || row['tweet'] || row['Tweet'] || row['content'] || row['Content'] || '';
        const author = row['الكاتب'] || row['author'] || row['Author'] || row['user'] || row['User'] || `@user_${index}`;
        const sentiment = row['المشاعر'] || row['sentiment'] || row['Sentiment'] || 'محايد';
        const emotion = row['العاطفة'] || row['emotion'] || row['Emotion'] || 'محايد';
        const keywords = row['الكلمات المفتاحية'] || row['keywords'] || row['Keywords'] || '';
        const reach = parseInt(row['الوصول'] || row['reach'] || row['Reach'] || row['impressions'] || '0') || 0;
        const likes = parseInt(row['إعجابات'] || row['likes'] || row['Likes'] || '0') || 0;
        const retweets = parseInt(row['إعادات تغريد'] || row['retweets'] || row['Retweets'] || '0') || 0;
        const replies = parseInt(row['ردود'] || row['replies'] || row['Replies'] || '0') || 0;

        return {
          id: index + 1,
          text: String(text),
          author: String(author).startsWith('@') ? String(author) : `@${author}`,
          sentiment: String(sentiment),
          emotion: String(emotion),
          keywords: typeof keywords === 'string' ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [],
          reach,
          engagement: { likes, retweets, replies },
        };
      }).filter(t => t.text.length > 0);

      if (tweets.length === 0) {
        setStatus('error');
        setMessage('لم يتم العثور على تغريدات صالحة. تأكد من أن الملف يحتوي على عمود "النص" أو "text"');
        return;
      }

      setImportedCount(tweets.length);
      setStatus('success');
      setMessage(`تم استيراد ${tweets.length} تغريدة بنجاح!`);
      onImport(tweets);
    } catch (err) {
      setStatus('error');
      setMessage('خطأ في قراءة الملف. تأكد من أنه ملف Excel أو CSV صالح.');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="border border-border bg-gradient-to-br from-sky-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sky-800">
          <Upload className="h-5 w-5" />
          استيراد بيانات للتحليل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-sky-700">
          استورد ملف Excel أو CSV يحتوي على تغريدات لتحليلها. تأكد من وجود الأعمدة المطلوبة أدناه.
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="hidden"
          id="data-import"
        />
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'loading'}
            className="gap-2 bg-sky-700 hover:bg-sky-800 text-white font-bold"
          >
            <FileUp className="h-4 w-4" />
            {status === 'loading' ? 'جاري الاستيراد...' : 'اختر ملف'}
          </Button>

          {status === 'success' && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{message}</span>
              <Badge className="bg-thmanyah-green text-white">{importedCount}</Badge>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Required columns */}
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
            <Table className="h-4 w-4 text-sky-700" />
            الأعمدة المطلوبة
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { name: 'النص / text / Text / tweet / content', type: 'نص', desc: 'محتوى التغريدة' },
              { name: 'الكاتب / author / Author / user', type: 'نص', desc: 'اسم المستخدم' },
            ].map(col => (
              <div key={col.name} className="flex items-start gap-2 p-2 bg-card rounded-2xl border border-sky-200">
                <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] mt-0.5 shrink-0">مطلوب</Badge>
                <div>
                  <p className="text-xs font-bold text-foreground">{col.name}</p>
                  <p className="text-[11px] text-muted-foreground">{col.desc} ({col.type})</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional columns */}
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-sky-700" />
            الأعمدة الاختيارية
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { name: 'المشاعر / sentiment / Sentiment', type: 'نص', desc: 'إيجابي، سلبي، محايد' },
              { name: 'العاطفة / emotion / Emotion', type: 'نص', desc: 'إعجاب، غضب، حماس...' },
              { name: 'الكلمات المفتاحية / keywords', type: 'نص (مفصول بفاصلة)', desc: 'كلمات مفتاحية' },
              { name: 'الوصول / reach / impressions', type: 'رقم', desc: 'عدد مرات الوصول' },
              { name: 'إعجابات / likes / Likes', type: 'رقم', desc: 'عدد الإعجابات' },
              { name: 'إعادات تغريد / retweets', type: 'رقم', desc: 'عدد إعادات التغريد' },
              { name: 'ردود / replies / Replies', type: 'رقم', desc: 'عدد الردود' },
            ].map(col => (
              <div key={col.name} className="flex items-start gap-2 p-2 bg-card rounded-2xl border border-sky-100">
                <Badge className="bg-sky-100 text-sky-700 border-sky-300 text-[10px] mt-0.5 shrink-0">اختياري</Badge>
                <div>
                  <p className="text-xs font-bold text-foreground">{col.name}</p>
                  <p className="text-[11px] text-muted-foreground">{col.desc} ({col.type})</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional columns & AI note */}
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-500" />
            أعمدة إضافية يمكن إضافتها مستقبلاً
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { name: 'التاريخ / date / Date', desc: 'تاريخ ووقت النشر' },
              { name: 'الموقع / location / Location', desc: 'الموقع الجغرافي' },
              { name: 'اللغة / language / Language', desc: 'لغة التغريدة' },
              { name: 'المصدر / source / Source', desc: 'المنصة أو التطبيق' },
              { name: 'الرابط / url / URL', desc: 'رابط التغريدة الأصلي' },
              { name: 'المتابعين / followers', desc: 'عدد متابعي الكاتب' },
            ].map(col => (
              <div key={col.name} className="flex items-start gap-2 p-2 bg-amber-50 rounded-2xl border border-amber-200">
                <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] mt-0.5 shrink-0">قادم</Badge>
                <div>
                  <p className="text-xs font-bold text-foreground">{col.name}</p>
                  <p className="text-[11px] text-muted-foreground">{col.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-gradient-to-l from-sky-100 to-amber-50 rounded-2xl border border-sky-200">
          <p className="text-xs text-sky-800 leading-relaxed">
            <Sparkles className="h-3.5 w-3.5 inline ml-1 text-amber-500" />
            <strong>النظام قابل للتكيف:</strong> إذا لم تتوفر أعمدة المشاعر أو العواطف أو الكلمات المفتاحية في بياناتك، سيقوم الذكاء الاصطناعي بتحليلها واستخراجها تلقائياً من نص التغريدة. كما يمكن إضافة أعمدة جديدة مستقبلاً وسيتعرف عليها النظام تلقائياً.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
