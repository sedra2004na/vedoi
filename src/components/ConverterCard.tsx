import React, { useRef, useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileVideo, 
  Play, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Volume2, 
  ShieldCheck, 
  Clock, 
  Maximize2, 
  Sparkles,
  RefreshCw,
  Film
} from 'lucide-react';
import { parseLrec, newFb, drawFb, applyUpdate, PAL } from '../lib/lrecParser';
import { convertLecture, fmtTime, fmtSize, ConvertResult } from '../lib/videoConverter';
import { createDemoParsedLecture } from '../lib/demoLectureGenerator';

interface ConverterCardProps {}

export const ConverterCard: React.FC<ConverterCardProps> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedLecture, setParsedLecture] = useState<any | null>(null);
  
  // State: 'empty' | 'loading' | 'ready' | 'converting' | 'done'
  const [status, setStatus] = useState<'empty' | 'loading' | 'ready' | 'converting' | 'done'>('empty');
  const [progress, setProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [convertResult, setConvertResult] = useState<ConvertResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const cancelTokenRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const loadDemoLecture = () => {
    try {
      setStatus('loading');
      setErrorMessage(null);
      setConvertResult(null);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
      setFileName('محاضرة_افتراضية_نموذجية');
      setFile(null);

      const demo = createDemoParsedLecture();
      setParsedLecture(demo);
      setStatus('ready');

      // Draw initial slide to preview
      setTimeout(() => {
        renderPreviewSlide(demo, 0);
      }, 50);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل تحميل المحاضرة النموذجية.');
      setStatus('empty');
    }
  };

  const renderPreviewSlide = (lecture: any, timestampLimit?: number) => {
    if (!lecture || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ew = lecture.W + (lecture.W & 1);
    const eh = lecture.H + (lecture.H & 1);
    canvas.width = ew;
    canvas.height = eh;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fb = newFb(lecture.W, lecture.H, lecture.bpp);
    const limit = timestampLimit !== undefined ? timestampLimit : 0;

    for (const u of lecture.ups) {
      if (u.ts > limit) break;
      applyUpdate(fb, lecture.W, lecture.H, u);
    }

    const img = ctx.createImageData(ew, eh);
    new Uint32Array(img.data.buffer).fill(0xffffffff);
    drawFb(canvas, ctx, fb, PAL, lecture.W, lecture.H, img);
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (status === 'converting') return;

    setErrorMessage(null);
    setConvertResult(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);

    setFile(selectedFile);
    setFileName(selectedFile.name.replace(/\.[^.]+$/, '') || 'lecture');
    setStatus('loading');
    setProgress(0);
    setStageText('جاري فك ضغط وتجهيز ملف المحاضرة...');

    try {
      const buffer = await selectedFile.arrayBuffer();
      const parsed = await parseLrec(buffer, (pct: number) => {
        setProgress(Math.round(pct * 100));
        setStageText(`تحليل الإطارات ${Math.round(pct * 100)}%...`);
      });

      setParsedLecture(parsed);
      setStatus('ready');

      setTimeout(() => {
        renderPreviewSlide(parsed, 0);
      }, 50);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء قراءة ملف المحاضرة. تأكد من أنه ملف .lrec سليم.');
      setParsedLecture(null);
      setStatus('empty');
    }
  };

  const startConversion = async () => {
    if (!parsedLecture || status === 'converting') return;

    setStatus('converting');
    setProgress(0);
    setStageText('بدء المعالجة...');
    setErrorMessage(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    cancelTokenRef.current = { cancelled: false };

    try {
      const result = await convertLecture(
        parsedLecture,
        {
          enhanceAudio: true,
          denoiseStrength: 16,
          presenceBoost: 4,
          forceSoft: false,
          fps: 10
        },
        (pct: number, stage: string) => {
          setProgress(Math.min(99, Math.round(pct * 100)));
          setStageText(stage);
        },
        cancelTokenRef.current,
        previewCanvasRef.current
      );

      const url = URL.createObjectURL(result.blob);
      setVideoUrl(url);
      setConvertResult(result);
      setProgress(100);
      setStatus('done');
    } catch (err: any) {
      if (cancelTokenRef.current.cancelled) {
        setErrorMessage('تم إلغاء عملية التحويل بناءً على طلبك.');
      } else {
        setErrorMessage(err.message || 'تعذر استكمال عملية التحويل.');
      }
      setStatus('ready');
    }
  };

  const cancelConversion = () => {
    cancelTokenRef.current.cancelled = true;
    setStageText('جاري الإلغاء...');
  };

  const downloadVideo = () => {
    if (!convertResult || !videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${fileName}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const resetAll = () => {
    setFile(null);
    setFileName('');
    setParsedLecture(null);
    setConvertResult(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setErrorMessage(null);
    setStatus('empty');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Main Conversion Panel */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
        
        {/* Upload Zone (Visible when empty) */}
        {status === 'empty' && (
          <div className="p-6 sm:p-10">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[0.99]' 
                  : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-stone-50/50 dark:bg-stone-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".lrec,application/octet-stream"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                اسحب ملف المحاضرة (.lrec) وأفلته هنا
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-5 max-w-md">
                أو انقر لتصفح جهازك واختيار ملف المحاضرة المسجل من بوابة الطالب بالجامعة الافتراضية
              </p>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer"
                >
                  اختيار ملف من الجهاز
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs text-stone-400 dark:text-stone-500">
                <span>صيغ مدعومة: .lrec</span>
                <span>·</span>
                <span>بوابة SVUIS</span>
                <span>·</span>
                <span>Collaboration Player</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner during LREC file unpack */}
        {status === 'loading' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 dark:border-emerald-900 border-t-emerald-600 animate-spin" />
            <h4 className="text-lg font-bold text-stone-800 dark:text-stone-200">
              جاري فك ضغط المحاضرة وقراءة الإطارات
            </h4>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm">
              {stageText || 'يتم تحليل حزم Deflate ومسارات الصوت TrueSpeech...'}
            </p>
          </div>
        )}

        {/* Active Lecture View (Ready, Converting, Done) */}
        {(status === 'ready' || status === 'converting' || status === 'done') && parsedLecture && (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header: File info and change button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FileVideo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 truncate max-w-md">
                    {fileName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    <span>{file ? fmtSize(file.size) : 'ملف المحاضرة'}</span>
                    <span>·</span>
                    <span>{parsedLecture.W} × {parsedLecture.H}</span>
                    <span>·</span>
                    <span>{fmtTime(parsedLecture.duration)}</span>
                  </div>
                </div>
              </div>

              {status !== 'converting' && (
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  اختيار ملف آخر
                </button>
              )}
            </div>

            {/* Lecture Metadata Chips (Clean unboxed style) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  المدة الزمنية
                </div>
                <div className="font-mono text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  {fmtTime(parsedLecture.duration)}
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  أبعاد الشاشة
                </div>
                <div className="font-mono text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  {parsedLecture.W} × {parsedLecture.H}
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  مسار الصوت
                </div>
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {parsedLecture.audio ? 'موجود (TrueSpeech)' : 'صامت (بدون صوت)'}
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  عدد الشرائح
                </div>
                <div className="font-mono text-base font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                  {parsedLecture.ups.length} شريحة / تحديث
                </div>
              </div>
            </div>

            {/* Display Video Player if Done, otherwise Canvas Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 font-medium">
                <span className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <Film className="w-4 h-4" />
                  {status === 'done' ? 'مشغّل الفيديو الناتج (MP4):' : 'معاينة الشريحة المحدثة:'}
                </span>
                <span className="font-mono">
                  {status === 'converting' ? 'ترميز مباشر...' : status === 'done' ? 'جاهز للتشغيل والتقديم' : 'لقطة البداية'}
                </span>
              </div>

              <div className="relative aspect-video w-full bg-stone-950 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner flex items-center justify-center">
                {status === 'done' && videoUrl ? (
                  <video
                    ref={videoPlayerRef}
                    src={videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <canvas
                    ref={previewCanvasRef}
                    className="max-h-full max-w-full object-contain mx-auto"
                  />
                )}
              </div>


            </div>



            {/* Conversion Progress Bar (when converting) */}
            {status === 'converting' && (
              <div className="space-y-2 p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    {stageText}
                  </span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                    {progress}%
                  </span>
                </div>
                <div className="w-full h-3 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-150 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={cancelConversion}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    إلغاء التحويل
                  </button>
                </div>
              </div>
            )}

            {/* Success Banner when conversion is Done */}
            {status === 'done' && convertResult && (
              <div className="p-5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
                      تم تحويل المحاضرة إلى فيديو MP4 بنجاح!
                    </h4>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                      حجم الفيديو: {convertResult.sizeFormatted} · الأبعاد: {convertResult.width}×{convertResult.height} · الترميز: {convertResult.codec} · المدة: {fmtTime(convertResult.durationMs)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={downloadVideo}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    تنزيل ملف الفيديو ({fileName}.mp4)
                  </button>
                  <button
                    onClick={startConversion}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                  >
                    إعادة التحويل
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {status === 'ready' && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={startConversion}
                  className="flex-1 min-w-[200px] py-3 px-6 rounded-xl font-bold text-base text-white bg-emerald-700 hover:bg-emerald-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  بدء التحويل إلى MP4 الآن
                </button>
                <button
                  onClick={resetAll}
                  className="py-3 px-4 rounded-xl font-semibold text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-900 dark:text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold">تنبيه أثناء المعالجة:</h5>
            <p className="text-xs leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
};
