import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setLang(lang === 'en' ? 'ne' : 'en')}
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                 border border-gray-200 dark:border-gray-600 transition-colors"
      aria-label="Toggle language"
      title={lang === 'en' ? 'नेपालीमा हेर्नुहोस्' : 'Switch to English'}
    >
      <span className="text-base">{lang === 'en' ? '🇳🇵' : '🇬🇧'}</span>
      <span className="text-xs text-gray-600 dark:text-gray-300">
        {lang === 'en' ? 'नेपाली' : 'English'}
      </span>
    </motion.button>
  );
}
