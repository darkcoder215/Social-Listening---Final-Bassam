import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Upload, FileText, Play, Brain, CheckCircle2, 
  XCircle, Clock, Loader2, AlertTriangle, Lock, Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ImportJob } from "@shared/schema";

const STATUS_LABELS: Record<string, string> = {
  uploaded: "تم الرفع",
  importing: "جارٍ الاستيراد",
  done: "تم الاستيراد",
  failed: "فشل الاستيراد",
};

export default function Admin() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // COST CONTROL: Removed refetchInterval - manual refresh only
  const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery<ImportJob[]>({
    queryKey: ["/api/import/jobs"],
    enabled: isAuthenticated,
  });

  // COST CONTROL: Removed refetchInterval - manual refresh only
  const { data: analysisStatus, refetch: refetchAnalysis } = useQuery<{ pending: number; processing: number; done: number }>({
    queryKey: ["/api/analyze/status"],
    enabled: isAuthenticated,
  });

  const handleLogin = async () => {
    try {
      const response = await apiRequest("POST", "/api/admin/login", { password });
      if (response.ok) {
        setIsAuthenticated(true);
        setAuthError("");
      } else {
        setAuthError("كلمة المرور غير صحيحة");
      }
    } catch {
      setAuthError("فشل في تسجيل الدخول");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast({
          title: "صيغة ملف غير مدعومة",
          description: "يرجى اختيار ملف بصيغة CSV",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          toast({
            title: "تم رفع الملف بنجاح",
            description: `رقم المهمة: ${result.jobId}`,
          });
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          refetchJobs();
        } else {
          toast({
            title: "فشل رفع الملف",
            description: "يرجى المحاولة مرة أخرى",
            variant: "destructive",
          });
        }
        setIsUploading(false);
        setUploadProgress(0);
      };
      
      xhr.onerror = () => {
        toast({
          title: "فشل رفع الملف",
          description: "خطأ في الاتصال",
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadProgress(0);
      };
      
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    } catch (error) {
      toast({
        title: "فشل رفع الملف",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/import?jobId=${jobId}`, {});
    },
    onSuccess: () => {
      toast({ title: "بدأ الاستيراد" });
      refetchJobs();
    },
    onError: () => {
      toast({ title: "فشل الاستيراد", variant: "destructive" });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/analyze/start", {});
    },
    onSuccess: () => {
      toast({ title: "بدأ التحليل" });
      refetchAnalysis();
    },
    onError: () => {
      toast({ title: "فشل التحليل", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("DELETE", `/api/import/jobs/${jobId}`, {});
    },
    onSuccess: () => {
      toast({ title: "تم حذف المهمة" });
      queryClient.invalidateQueries({ queryKey: ["/api/import/jobs"] });
    },
    onError: () => {
      toast({ title: "فشل حذف المهمة", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
      uploaded: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
      importing: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Loader2 },
      done: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
      failed: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
    };
    const config = statusConfig[status || ""] || statusConfig.uploaded;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} gap-1 no-default-hover-elevate no-default-active-elevate`}>
        <Icon className={`h-3 w-3 ${status === "importing" ? "animate-spin" : ""}`} />
        {STATUS_LABELS[status || "uploaded"]}
      </Badge>
    );
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>تسجيل دخول الإدارة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="أدخل كلمة المرور"
                data-testid="input-admin-password"
              />
            </div>
            {authError && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                {authError}
              </div>
            )}
            <Button 
              className="w-full" 
              onClick={handleLogin}
              data-testid="button-admin-login"
            >
              تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">لوحة الإدارة</h1>
        <p className="text-sm text-muted-foreground mt-1">
          رفع ملفات CSV وإدارة التحليل الذكي
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Upload className="h-5 w-5" />
              استيراد ملف CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              data-testid="zone-upload"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                اضغط لاختيار ملف CSV أو اسحب الملف وأفلته هنا
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                يدعم ملفات Meltwater حتى 25MB
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  data-testid="button-upload"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جارٍ الرفع...
                    </>
                  ) : (
                    "رفع الملف"
                  )}
                </Button>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">{uploadProgress}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Brain className="h-5 w-5" />
              التحليل الذكي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysisStatus ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-semibold">{analysisStatus.pending}</p>
                  <p className="text-xs text-muted-foreground">بانتظار التحليل</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-semibold">{analysisStatus.processing}</p>
                  <p className="text-xs text-muted-foreground">قيد التحليل</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-semibold">{analysisStatus.done}</p>
                  <p className="text-xs text-muted-foreground">تم التحليل</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending || !analysisStatus?.pending}
              data-testid="button-start-analysis"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جارٍ بدء التحليل...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 ml-2" />
                  بدء التحليل
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              يستخدم التحليل GPT-4o-mini لتصنيف المحتوى وتحديد الشعور
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">مهام الاستيراد</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مهام استيراد حتى الآن</p>
              <p className="text-sm">ارفع ملف CSV للبدء</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-lg"
                  data-testid={`job-${job.id}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{job.filename}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{formatBytes(job.bytes)}</span>
                        <span className="hidden sm:inline">|</span>
                        <span>
                          {job.processedRows || 0} / {job.totalRows || "?"} صف
                        </span>
                        {job.errorRows ? (
                          <span className="text-red-600 dark:text-red-400">
                            ({job.errorRows} أخطاء)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(job.status)}
                    
                    {job.status === "uploaded" && (
                      <Button
                        size="sm"
                        onClick={() => importMutation.mutate(job.id)}
                        disabled={importMutation.isPending}
                        data-testid={`button-import-${job.id}`}
                      >
                        {importMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "استيراد"
                        )}
                      </Button>
                    )}
                    
                    {job.status === "importing" && (
                      <div className="w-32">
                        <Progress 
                          value={job.totalRows ? (job.processedRows || 0) / job.totalRows * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(job.id)}
                      disabled={deleteMutation.isPending || job.status === "importing"}
                      data-testid={`button-delete-${job.id}`}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
