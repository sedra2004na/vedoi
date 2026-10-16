import React from 'react';
import { Video, Moon, Sun } from 'lucide-react';

interface NavbarProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isDark, setIsDark, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 text-amber-300 flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            <Video className="w-5 h-5 text-amber-300" />
          </div>
          <h1 className="font-extrabold text-base sm:text-lg text-emerald-900 dark:text-emerald-100 tracking-tight whitespace-nowrap">
            محوّل محاضرات الجامعة الافتراضية السورية إلى MP4
          </h1>
        </div>

        {/* Theme Controller: Explicit Sun & Moon buttons for foolproof switching */}
        <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl border border-stone-200 dark:border-stone-700/80 shadow-xs shrink-0">
          {/* زر الشمس */}
          <button
            type="button"
            onClick={() => setIsDark(false)}
            aria-label="الوضع الفاتح"
            title="الوضع الفاتح"
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
              !isDark
                ? 'bg-white text-amber-600 shadow-xs border border-amber-200/60'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Sun className={`w-4 h-4 ${!isDark ? 'text-amber-500 fill-amber-400/20' : ''}`} />
          </button>

          {/* زر القمر */}
          <button
            type="button"
            onClick={() => setIsDark(true)}
            aria-label="الوضع الداكن"
            title="الوضع الداكن"
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
              isDark
                ? 'bg-stone-900 text-emerald-400 shadow-xs border border-emerald-900/60'
                : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
            }`}
          >
            <Moon className={`w-4 h-4 ${isDark ? 'text-emerald-400 fill-emerald-400/20' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
};
