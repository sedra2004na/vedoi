import React from 'react';
import { 
  FileCode, 
  Video, 
  Layers, 
  Volume2, 
  Minimize2, 
  CheckCircle2, 
  HelpCircle,
  Binary
} from 'lucide-react';

export const SpecsExplainer: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
          المواصفات الفنية لملفات محاضرات LREC مقابل MP4
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm max-w-2xl mx-auto">
          لماذا تستخدم الجامعة الافتراضية السورية صيغة .lrec وما هي الفروقات الجوهرية بينها وبين الفيديو القياسي؟
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LREC Spec Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                صيغة تسجيلات LREC (.lrec)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Inter-Tel / Linktivity Session Recording
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">طريقة التخزين:</strong> لا تُخزن فيديو حقيقي، بل تُخزن سجل أحداث ورسومات (Event stream) مع حزم تحديث مستطيلات متغيرة (Delta Chunks).
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">ضغط الصورة:</strong> تستخدم خوارزمية Deflate بدون ضغط فيديو فقداني (Lossless)، مما يحافظ على حدة النصوص والخطوط البرمجية الصغيرة جداً.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">ترميز الصوت:</strong> تعتمد على TrueSpeech 8.5 بمعدل بت فائق الانخفاض (8.5 كيلوبت/ثانية)، ما يجعل حجم ملف المحاضرة بالكامل حوالي 15 إلى 35 ميجابايت لساعتين!
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">العيب الرئيسي:</strong> لا يمكن تشغيلها إلا عبر تطبيق Collaboration Player المخصص لويندوز فقط، ولا تعمل على شاشات التلفاز أو هواتف أندرويد وآيفون ومستعرضات الويب بدون تحويل.
              </div>
            </div>
          </div>
        </div>

        {/* MP4 Spec Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-800/80 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                صيغة الفيديو القياسية MP4 (.mp4)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                MPEG-4 Part 14 / H.264 + AAC
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">طريقة التخزين:</strong> إطارات فيديو قياسية كاملة (I-Frames و P-Frames) يمكن تشغيلها على أي جهاز في العالم.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">ضغط الصورة:</strong> تستخدم مرمز H.264 (AVC) أو VP9 المسرع بالعتاد مع معدل بت ذكي وموازنة كمية للحفاظ على دقة الشرائح.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">ترميز الصوت:</strong> صوت نقي AAC عالي الجودة بعد تنقية الضجيج ورفع مخارج الحروف ليصبح مريحاً للاستماع أثناء الدراسة لساعات طويلة.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
              <div>
                <strong className="text-stone-900 dark:text-stone-100">الميزة القصوى:</strong> إمكانية تسريع المحاضرة (1.25x، 1.5x)، المزامنة مع Google Drive، العرض على الشاشات الذكية، والمشاركة المباشرة عبر تيليجرام وواتساب.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Anatomy of LREC binary buffer */}
      <div className="p-6 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 space-y-4">
        <h4 className="font-bold text-base text-emerald-400 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          البنية الهندسية لحزمة LREC الثنائية
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono text-center">
          <div className="p-3 bg-stone-800/80 rounded-lg border border-stone-700">
            <span className="text-amber-400 font-bold block mb-1">0x00 - 0x07</span>
            <span>طابع التوقيت (Timestamp بالملي ثانية)</span>
          </div>
          <div className="p-3 bg-stone-800/80 rounded-lg border border-stone-700">
            <span className="text-emerald-400 font-bold block mb-1">0x08 - 0x09</span>
            <span>العلامة السحرية (0x10, 0x04)</span>
          </div>
          <div className="p-3 bg-stone-800/80 rounded-lg border border-stone-700">
            <span className="text-sky-400 font-bold block mb-1">0x0A - 0x0C</span>
            <span>طول الحمولة (Payload Length)</span>
          </div>
          <div className="p-3 bg-stone-800/80 rounded-lg border border-stone-700">
            <span className="text-rose-400 font-bold block mb-1">0x0F</span>
            <span>نوع السجل (0x8E = شاشة، 0x80 = صوت)</span>
          </div>
        </div>
      </div>

    </div>
  );
};
