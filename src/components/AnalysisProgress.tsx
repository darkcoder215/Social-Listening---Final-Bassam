import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Step {
  id: string;
  label: string;
  description: string;
}

interface AnalysisProgressProps {
  currentStep: number;
  steps: Step[];
  error?: string;
}

export const AnalysisProgress = ({ currentStep, steps, error }: AnalysisProgressProps) => {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Card className="p-8 shadow-elegant">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">جاري التحليل...</h3>
          <p className="text-muted-foreground">يرجى الانتظار حتى اكتمال التحليل</p>
        </div>

        {currentStep > 2 && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-right">
              <strong>ملاحظة:</strong> قد يستغرق تحليل عدد كبير من التغريدات عدة دقائق. 
              للحصول على نتائج أسرع، استخدم 50 تغريدة أو أقل.
            </AlertDescription>
          </Alert>
        )}

        <Progress value={progress} className="h-3" />

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${
                  isCurrent
                    ? 'bg-primary/10 border-2 border-primary'
                    : isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {isCompleted && (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  )}
                  {isCurrent && (
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  )}
                  {isPending && (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                    {step.label}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                  {isCurrent && (
                    <div className="mt-2">
                      <Progress value={50} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-2xl p-4">
            <p className="text-destructive font-semibold">حدث خطأ:</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>الخطوة {currentStep + 1} من {steps.length}</p>
        </div>
      </div>
    </Card>
  );
};