import React, { useState } from 'react';
import { 
  Code2, 
  Layers, 
  Cpu, 
  Terminal, 
  ExternalLink, 
  Check, 
  Copy, 
  Sparkles, 
  FileCode, 
  Server, 
  ArrowLeft,
  ShieldAlert,
  Zap,
  Globe
} from 'lucide-react';

export const HowToBuildGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const codeSnippets = [
    {
      title: '1. تثبيت الحزم المطلوبة (Vite + TypeScript)',
      language: 'bash',
      code: `npm create vite@latest svu-converter -- --template react-ts
cd svu-converter
npm install mp4-muxer lucide-react`
    },
    {
      title: '2. فك ضغط حزم تحديثات الشاشة عبر DecompressionStream الأصلي',
      language: 'typescript',
      code: `// فك ضغط كتل Zlib / Deflate داخل المتصفح بدون أي مكتبات خارجية:
async function inflate(u8Array: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([u8Array])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}`
    },
    {
      title: '3. معمارية خط أنابيب ترميز الفيديو عبر WebCodecs و mp4-muxer',
      language: 'typescript',
      code: `import * as Mp4Muxer from 'mp4-muxer';

// 1. إنشاء الحاوية المجمعة MP4
const target = new Mp4Muxer.ArrayBufferTarget();
const muxer = new Mp4Muxer.Muxer({
  target,
  fastStart: 'in-memory',
  firstTimestampBehavior: 'cross-track-offset',
  video: { codec: 'avc', width: 1280, height: 720 },
  audio: { codec: 'aac', numberOfChannels: 1, sampleRate: 16000 }
});

// 2. إعداد مرمز الفيديو المعتمد على عتاد الجهاز (Hardware VideoEncoder)
const videoEncoder = new VideoEncoder({
  output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
  error: (err) => console.error('Encoding error:', err)
});

videoEncoder.configure({
  codec: 'avc1.640034', // H.264 High Profile
  width: 1280,
  height: 720,
  bitrate: 800_000,
  framerate: 30,
  latencyMode: 'quality'
});

// 3. تغذية الإطارات الملتقطة من لوحة الرسم (Canvas)
const frame = new VideoFrame(canvasElement, {
  timestamp: currentTimestampMs * 1000,
  duration: 33000
});
videoEncoder.encode(frame, { keyFrame: isKeyFrame });
frame.close();

// 4. إنهاء وإنتاج ملف MP4 النهائي
await videoEncoder.flush();
muxer.finalize();
const mp4Blob = new Blob([target.buffer], { type: 'video/mp4' });`
    },
    {
      title: '4. نشر الموقع مجاناً بنقرة واحدة على GitHub Pages',
      language: 'yaml',
      code: `# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4`
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10 pb-16">
      
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          الدليل الهندسي الكامل
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight text-balance">
          كيف تبني موقعاً لتحويل محاضرات الجامعة الافتراضية إلى MP4؟
        </h2>
        <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          دليل تقني مفصل يشرح المعمارية الداخلية، خوارزميات فك تشفير ملفات <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-bold">.lrec</code>، ومعالجة الصوت والصورة في المتصفح بنسبة 100%.
        </p>
      </div>

      {/* Architecture Highlights: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            1. معالجة محلية بالكامل (Zero Server Cost)
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            الموقع لا يحتاج إلى خادم Backend باهظ التكلفة لتحويل الفيديو. كل بايت يتم تحليله وترميزه بواسطة معالج وكرت شاشة المستخدم عبر WebCodecs.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            2. خصوصية وسرعة فائقة للطلاب
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            لا ينتظر الطالب رفع ملفات بحجم مئات الميجابايت عبر الإنترنت السوري الضعيف؛ بل يبدأ التحويل فورياً بمجرد اختيار الملف في المتصفح.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
            3. استضافة مجانية على GitHub Pages
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            نظراً لأن التطبيق عبارة عن ملفات ثابتة (HTML / JS / CSS)، يمكن نشره مجاناً 100% ومدى الحياة عبر GitHub Pages أو Cloudflare Pages.
          </p>
        </div>
      </div>

      {/* Step by Step Breakdown */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 space-y-8">
        
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            المراحل السبع لتحويل محاضرات SVU إلى فيديو
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            برنامج المحاضرات الرسمي للجامعة الافتراضية السورية (Collaboration Player / Inter-Tel) لا يحفظ الفيديو كملف MP4 عادي، بل يقوم بتسجيل أوامر رسم وشاشات ومسار صوتي مضغوط. إليك كيف يتم تحويله برمجياً:
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Phase 1 */}
          <div className="border-r-2 border-emerald-600 pr-4 space-y-2">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
              المرحلة الأولى: قراءة الترويسة الثنائية (Binary Header Parsing)
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              يبدأ ملف <code className="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">.lrec</code> بسلسلة من البايتات. يبحث الكود عن العلامة السحرية <code className="font-mono">0x10, 0x04</code> لتحديد بداية تسجيلات Linktivity. يقرأ الكود أبعاد الشاشة الأصلية (العرض والارتفاع وعمق اللون سواء 8 بت بنظام لوحة الألوان أو 24/32 بت TrueColor).
            </p>
          </div>

          {/* Phase 2 */}
          <div className="border-r-2 border-emerald-600 pr-4 space-y-2">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
              المرحلة الثانية: فك ضغط تحديثات الشاشة (Delta Rectangles)
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              تحمل حزم الفيديو المعرف <code className="font-mono">0x8E</code>. هذه الحزم مضغوطة بخوارزمية Deflate (نفس المستخدمة في ملفات ZIP و GZIP). نقوم بتمرير الحزمة إلى <code className="font-mono">DecompressionStream('deflate')</code> المدمجة في المتصفحات الحديثة، فنحصل على مصفوفة مستطيلات فارقة تمثل الشرائح أو حركات مؤشر الماوس مع أبعادها <code className="font-mono">&#123; x, y, w, h &#125;</code>.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="border-r-2 border-emerald-600 pr-4 space-y-2">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
              المرحلة الثالثة: فك تشفير الصوت (TrueSpeech 8.5 kbps)
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              الصوت في محاضرات SVU مسجل بخوارزمية تاريخية تسمى DSP Group TrueSpeech (مشتقة من معيار G.723.1)، حيث تحمل حزم الصوت المعرف <code className="font-mono">0x80</code>. تتكون كل حزمة من كتل بحجم 32 بايت تُمثل 30 ملي ثانية من الصوت بتردد 8,000 هرتز. يتم استخدام مرمز LPC (Linear Predictive Coding) مع جداول الارتباط والنبضات لإنتاج مصفوفة عينات PCM خام (<code className="font-mono">Float32Array</code>).
            </p>
          </div>

          {/* Phase 4 */}
          <div className="border-r-2 border-emerald-600 pr-4 space-y-2">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
              المرحلة الرابعة: تنقية وتحسين جودة الصوت (Wiener Filter & Levelling)
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              بسبب التسجيلات القديمة، يعاني صوت المحاضرات من طنين الميكروفون وضجيج الخلفية وضعف الترددات. نقوم بتطبيق فلتر <strong className="text-stone-800 dark:text-stone-200">فاينر الطيفي (Wiener gain with decision-directed SNR)</strong> لعزل الضجيج المستمر، مع فلتر <strong className="text-stone-800 dark:text-stone-200">High-pass</strong> لقطع طنين التيار الكهربائي، و <strong className="text-stone-800 dark:text-stone-200">Presence Boost</strong> لرفع وضوح مخارج الحروف.
            </p>
          </div>

          {/* Phase 5 */}
          <div className="border-r-2 border-emerald-600 pr-4 space-y-2">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
              المرحلة الخامسة: إعادة تشكيل الإطارات وتوليد الفيديو (Frame Synthesis)
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              يتم إنشاء Framebuffer رقمي ورسم مستطيلات التحديث التراكمية عليه. بما أن الشرائح قد تبقى ثابتة لعدة دقائق أثناء حديث الأستاذ، نقوم بإرسال نبضات دورية (Heartbeat Frames) كل ثانية واحدة لضمان إمكانية التقديم والتأخير (Seeking) بدقة داخل مشغلات الفيديو.
            </p>
          </div>

          {/* Phase 6 */}
          <div className="border-r-2 border-emerald-600 pr-4 space-y-2">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
              المرحلة السادسة: الترميز العتادي عبر WebCodecs API
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              بدلاً من استخدام برمجيات بطيئة أو WebAssembly ثقيل كـ FFmpeg.wasm، نستفيد من واجهة <code className="font-mono">window.VideoEncoder</code> الأصلية في المتصفح. يقوم المتصفح بطلب مسرّع كرت الشاشة (GPU Hardware Acceleration) لترميز H.264 (AVC) أو VP9 بسرعة فائقة وبدون أي استهلاك كبير لبطارية الجهاز.
            </p>
          </div>

          {/* Phase 7 */}
          <div className="border-r-2 border-emerald-600 pr-4 space-y-2">
            <h4 className="text-base font-bold text-stone-900 dark:text-stone-100">
              المرحلة السابعة: التجميع بحاوية MP4 عبر mp4-muxer
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              مكتبة <code className="font-mono">mp4-muxer</code> تأخذ عينات الفيديو المشفرة مع عينات الصوت بترميز AAC، وتقوم بكتابة صناديق MP4 القياسية (<code className="font-mono">ftyp, moov, mdat</code>) مباشرة في مصفوفة الذاكرة. والنتيجة هي ملف <code className="font-mono">.mp4</code> متوافق مع كافة الهواتف والشاشات والحواسيب.
            </p>
          </div>

        </div>

      </div>

      {/* Code Snippets Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          أكواد برمجية أساسية لتطبيقها في مشروعك
        </h3>

        <div className="space-y-4">
          {codeSnippets.map((snippet, idx) => (
            <div key={idx} className="bg-stone-900 text-stone-100 rounded-xl overflow-hidden border border-stone-800">
              <div className="flex items-center justify-between px-4 py-2.5 bg-stone-950/80 border-b border-stone-800 text-xs font-mono">
                <span className="font-bold text-emerald-400">{snippet.title}</span>
                <button
                  onClick={() => copyToClipboard(snippet.code, idx)}
                  className="flex items-center gap-1.5 text-stone-400 hover:text-stone-200 transition-colors"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-stone-200" dir="ltr">
                <code>{snippet.code}</code>
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Technical FAQ Box */}
      <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-4">
        <h4 className="font-bold text-base text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          أهم التحديات وحلولها العملية أثناء بناء موقع كهذا
        </h4>
        <ul className="space-y-3 text-xs sm:text-sm text-amber-950 dark:text-amber-300 list-disc list-inside leading-relaxed">
          <li>
            <strong>تجميد التبويب في الخلفية (Background Tab Throttling):</strong> تقوم المتصفحات بخفض دقة الـ Timers مثل <code className="font-mono">setTimeout</code> عندما يغير المستخدم التبويب. الحل هو استخدام <code className="font-mono">MessageChannel</code> لتمرير النبضات، مع طلب قفل الشاشة <code className="font-mono">navigator.wakeLock</code> لمنع إغلاق الشاشة.
          </li>
          <li>
            <strong>دعم ترميز AAC في متصفحات الجوال:</strong> بعض المتصفحات لا تدعم ترميز AAC مباشرة عبر <code className="font-mono">AudioEncoder</code>. لهذا السبب قمنا بتضمين مرمز AAC-LC نقي بلغة جافاسكريبت (مستخرج من FFmpeg aactab) كاحتياطي يعمل في أي بيئة.
          </li>
          <li>
            <strong>تسريع وقت التحويل:</strong> تجنب إعادة رسم الإطارات التي لم تتغير. قم بتطبيق المستطيلات الفارقة (Delta Rectangles) فقط على الـ Framebuffer، واستدعِ <code className="font-mono">VideoEncoder.encode</code> بمعدل متغير أو عند وجود تغيير مرئي.
          </li>
        </ul>
      </div>

    </div>
  );
};
