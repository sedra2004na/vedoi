/**
 * Synthetic SVU lecture generator for quick testing & demonstration.
 * Generates both an in-memory parsed lecture object and a downloadable demo .lrec file.
 */

// @ts-nocheck

export function createDemoParsedLecture() {
  const W = 1280;
  const H = 720;
  const duration = 14000; // 14 seconds

  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;

  const slidesData = [
    {
      ts: 0,
      render: () => {
        // Slide 1: Deep Green Heritage
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#0B3B2B');
        grad.addColorStop(1, '#04170F');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Header gold bar
        ctx.fillStyle = '#C9A24B';
        ctx.fillRect(0, 0, W, 16);

        // Border card
        ctx.strokeStyle = 'rgba(201, 162, 75, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(60, 60, W - 120, H - 120);

        ctx.textAlign = 'center';
        ctx.direction = 'rtl';

        // Badge
        ctx.fillStyle = '#D8B45F';
        ctx.font = 'bold 22px Cairo, sans-serif';
        ctx.fillText('• الشريحة 1 من 4 (الوقت: 0:00 - 0:03) •', W / 2, 130);

        ctx.fillStyle = '#F7EDCB';
        ctx.font = '800 48px Cairo, sans-serif';
        ctx.fillText('الجامعة الافتراضية السورية (SVU)', W / 2, 220);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 34px Cairo, sans-serif';
        ctx.fillText('محاضرة تجريبية: هندسة البرمجيات والأنظمة الموزعة', W / 2, 310);

        ctx.fillStyle = '#A7C4B5';
        ctx.font = '600 24px Cairo, sans-serif';
        ctx.fillText('برنامج هندسة تكنولوجيا المعلومات (ITE) · المحاضرة رقم 01', W / 2, 390);

        ctx.fillStyle = '#F0C36A';
        ctx.font = '700 22px Cairo, sans-serif';
        ctx.fillText('المحاضر: أ. د. سمير العمر · الفصل الدراسي الأول', W / 2, 470);

        // Status bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(100, 560, W - 200, 50);
        ctx.fillStyle = '#22C55E';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('STATUS: LREC STREAM LIVE • 8.0 kHz AUDIO • 1280x720 TRUECOLOR', W / 2, 592);
      }
    },
    {
      ts: 3500,
      render: () => {
        // Slide 2: Crisp White & Sapphire Blue
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#1E3A8A';
        ctx.fillRect(0, 0, W, 84);

        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(0, 84, W, 6);

        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px Cairo, sans-serif';
        ctx.fillText('الشريحة 2 من 4: البنية الثنائية لملفات تسجيلات LREC', W - 60, 54);

        const items = [
          '1. ملفات جلسات Linktivity تعتمد على حاوية ثنائية مخصصة للتعليم الافتراضي.',
          '2. تحديثات الشاشة تُخزن كمستطيلات فارقة (Delta Rectangles) مضغوطة بـ Deflate.',
          '3. الصوت يُسجل بنظام TrueSpeech 8.5 بتردد 8 كيلوهرتز وموجات 30 ملي ثانية.',
          '4. الميزة القصوى: حجم ملف خفيف جداً (حوالي 25 ميجابايت لساعتين كاملتين).'
        ];

        items.forEach((item, idx) => {
          ctx.fillStyle = '#F1F5F9';
          ctx.fillRect(80, 140 + idx * 115, W - 160, 85);

          ctx.fillStyle = '#2563EB';
          ctx.fillRect(W - 88, 140 + idx * 115, 8, 85);

          ctx.fillStyle = '#0F172A';
          ctx.font = '700 24px Cairo, sans-serif';
          ctx.fillText(item, W - 120, 195 + idx * 115);
        });

        // Time indicator
        ctx.textAlign = 'left';
        ctx.direction = 'ltr';
        ctx.fillStyle = '#64748B';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TIME: 0:03.5 - 0:07.0 • SLIDE 2 ACTIVE', 90, H - 30);
      }
    },
    {
      ts: 7000,
      render: () => {
        // Slide 3: Deep Slate & Emerald WebCodecs Architecture
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#065F46';
        ctx.fillRect(0, 0, W, 84);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(0, 84, W, 6);

        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillStyle = '#ECFDF5';
        ctx.font = 'bold 32px Cairo, sans-serif';
        ctx.fillText('الشريحة 3 من 4: خط أنابيب التحويل المباشر في المتصفح', W - 60, 54);

        const steps = [
          { title: '1. قراءة البايتات', desc: 'استخراج كتل 0x8E و 0x80' },
          { title: '2. فك ضغط Deflate', desc: 'DecompressionStream أصلي' },
          { title: '3. فك تشفير الصوت', desc: 'TrueSpeech G.723.1 + فلتر فاينر' },
          { title: '4. ترميز H.264', desc: 'WebCodecs VideoEncoder عتادي' },
          { title: '5. دمج MP4', desc: 'mp4-muxer وحفظ فوري' }
        ];

        steps.forEach((step, idx) => {
          const boxX = 60 + idx * 235;
          const boxY = 220;
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(boxX, boxY, 215, 200);

          ctx.strokeStyle = idx === 3 ? '#10B981' : '#475569';
          ctx.lineWidth = 3;
          ctx.strokeRect(boxX, boxY, 215, 200);

          ctx.textAlign = 'center';
          ctx.direction = 'rtl';
          ctx.fillStyle = '#38BDF8';
          ctx.font = 'bold 22px Cairo, sans-serif';
          ctx.fillText(step.title, boxX + 107, boxY + 65);

          ctx.fillStyle = '#CBD5E1';
          ctx.font = '500 16px Cairo, sans-serif';
          ctx.fillText(step.desc, boxX + 107, boxY + 125);
        });

        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ctx.fillStyle = '#34D399';
        ctx.font = 'bold 26px Cairo, sans-serif';
        ctx.fillText('✔ المعالجة تتم بنسبة 100% داخل المتصفح بدون إرسال أي بايت للإنترنت', W / 2, 530);

        // Time indicator
        ctx.textAlign = 'left';
        ctx.direction = 'ltr';
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TIME: 0:07.0 - 0:10.5 • SLIDE 3 ACTIVE', 90, H - 30);
      }
    },
    {
      ts: 10500,
      render: () => {
        // Slide 4: Golden Bronze Success Conclusion
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#2D1B00');
        grad.addColorStop(1, '#1A0F00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#D97706';
        ctx.fillRect(0, 0, W, 84);
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(0, 84, W, 6);

        ctx.textAlign = 'right';
        ctx.direction = 'rtl';
        ctx.fillStyle = '#FFFBEB';
        ctx.font = 'bold 32px Cairo, sans-serif';
        ctx.fillText('الشريحة 4 من 4: خلاصة التحويل ونجاح المعالجة', W - 60, 54);

        ctx.textAlign = 'center';
        ctx.direction = 'rtl';

        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 44px Cairo, sans-serif';
        ctx.fillText('تم إعداد وتحويل المحاضرة إلى MP4 بنجاح!', W / 2, 260);

        ctx.fillStyle = '#F3F4F6';
        ctx.font = '600 24px Cairo, sans-serif';
        ctx.fillText('يمكنك الآن تشغيل الفيديو على هاتفك أو حاسوبك أو شاشتك الذكية.', W / 2, 340);

        ctx.fillStyle = '#FDE68A';
        ctx.font = 'bold 22px Cairo, sans-serif';
        ctx.fillText('شكرًا لطلاب الجامعة الافتراضية السورية 🇸🇾', W / 2, 430);

        // Time indicator
        ctx.textAlign = 'left';
        ctx.direction = 'ltr';
        ctx.fillStyle = '#FCD34D';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('TIME: 0:10.5 - 0:14.0 • FINAL SLIDE 4', 90, H - 30);
      }
    }
  ];

  // Build updates array with independent cloned pixel buffers
  const ups: any[] = [];
  for (const s of slidesData) {
    s.render();
    const imgData = ctx.getImageData(0, 0, W, H);
    const pixels = new Uint32Array(imgData.data.buffer.slice(0));
    ups.push({
      ts: s.ts,
      rects: [
        {
          x: 0,
          y: 0,
          w: W,
          h: H,
          data: pixels
        }
      ]
    });
  }

  // Generate synthetic voice PCM audio (8 kHz, 14 seconds = 112,000 samples)
  const rate = 8000;
  const totalSamples = Math.round((duration / 1000) * rate);
  const pcm = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / rate;
    const pauseCycle = t % 2.5;
    if (pauseCycle < 2.0) {
      const f0 = 135 + 20 * Math.sin(2 * Math.PI * 1.8 * t);
      const amp = 0.35 * (0.8 + 0.2 * Math.sin(2 * Math.PI * 3.5 * t));
      const s1 = Math.sin(2 * Math.PI * f0 * t);
      const s2 = 0.45 * Math.sin(2 * Math.PI * (f0 * 2.1) * t);
      const s3 = 0.2 * Math.sin(2 * Math.PI * (f0 * 3.3) * t);
      const noise = (Math.random() - 0.5) * 0.04;
      pcm[i] = (s1 + s2 + s3 + noise) * amp;
    } else {
      pcm[i] = (Math.random() - 0.5) * 0.003;
    }
  }

  return {
    W,
    H,
    bpp: 32,
    ups,
    skipped: 0,
    bad: {},
    audio: {
      pcm,
      len: totalSamples,
      rate,
      seconds: duration / 1000
    },
    duration
  };
}
