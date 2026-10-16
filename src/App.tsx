/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ConverterCard } from './components/ConverterCard';

const getInitialTheme = (): boolean => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('svu-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
      }
    }
  } catch (e) {
    // In restricted iframe environments, default safely
  }
  return false;
};

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    try {
      const root = document.documentElement;
      const body = document.body;

      if (isDark) {
        root.classList.add('dark');
        body?.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        body?.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        root.style.colorScheme = 'light';
      }

      try {
        localStorage.setItem('svu-theme', isDark ? 'dark' : 'light');
      } catch (err) {
        // Ignore localStorage quota or cross-origin iframe security restrictions
      }
    } catch (e) {
      console.error('Theme sync error:', e);
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors font-sans">
      
      {/* Top Header */}
      <Navbar
        isDark={isDark}
        setIsDark={setIsDark}
        toggleTheme={toggleTheme}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight text-balance">
            محوّل تسجيلات المحاضرات إلى فيديو MP4
          </h1>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
            حوّل ملفات المحاضرات <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">.lrec</span> مباشرة في متصفحك إلى فيديو MP4 عالي الدقة مع تنقية الصوت وتوافق كامل مع كافة المشغلات.
          </p>
        </div>

        {/* Core Converter Tool */}
        <ConverterCard />

      </main>

      {/* Clean Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 transition-colors py-6 mt-12 text-xs text-stone-500 dark:text-stone-400 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <span className="font-bold text-stone-700 dark:text-stone-300">
            محوّل محاضرات الجامعة الافتراضية السورية إلى MP4
          </span>
        </div>
      </footer>

    </div>
  );
}
