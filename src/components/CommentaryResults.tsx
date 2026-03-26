/* @ts-nocheck */
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";

interface CommentaryResultsProps {
  results: {
    transcription: string;
    segments: Array<{ text: string; start: number; end: number }>;
    analysis: {
      overallScore: number;
      criteria: {
        clarity: CriterionData;
        enthusiasm: CriterionData;
        accuracy: CriterionData;
        timing: CriterionData;
        terminology: CriterionData;
        eventReaction: CriterionData;
        styleVariety: CriterionData;
      };
      emotionalAnalysis?: {
        score: number;
        explanation: string;
        quotes: string[];
      };
      emotionalTimeline?: Array<{ timestamp: number; emotion: string; intensity: number; description: string }>;
      strengths: string[];
      improvements: string[];
      excitementTimeline: Array<{ timestamp: number; score: number; event: string }>;
    };
  };
  filename: string;
}

interface CriterionData {
  score: number;
  explanation: string;
  quotes: string[];
}

export default function CommentaryResults({ results, filename }: CommentaryResultsProps) {
  const { analysis, segments } = results;
  const hasSegments = segments && segments.length > 0;
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return "bg-thmanyah-green";
    if (score >= 8) return "bg-green-500";
    if (score >= 7) return "bg-yellow-500";
    if (score >= 6) return "bg-orange-400";
    return "bg-red-500";
  };

  const getScoreColorGradient = (score: number) => {
    if (score >= 9) return "from-green-600 to-green-500";
    if (score >= 8) return "from-green-500 to-green-400";
    if (score >= 7) return "from-yellow-500 to-yellow-400";
    if (score >= 6) return "from-orange-400 to-orange-300";
    return "from-red-500 to-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "ممتاز";
    if (score >= 8) return "جيد جداً";
    if (score >= 7) return "جيد";
    if (score >= 6) return "مقبول";
    return "ضعيف";
  };

  const renderCriterionCard = (title: string, criterionData: CriterionData) => {
    if (!criterionData) {
      console.error(`Missing criterion data for: ${title}`);
      return null;
    }
    
    const score = typeof criterionData.score === 'number' ? criterionData.score : 0;
    const explanation = criterionData.explanation || 'لا يوجد شرح متاح';
    const quotes = Array.isArray(criterionData.quotes) ? criterionData.quotes : [];
    const percentage = (score / 10) * 100;
    
    return (
      <Card className="border border-border shadow-th-sm">
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge className={`${getScoreColor(score)} text-white text-lg px-4 py-1 border border-border`}>
              {score.toFixed(1)}/10
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 border border-border overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getScoreColorGradient(score)} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span>{getScoreLabel(score)}</span>
              <span>{percentage.toFixed(0)}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-line font-medium leading-relaxed mb-4">
            {explanation}
          </p>
          {quotes.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-bold text-gray-700">أمثلة من النص:</h4>
              <ul className="space-y-2">
                {quotes.map((quote, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-foreground font-bold shrink-0">•</span>
                    <span className="italic text-gray-700 bg-background px-3 py-1 rounded border-l-4 border-thmanyah-green">
                      "{quote}"
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const summaryData = [
      ["تقرير تحليل التعليق الرياضي"],
      [""],
      ["اسم الملف", filename],
      ["التقييم الإجمالي", `${analysis.overallScore}/10`],
      [""],
      ["التقييمات التفصيلية"],
    ];

    if (analysis.criteria?.clarity) {
      summaryData.push(["وضوح الصوت والنطق", `${analysis.criteria.clarity.score}/10`, analysis.criteria.clarity.explanation]);
    }
    if (analysis.criteria?.enthusiasm) {
      summaryData.push(["الحماس والطاقة", `${analysis.criteria.enthusiasm.score}/10`, analysis.criteria.enthusiasm.explanation]);
    }
    if (analysis.criteria?.accuracy) {
      summaryData.push(["دقة الوصف", `${analysis.criteria.accuracy.score}/10`, analysis.criteria.accuracy.explanation]);
    }
    if (analysis.criteria?.timing) {
      summaryData.push(["التوقيت والسرعة", `${analysis.criteria.timing.score}/10`, analysis.criteria.timing.explanation]);
    }
    if (analysis.criteria?.terminology) {
      summaryData.push(["استخدام المصطلحات", `${analysis.criteria.terminology.score}/10`, analysis.criteria.terminology.explanation]);
    }
    if (analysis.criteria?.eventReaction) {
      summaryData.push(["التفاعل مع الأحداث", `${analysis.criteria.eventReaction.score}/10`, analysis.criteria.eventReaction.explanation]);
    }
    if (analysis.criteria?.styleVariety) {
      summaryData.push(["التنوع في الأسلوب", `${analysis.criteria.styleVariety.score}/10`, analysis.criteria.styleVariety.explanation]);
    }

    summaryData.push(
      [""],
      ["نقاط القوة"],
      ...analysis.strengths.map(s => [s]),
      [""],
      ["نقاط التحسين"],
      ...analysis.improvements.map(i => [i])
    );
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "الملخص");

    const timelineData = [
      ["الوقت", "مستوى الحماس", "الحدث"],
      ...analysis.excitementTimeline.map(t => [formatTime(t.timestamp), t.score, t.event])
    ];
    const timelineSheet = XLSX.utils.aoa_to_sheet(timelineData);
    XLSX.utils.book_append_sheet(workbook, timelineSheet, "مستوى الحماس");

    const transcriptionData = hasSegments
      ? [["الوقت", "النص"], ...segments.map(s => [formatTime(s.start), s.text])]
      : [["النص الكامل"], [results.transcription]];
    const transcriptionSheet = XLSX.utils.aoa_to_sheet(transcriptionData);
    XLSX.utils.book_append_sheet(workbook, transcriptionSheet, "النص الكامل");

    XLSX.writeFile(workbook, `تحليل_تعليق_${filename.split('.')[0]}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Ensure fonts are loaded and layout settled for proper Arabic shaping
      if ((document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const element = reportRef.current;
      const opt: any = {
        margin: [10, 10, 10, 10],
        filename: `تحليل_تعليق_${filename.split('.')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          foreignObjectRendering: true,
          windowWidth: 1200,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await (html2pdf() as any).set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">نتائج التحليل</h2>
        <div className="flex gap-3">
          <Button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            variant="default"
            className="gap-2 border border-border shadow-th-sm transition-all disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                تصدير PDF
              </>
            )}
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="secondary"
            className="gap-2 border border-border shadow-th-sm transition-all"
          >
            <Download className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6 bg-card p-6 rounded-2xl" style={{ direction: 'rtl', unicodeBidi: 'isolate' }}>
        <Card className="border border-border shadow-th-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-2xl">التقييم الإجمالي</span>
              <Badge className={`${getScoreColor(analysis.overallScore)} text-white text-2xl px-6 py-2 border border-border`}>
                {analysis.overallScore}/10
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border border-border shadow-th-sm">
          <CardHeader>
            <CardTitle className="text-xl">مستوى الحماس خلال المباراة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analysis.excitementTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={formatTime} label={{ value: 'الوقت', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[0, 10]} label={{ value: 'مستوى الحماس', angle: -90, position: 'insideLeft' }} />
                <Tooltip labelFormatter={formatTime} formatter={(value: number) => [`${value}/10`, 'الحماس']} contentStyle={{ direction: 'rtl' }} />
                <Line type="monotone" dataKey="score" stroke="#000000" strokeWidth={3} dot={{ fill: '#000000', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {analysis.criteria?.clarity && renderCriterionCard("وضوح الصوت والنطق", analysis.criteria.clarity)}
          {analysis.criteria?.enthusiasm && renderCriterionCard("الحماس والطاقة", analysis.criteria.enthusiasm)}
          {analysis.criteria?.accuracy && renderCriterionCard("دقة الوصف", analysis.criteria.accuracy)}
          {analysis.criteria?.timing && renderCriterionCard("التوقيت والسرعة", analysis.criteria.timing)}
          {analysis.criteria?.terminology && renderCriterionCard("استخدام المصطلحات", analysis.criteria.terminology)}
          {analysis.criteria?.eventReaction && renderCriterionCard("التفاعل مع الأحداث", analysis.criteria.eventReaction)}
          {analysis.criteria?.styleVariety && renderCriterionCard("التنوع في الأسلوب", analysis.criteria.styleVariety)}
        </div>

        {analysis.emotionalAnalysis && (
          <div className="space-y-4">
            <Card className="border-2 border-purple-600 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-2xl text-purple-700">التحليل العاطفي الشامل</CardTitle>
              </CardHeader>
            </Card>
            {renderCriterionCard("البعد العاطفي والنفسي", analysis.emotionalAnalysis as CriterionData)}
          </div>
        )}

        {analysis.emotionalTimeline && analysis.emotionalTimeline.length > 0 && (
          <Card className="border-2 border-purple-600 shadow-[4px_4px_0px_0px_rgba(147,51,234,1)]">
            <CardHeader>
              <CardTitle className="text-xl">الخط الزمني للعواطف</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analysis.emotionalTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tickFormatter={formatTime} label={{ value: 'الوقت', position: 'insideBottom', offset: -5 }} />
                  <YAxis domain={[0, 10]} label={{ value: 'شدة العاطفة', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    labelFormatter={formatTime}
                    formatter={(value: number, name: string, props: any) => [`${value}/10`, props.payload.emotion]}
                    contentStyle={{ direction: 'rtl' }}
                  />
                  <Line type="monotone" dataKey="intensity" stroke="#9333ea" strokeWidth={3} dot={{ fill: '#9333ea', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border border-border shadow-th-sm">
            <CardHeader>
              <CardTitle className="text-xl">نقاط القوة</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold shrink-0">✓</span>
                    <span className="text-sm">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-th-sm">
            <CardHeader>
              <CardTitle className="text-xl">نقاط التحسين</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold shrink-0">→</span>
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border shadow-th-sm">
          <CardHeader>
            <CardTitle className="text-xl">النص الكامل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hasSegments ? (
                segments.map((segment, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-bold text-gray-600">[{formatTime(segment.start)} - {formatTime(segment.end)}]</span>
                    <p className="mt-1 leading-relaxed">{segment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{results.transcription}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
