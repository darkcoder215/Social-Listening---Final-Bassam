import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface CommentaryProgressProps {
  currentStep: number;
  filename: string;
}

const analysisSteps = [
  {
    id: 1,
    title: "رفع الملف الصوتي",
    description: "جاري معالجة الملف...",
  },
  {
    id: 2,
    title: "تحويل الصوت إلى نص",
    description: "جاري تحليل الصوت باستخدام تقنية الذكاء الاصطناعي...",
  },
  {
    id: 3,
    title: "تحليل المحتوى",
    description: "جاري تحليل أداء المعلق...",
  },
  {
    id: 4,
    title: "إنشاء التقرير",
    description: "جاري إعداد التقرير الشامل...",
  },
];

export default function CommentaryProgress({ currentStep, filename }: CommentaryProgressProps) {
  const progress = ((currentStep + 1) / analysisSteps.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
      <Card className="border border-border shadow-th-sm">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">جاري تحليل التعليق</h2>
              <p className="text-muted-foreground font-medium">{filename}</p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground text-center font-medium">
                {Math.round(progress)}% مكتمل
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {analysisSteps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isPending = index > currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 ${
                      isCurrent
                        ? "bg-primary/5 border-border"
                        : isCompleted
                        ? "bg-green-50 border-green-500"
                        : "bg-background border-gray-300"
                    }`}
                  >
                    <div className="shrink-0 mt-1">
                      {isCompleted && (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      )}
                      {isCurrent && (
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      )}
                      {isPending && (
                        <Circle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{step.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
