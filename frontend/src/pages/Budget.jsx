import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getBudgetAll } from '../services/api';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
    Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Lock, ExternalLink, AlertTriangle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ── Animation variants (matching project conventions) ────────────────────────
const slideUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
    }),
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: (i = 0) => ({
        opacity: 1, scale: 1,
        transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
    }),
};

const tabContentVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

// ── Utilization color helper ─────────────────────────────────────────────────
function utilizationColor(pct) {
    if (pct < 20) return { bar: '#C2410C', text: 'text-[#C2410C]', bg: 'bg-[#C2410C]' };
    if (pct <= 40) return { bar: '#FAD980', text: 'text-amber-glow', bg: 'bg-amber-glow' };
    return { bar: '#1E7F4E', text: 'text-[#1E7F4E]', bg: 'bg-[#1E7F4E]' };
}

// ── Tab definitions ──────────────────────────────────────────────────────────
const TAB_IDS = ['split', 'provinces', 'ministries', 'utilization'];

export default function Budget() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('split');
    const { t } = useLanguage();

    const tabs = useMemo(() => [
        { id: 'split',       label: t('budgetSplitTitle') },
        { id: 'provinces',   label: t('budgetProvinceGrants') },
        { id: 'ministries',  label: t('budgetMinistryBreakdown') },
        { id: 'utilization', label: t('budgetUtilization') },
    ], [t]);

    useEffect(() => {
        getBudgetAll().then(d => { setData(d); setLoading(false); });
    }, []);

    // ── Donut chart: Budget Split ────────────────────────────────────────────
    const splitChartData = useMemo(() => {
        if (!data) return null;
        return {
            labels: [
                t('budgetRecurrent'),
                t('budgetCapital'),
                t('budgetFinancialMgmt'),
            ],
            datasets: [{
                data: [
                    data.summary.recurrentExpenditure,
                    data.summary.capitalExpenditure,
                    data.summary.financialManagement,
                ],
                backgroundColor: ['#FFB81CCC', '#FAD980CC', '#8E6F3ECC'],
                borderColor: '#1A160F',
                borderWidth: 3,
                hoverOffset: 8,
                hoverBorderColor: '#FAD980',
                hoverBorderWidth: 2,
            }],
        };
    }, [data, t]);

    // ── Horizontal bar: Province Grants (sorted) ─────────────────────────────
    const sortedProvinces = useMemo(() => {
        if (!data) return [];
        return [...data.provinceGrants].sort((a, b) => b.grant - a.grant);
    }, [data]);

    const provinceChartData = useMemo(() => {
        if (!sortedProvinces.length) return null;
        return {
            labels: sortedProvinces.map(p => p.name),
            datasets: [{
                label: t('budgetFederalGrant'),
                data: sortedProvinces.map(p => p.grant),
                backgroundColor: '#FFB81C55',
                borderColor: '#FFB81C',
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: '#FFB81C88',
            }],
        };
    }, [sortedProvinces, t]);

    // ── Vertical bar: Ministry Breakdown ─────────────────────────────────────
    const ministryChartData = useMemo(() => {
        if (!data) return null;
        return {
            labels: data.ministries.map(m => m.name.length > 20 ? m.name.slice(0, 18) + '…' : m.name),
            datasets: [{
                label: t('budgetAmount'),
                data: data.ministries.map(m => m.amount),
                backgroundColor: data.ministries.map((_, i) => {
                    const ratio = i / (data.ministries.length - 1);
                    return `rgba(${Math.round(255 - ratio * 113)},${Math.round(184 - ratio * 73)},${Math.round(28 + ratio * 34)},0.75)`;
                }),
                borderColor: '#FFB81C',
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: '#FFB81CBB',
            }],
        };
    }, [data, t]);

    // Chart.js theme options
    const chartFont = { color: '#C4A96E', font: { size: 12 } };
    const gridStyle = { color: 'rgba(142,111,62,0.14)' };
    const tooltipStyle = {
        backgroundColor: '#2D2518',
        titleColor: '#F5F1E6',
        bodyColor: '#E0D5B5',
        borderColor: 'rgba(142,111,62,0.28)',
        borderWidth: 1,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertTriangle className="w-10 h-10 text-gov-orange" />
                <p className="text-parchment-muted font-heading">{t('budgetNoData')}</p>
            </div>
        );
    }

    const totalSpent = data.utilization.find(u => u.category === 'Total');
    const totalGrants = sortedProvinces.reduce((s, p) => s + p.grant, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* ═══ Page Header ═══ */}
            <motion.div
                className="mb-10 relative"
                initial="hidden" animate="visible" variants={slideUp}
            >
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-golden-radial opacity-40 pointer-events-none" />
                <h1 className="section-title text-parchment relative z-10">{t('budgetTitle')}</h1>
                <p className="section-subtitle relative z-10">
                    {t('budgetSubtitle')} — FY {data.fiscalYear}
                </p>
                {data.ipfsCid && (
                    <motion.div
                        className="flex items-center gap-2 mt-3 relative z-10"
                        variants={scaleIn} custom={1}
                    >
                        <Lock size={14} className="text-gov-green" />
                        <span className="text-xs font-mono text-parchment-muted">
                            IPFS: {data.ipfsCid.slice(0, 12)}…{data.ipfsCid.slice(-6)}
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* ═══ Summary Stat Cards ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                {[
                    {
                        label: t('budgetTotalAllocated'),
                        value: `${data.summary.totalBudget}B`,
                        sub: 'NPR',
                        borderColor: 'border-t-golden',
                        icon: '💰',
                    },
                    {
                        label: t('budgetTotalSpent'),
                        value: totalSpent ? `${totalSpent.spent}B` : '—',
                        sub: 'NPR',
                        borderColor: 'border-t-bronze',
                        icon: '📊',
                    },
                    {
                        label: t('budgetOverallUtil'),
                        value: totalSpent ? `${totalSpent.percentage}%` : '—',
                        sub: '',
                        borderColor: 'border-t-gov-green',
                        icon: '📈',
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        className={`glass-card p-5 relative overflow-hidden group hover:-translate-y-1 transition-all border-t-[3px] ${stat.borderColor}`}
                        variants={scaleIn} initial="hidden" animate="visible" custom={i}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{stat.icon}</span>
                            <p className="text-xs text-parchment-ghost font-medium uppercase tracking-wider">{stat.label}</p>
                        </div>
                        <p className="text-2xl md:text-3xl font-heading font-bold text-parchment tabular-nums">
                            {stat.value} <span className="text-sm text-parchment-muted font-normal">{stat.sub}</span>
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ═══ Tab Selector ═══ */}
            <div className="flex flex-wrap gap-2 mb-8">
                {tabs.map((tab) => (
                    <motion.button
                        key={tab.id}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-golden to-golden-600 text-basalt font-bold shadow-golden-sm'
                                : 'bg-earth text-parchment-muted hover:bg-earth-light hover:text-amber-glow border border-earth-border'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="budgetTabIndicator"
                                className="absolute inset-0 bg-gradient-to-r from-golden to-golden-600 rounded-xl -z-10"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* ═══ Tab Content (two-column layout) ═══ */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    {/* ──── Total Budget Split ──── */}
                    {activeTab === 'split' && (
                        <div className="glass-card p-6 mb-8">
                            <h3 className="font-heading font-bold text-lg mb-5 text-parchment flex items-center gap-2">
                                <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                                {t('budgetSplitTitle')}
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                {/* Left — Chart (60%) */}
                                <div className="lg:col-span-3 flex items-center justify-center">
                                    <div className="w-full max-w-sm">
                                        {splitChartData && (
                                            <Doughnut
                                                data={splitChartData}
                                                options={{
                                                    responsive: true,
                                                    plugins: {
                                                        legend: {
                                                            position: 'bottom',
                                                            labels: { color: '#C4A96E', padding: 16, usePointStyle: true, font: { size: 13 } },
                                                        },
                                                        tooltip: {
                                                            ...tooltipStyle,
                                                            callbacks: {
                                                                label: (ctx) => {
                                                                    const total = data.summary.totalBudget;
                                                                    const pct = ((ctx.raw / total) * 100).toFixed(2);
                                                                    return ` ${ctx.label}: ${ctx.raw}B NPR (${pct}%)`;
                                                                },
                                                            },
                                                        },
                                                    },
                                                    cutout: '55%',
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                                {/* Right — Data Table (40%) */}
                                <div className="lg:col-span-2">
                                    <div className="rounded-xl overflow-hidden border border-[rgba(142,111,62,0.28)]">
                                        {[
                                            { label: t('budgetRecurrent'), val: data.summary.recurrentExpenditure, pct: '61.31' },
                                            { label: t('budgetCapital'), val: data.summary.capitalExpenditure, pct: '18.94' },
                                            { label: t('budgetFinancialMgmt'), val: data.summary.financialManagement, pct: '19.74' },
                                        ].map((row, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center justify-between px-4 py-3.5 ${
                                                    i % 2 === 0 ? 'bg-earth' : 'bg-[#352D1E]'
                                                } ${i > 0 ? 'border-t border-[rgba(142,111,62,0.28)]' : ''}`}
                                            >
                                                <span className="text-parchment text-sm font-medium">{row.label}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-golden font-heading font-bold text-sm tabular-nums">{row.val}B</span>
                                                    <span className="text-amber-glow text-xs font-semibold px-2 py-0.5 rounded-full border border-bronze/40">
                                                        {row.pct}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Total row */}
                                        <div className="flex items-center justify-between px-4 py-3.5 bg-earth-light border-t border-[rgba(142,111,62,0.28)]">
                                            <span className="text-parchment font-heading font-bold text-sm">{t('budgetCat_Total')}</span>
                                            <span className="text-golden font-heading font-bold text-sm tabular-nums">{data.summary.totalBudget}B NPR</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── Province Grants ──── */}
                    {activeTab === 'provinces' && (
                        <div className="glass-card p-6 mb-8">
                            <h3 className="font-heading font-bold text-lg mb-5 text-parchment flex items-center gap-2">
                                <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                                {t('budgetProvinceGrants')}
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                {/* Left — Chart */}
                                <div className="lg:col-span-3">
                                    {provinceChartData && (
                                        <Bar
                                            data={provinceChartData}
                                            options={{
                                                indexAxis: 'y',
                                                responsive: true,
                                                plugins: {
                                                    legend: { display: false },
                                                    tooltip: {
                                                        ...tooltipStyle,
                                                        callbacks: { label: (ctx) => ` ${ctx.raw}B NPR` },
                                                    },
                                                },
                                                scales: {
                                                    x: { ticks: chartFont, grid: gridStyle },
                                                    y: { ticks: { ...chartFont, font: { size: 13 } }, grid: { display: false } },
                                                },
                                            }}
                                        />
                                    )}
                                </div>
                                {/* Right — Data Table */}
                                <div className="lg:col-span-2">
                                    <div className="rounded-xl overflow-hidden border border-[rgba(142,111,62,0.28)]">
                                        {sortedProvinces.map((p, i) => {
                                            const pct = ((p.grant / totalGrants) * 100).toFixed(1);
                                            return (
                                                <div
                                                    key={p.name}
                                                    className={`flex items-center justify-between px-4 py-3 ${
                                                        i % 2 === 0 ? 'bg-earth' : 'bg-[#352D1E]'
                                                    } ${i > 0 ? 'border-t border-[rgba(142,111,62,0.28)]' : ''}`}
                                                >
                                                    <span className="text-parchment text-sm font-medium">{p.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-golden font-heading font-bold text-sm tabular-nums">{p.grant}B</span>
                                                        <span className="text-amber-glow text-xs font-semibold px-2 py-0.5 rounded-full border border-bronze/40">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Total row */}
                                        <div className="flex items-center justify-between px-4 py-3 bg-earth-light border-t border-[rgba(142,111,62,0.28)]">
                                            <span className="text-parchment font-heading font-bold text-sm">{t('budgetCat_Total')}</span>
                                            <span className="text-golden font-heading font-bold text-sm tabular-nums">{totalGrants.toFixed(2)}B NPR</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── Ministry Breakdown ──── */}
                    {activeTab === 'ministries' && (
                        <div className="glass-card p-6 mb-8">
                            <h3 className="font-heading font-bold text-lg mb-5 text-parchment flex items-center gap-2">
                                <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                                {t('budgetMinistryBreakdown')}
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                {/* Left — Chart */}
                                <div className="lg:col-span-3">
                                    {ministryChartData && (
                                        <Bar
                                            data={ministryChartData}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { display: false },
                                                    tooltip: {
                                                        ...tooltipStyle,
                                                        callbacks: {
                                                            label: (ctx) => {
                                                                const ministry = data.ministries[ctx.dataIndex];
                                                                return ` ${ministry.amount}B NPR (${ministry.percentage}%)`;
                                                            },
                                                        },
                                                    },
                                                },
                                                scales: {
                                                    x: {
                                                        ticks: { ...chartFont, maxRotation: 45, minRotation: 35, font: { size: 10 } },
                                                        grid: { display: false },
                                                    },
                                                    y: { ticks: chartFont, grid: gridStyle },
                                                },
                                            }}
                                        />
                                    )}
                                </div>
                                {/* Right — Data Table */}
                                <div className="lg:col-span-2">
                                    <div className="rounded-xl overflow-hidden border border-[rgba(142,111,62,0.28)]">
                                        {data.ministries.map((m, i) => (
                                            <div
                                                key={m.name}
                                                className={`flex items-center justify-between px-4 py-3 ${
                                                    i % 2 === 0 ? 'bg-earth' : 'bg-[#352D1E]'
                                                } ${i > 0 ? 'border-t border-[rgba(142,111,62,0.28)]' : ''}`}
                                            >
                                                <span className="text-parchment text-sm font-medium truncate max-w-[140px]" title={m.name}>
                                                    {m.name}
                                                </span>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-golden font-heading font-bold text-sm tabular-nums">{m.amount}B</span>
                                                    <span className="text-amber-glow text-xs font-semibold px-2 py-0.5 rounded-full border border-bronze/40">
                                                        {m.percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── Budget Utilization ──── */}
                    {activeTab === 'utilization' && (
                        <div className="glass-card p-6 mb-8">
                            <h3 className="font-heading font-bold text-lg mb-5 text-parchment flex items-center gap-2">
                                <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                                {t('budgetUtilization')}
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                {/* Left — Progress bars (chart area) */}
                                <div className="lg:col-span-3 space-y-6">
                                    {data.utilization.map((u, i) => {
                                        const color = utilizationColor(u.percentage);
                                        const isLow = u.percentage < 20;
                                        return (
                                            <motion.div
                                                key={u.category}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.5, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-heading font-semibold text-parchment text-sm">
                                                            {t(`budgetCat_${u.category.replace(/\s+/g, '')}`) || u.category}
                                                        </span>
                                                        {isLow && (
                                                            <span className="flex items-center gap-1 text-[10px] text-[#C2410C] font-semibold bg-[#C2410C]/10 px-2 py-0.5 rounded-full">
                                                                <AlertTriangle size={10} /> {t('budgetCriticallyLow')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-sm font-heading font-bold tabular-nums ${color.text}`}>
                                                        {u.percentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-3 rounded-full bg-earth-light overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: color.bar }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(u.percentage, 100)}%` }}
                                                        transition={{ duration: 1.0, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
                                                    />
                                                </div>
                                                <div className="flex justify-between mt-1 text-xs text-parchment-ghost">
                                                    <span>{t('budgetAllocatedLabel')}: {u.allocated}B NPR</span>
                                                    <span>{t('budgetSpentLabel')}: {u.spent}B NPR</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                {/* Right — Data Table with mini progress bars */}
                                <div className="lg:col-span-2">
                                    <div className="rounded-xl overflow-hidden border border-[rgba(142,111,62,0.28)]">
                                        {data.utilization.map((u, i) => {
                                            const color = utilizationColor(u.percentage);
                                            const isLow = u.percentage < 20;
                                            return (
                                                <div
                                                    key={u.category}
                                                    className={`px-4 py-3.5 ${
                                                        i % 2 === 0 ? 'bg-earth' : 'bg-[#352D1E]'
                                                    } ${i > 0 ? 'border-t border-[rgba(142,111,62,0.28)]' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-parchment text-sm font-medium">
                                                                {t(`budgetCat_${u.category.replace(/\s+/g, '')}`) || u.category}
                                                            </span>
                                                            {isLow && <AlertTriangle size={12} className="text-[#C2410C]" />}
                                                        </div>
                                                        <span className={`text-xs font-heading font-bold tabular-nums ${color.text}`}>
                                                            {u.percentage}%
                                                        </span>
                                                    </div>
                                                    {/* Mini progress bar */}
                                                    <div className="w-full h-1.5 rounded-full bg-earth-light overflow-hidden mb-1.5">
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: color.bar }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(u.percentage, 100)}%` }}
                                                            transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-parchment-ghost">{u.allocated}B</span>
                                                        <span className="text-golden font-semibold">{u.spent}B {t('budgetSpentLabel').toLowerCase()}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ═══ IPFS Verification Footer ═══ */}
            <motion.div
                className="glass-card p-6"
                variants={slideUp} initial="hidden" animate="visible" custom={6}
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gov-green/15 flex items-center justify-center">
                            <Lock size={18} className="text-gov-green" />
                        </div>
                        <div>
                            <p className="font-heading font-semibold text-parchment text-sm">{t('budgetIpfsTitle')}</p>
                            {data.ipfsCid ? (
                                <p className="text-xs font-mono text-parchment-muted mt-0.5 break-all">
                                    CID: {data.ipfsCid}
                                </p>
                            ) : (
                                <p className="text-xs text-parchment-ghost mt-0.5">
                                    {t('budgetIpfsPending')}
                                </p>
                            )}
                        </div>
                    </div>
                    {data.ipfsCid && (
                        <a
                            href={data.ipfsGatewayUrl || `https://gateway.pinata.cloud/ipfs/${data.ipfsCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm flex items-center gap-2"
                        >
                            {t('budgetVerifyIpfs')}
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
