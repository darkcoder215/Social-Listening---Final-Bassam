import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommentaryAnalysisFormProps {
  onAnalysisStart: (filename: string) => void;
  onResults: (results: any) => void;
  onError: (error: string) => void;
  onProgress: (step: number) => void;
}

export default function CommentaryAnalysisForm({
  onAnalysisStart,
  onResults,
  onError,
  onProgress,
}: CommentaryAnalysisFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      onError("حجم الملف يجب أن يكون أقل من 25 ميجابايت");
      return;
    }

    const allowedTypes = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/m4a", "audio/x-m4a"];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || "")) {
      onError("نوع الملف غير مدعوم. الأنواع المدعومة: mp3, mp4, wav, m4a, webm");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      onError("الرجاء اختيار ملف صوتي");
      return;
    }

    onAnalysisStart(selectedFile.name);

    // Helper function to retry the analysis
    const performAnalysis = async (retryCount = 0): Promise<any> => {
      try {
        onProgress(0); // Step 1: File upload
        onProgress(1); // Step 2: Transcription

        console.log(`🚀 Calling analyze-commentary edge function (attempt ${retryCount + 1}) using multipart...`);

        // Prepare multipart form-data to avoid base64 copies
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('filename', selectedFile.name);

        // Create timeout promise (9 minutes to allow for processing)
        const timeoutPromise = new Promise((_, timeoutReject) => {
          setTimeout(() => {
            timeoutReject(new Error('انتهت مهلة التحليل (أكثر من 9 دقائق). الملف كبير جداً. جرب ملفاً أصغر (أقل من 5 دقائق تسجيل).'));
          }, 540000);
        });

        const analysisPromise = supabase.functions.invoke("analyze-commentary", {
          body: formData as any,
        });

        const { data, error } = await Promise.race([
          analysisPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error("Edge function error:", error);
          throw new Error(error.message || "فشل الاتصال بخدمة التحليل");
        }
        
        if (data?.error) {
          console.error("Analysis error:", data.error);
          throw new Error(data.error);
        }

        if (!data || !data.analysis) {
          console.error("Invalid response from edge function:", data);
          throw new Error("استجابة غير صحيحة من خدمة التحليل");
        }

        // Validate response structure
        if (!data.transcription || typeof data.transcription !== 'string') {
          throw new Error("البيانات المرجعة من التحليل غير مكتملة (transcription مفقود)");
        }

        if (!data.analysis || !data.analysis.overallScore || typeof data.analysis.overallScore !== 'number') {
          throw new Error("البيانات المرجعة من التحليل غير مكتملة (overallScore مفقود)");
        }

        // Ensure segments array exists
        if (!data.segments || !Array.isArray(data.segments)) {
          data.segments = [];
        }

        // Ensure criteria exists
        if (!data.analysis.criteria || typeof data.analysis.criteria !== 'object') {
          throw new Error("البيانات المرجعة من التحليل غير مكتملة (criteria مفقود)");
        }

        console.log("✅ Analysis completed successfully");
        onProgress(3); // Step 4: Final step
        return data;
      } catch (error: any) {
        // Check if error is network-related and can be retried
        const isRetryable = 
          error.message?.includes('فشل الاتصال') || 
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.message?.includes('انتهت مهلة');
        
        if (isRetryable && retryCount < 2) {
          console.log(`⚠️ Retrying analysis (attempt ${retryCount + 2}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
          return performAnalysis(retryCount + 1);
        }
        
        throw error;
      }
    };

    try {
      const data = await performAnalysis();
      onResults(data);
    } catch (error: any) {
      console.error("Error in analysis process:", error);
      
      // Provide user-friendly error messages
      let errorMessage = error.message || "حدث خطأ أثناء التحليل";
      
      // Add helpful hints based on error type
      if (errorMessage.includes('فشل الاتصال') || errorMessage.includes('timeout')) {
        errorMessage += '. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
      } else if (errorMessage.includes('حجم الملف')) {
        errorMessage += ' اختر ملفاً أصغر حجماً.';
      } else if (errorMessage.includes('تنسيق') || errorMessage.includes('نوع')) {
        errorMessage += ' تأكد من رفع ملف صوتي بتنسيق صحيح.';
      }
      
      onError(errorMessage);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border border-border shadow-th-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-right">رفع ملف التعليق الصوتي</CardTitle>
        <CardDescription className="text-right font-medium">
          قم برفع ملف صوتي لتعليق مباراة كرة قدم للحصول على تحليل شامل لأداء المعلق
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            isDragging
              ? "border-border bg-background"
              : "border-gray-300 hover:border-border"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            id="audio-upload"
            className="hidden"
            accept="audio/mp3,audio/mp4,audio/mpeg,audio/wav,audio/webm,audio/m4a,.mp3,.mp4,.mpeg,.mpga,.m4a,.wav,.webm"
            onChange={handleFileInput}
          />
          <label htmlFor="audio-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-bold mb-2">
              اسحب وأفلت الملف هنا أو انقر للاختيار
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              الأنواع المدعومة: MP3, MP4, WAV, M4A, WebM
            </p>
            <p className="text-sm text-muted-foreground font-medium">
              الحد الأقصى للحجم: 25 ميجابايت
            </p>
          </label>
        </div>

        {selectedFile && (
          <div className="bg-background rounded-2xl p-4 text-right border border-border">
            <p className="font-bold">الملف المحدد:</p>
            <p className="text-sm text-muted-foreground font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground font-medium">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} ميجابايت
            </p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selectedFile}
          className="w-full border border-border shadow-th-sm transition-all font-bold"
          size="lg"
        >
          بدء التحليل
        </Button>
      </CardContent>
    </Card>
  );
}
