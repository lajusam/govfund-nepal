import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROVINCE_STYLES } from '../../data/nepalGeoJSON';
import { PROVINCES } from '../../data/nepalData';

export default function ProvinceInfoPanel({ provinceId, onClose, projectCounts = {}, language = 'en' }) {
  const style = provinceId ? PROVINCE_STYLES[provinceId] : null;
  const provinceData = provinceId ? PROVINCES.find(p => p.id === provinceId) : null;
  const count = provinceId ? (projectCounts[provinceId] || 0) : 0;
  const districts = provinceData
    ? (language === 'ne' ? provinceData.districtsNe : provinceData.districts)
    : [];

  return (
    <AnimatePresence>
      {provinceId && style && (
        <motion.div
          key={provinceId}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute top-0 right-0 bottom-0 z-30 w-80 sm:w-96"
        >
          <div className="h-full bg-[#0d1117]/95 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden">
            {/* Color accent bar */}
            <div className="h-1 w-full" style={{ backgroundColor: style.fill }} />

            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Province {provinceId}</p>
                <h2 className="text-2xl font-bold text-white leading-tight">
                  {language === 'ne' ? style.nameNe : style.name}
                </h2>
                <p className="text-sm text-white/50 mt-0.5">
                  Capital: {language === 'ne' ? style.capitalNe : style.capital}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-1 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats grid */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-2xl font-bold" style={{ color: style.fill }}>{count}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Active Projects</div>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{districts.length}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Districts</div>
                </div>
              </div>
            </div>

            {/* Districts list */}
            <div className="px-6 flex-1 overflow-y-auto min-h-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Districts</p>
              <div className="flex flex-wrap gap-1.5 pb-4">
                {districts.map((d, i) => (
                  <motion.span
                    key={d}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.2 }}
                    className="text-xs px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-white/60"
                  >
                    {d}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-4 border-t border-white/[0.06]">
              <a
                href={`/projects?province=${encodeURIComponent(style.name)}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: style.fill + '1A',
                  color: style.fill,
                  border: `1px solid ${style.fill}33`,
                }}
              >
                View Projects
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
