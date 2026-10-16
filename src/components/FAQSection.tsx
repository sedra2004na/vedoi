import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Zap, Laptop, FileQuestion } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'هل يتم رفع ملفات المحاضرة إلى أي خادم (Server) على الإنترنت؟',
      answer: 'قطعاً لا. تتم كافة مراحل فك الضغط، فك التشفير، تنقية الصوت، وترميز الفيديو داخل متصفحك مباشرة بنسبة 100% باستخدام معالج جهازك (Client-side WebCodecs). لا يتم استهلاك باقة الإنترنت لديك في الرفع، ولا يمكن لأي طرف الاطلاع على محتوى محاضراتك.'
    },
    {
      question: 'ما هي المتصفحات الأفضل لتحويل المحاضرات بأعلى سرعة؟',
      answer: 'المتصفحات المبنية على نواة Chromium مثل Google Chrome و Microsoft Edge و Brave و Opera هي الأفضل على الإطلاق، لأنها تدعم الاستفادة الكاملة من مسرع كرت الشاشة (Hardware Accelerated VideoEncoder) مما يجعل التحويل سريعاً جداً (عادة 2 إلى 4 دقائق لمحاضرة كاملة مدتها ساعتان).'
    },
    {
      question: 'كيف أحصل على ملفات المحاضرات بصيغة .lrec من موقع الجامعة؟',
      answer: 'يمكنك تنزيل المحاضرات غير المتزامنة بالدخول إلى بوابة الطالب (SVUIS) من موقع الجامعة الافتراضية السورية، والتوجه إلى قسم "Download Session"، ثم اختيار الفصل والمقرر والمحاضرة المطلوبة والضغط على زر التحميل، لتحصل على ملف ينتهي بامتداد .lrec.'
    },
    {
      question: 'لماذا يبدو صوت المحاضرة أفضل بكثير بعد التحويل عبر هذا الموقع؟',
      answer: 'لأن الموقع يطبق خوارزمية فلتر فاينر (Wiener Filter with decision-directed SNR) التي تحلل إطارات الصمت في المحاضرة لتقدير بصمة الضجيج والطنين في ميكروفون الأستاذ وعزلها، بالإضافة إلى فلتر Presence Boost الذي يعزز ترددات مخارج الحروف العربية (بين 2.2 و 2.8 كيلوهرتز).'
    },
    {
      question: 'ماذا أفعل إذا ظهرت رسالة خطأ أثناء التحويل أو كان كرت الشاشة لا يدعم H.264؟',
      answer: 'يمكنك فتح قسم "تخصيص الإعدادات" في المحول وتفعيل خيار "استخدام المرمز البرمجي (Software Encoder)". سيقوم المتصفح حينها باستخدام المعالج بدلاً من كرت الشاشة لإتمام العملية بنجاح.'
    },
    {
      question: 'كيف يمكنني نشر مثل هذا الموقع مجاناً على حسابي في GitHub؟',
      answer: 'المشروع مصمم ليكون تطبيق ويب ثابت (Static Web App). يمكنك وضعه في مستودع GitHub وتفعيل خدمة GitHub Pages من إعدادات المستودع (Settings -> Pages -> Deploy from a branch)، وسيعمل الموقع برابط مباشر مثل aliahamza.github.io دون الحاجة لأي خادم مدفوع.'
    }
  ];

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
      
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          مركز الإجابات التقنية
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
          الأسئلة الشائعة حول تحويل محاضرات الجامعة الافتراضية
        </h2>
        <p className="text-stone-600 dark:text-stone-400 text-sm max-w-2xl mx-auto">
          إجابات شاملة لطلاب ومطوري الجامعة الافتراضية السورية حول آلية عمل التحويل، الأداء، والخصوصية.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-xs transition-colors"
            >
              <button
                onClick={() => toggleItem(idx)}
                className="w-full p-5 text-start flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
              >
                <span className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-stone-400 dark:text-stone-500 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-800/80">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
