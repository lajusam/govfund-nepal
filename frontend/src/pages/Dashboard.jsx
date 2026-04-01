import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    getProjectStats,
    getProjectsByProvince,
    getProjectsBySector,
    getMilestonesSummary,
    getRecentReleases,
    getRecentlyUpdatedProjects,
    formatNPR,
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
    Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    FolderKanban, Activity, AlertTriangle, CheckCircle2,
    ArrowUpRight, Clock,
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// ── Framer Motion variants ────────────────────────────────────────────────
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [byProvince, setByProvince] = useState([]);
    const [bySector, setBySector] = useState([]);
    const [milestones, setMilestones] = useState([]);
    const [releases, setReleases] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        Promise.all([
            getProjectStats(),
            getProjectsByProvince(),
            getProjectsBySector(),
            getMilestonesSummary(),
            getRecentReleases(),
            getRecentlyUpdatedProjects(),
        ]).then(([s, bp, bs, ms, rl, rp]) => {
            setStats(s);
            setByProvince(bp);
            setBySector(bs);
            setMilestones(ms);
            setReleases(rl);
            setRecentProjects(rp);
            setLoading(false);
        });
    }, []);

    // ── Province horizontal bar chart data ────────────────────────────────
    const provinceChartData = useMemo(() => {
        if (!byProvince.length) return null;
        return {
            labels: byProvince.map(p => p.province),
            datasets: [{
                label: t('projectsLabel'),
                data: byProvince.map(p => p.count),
                backgroundColor: 'rgba(255,184,28,0.7)',
                borderColor: '#FFB81C',
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(255,184,28,0.9)',
            }],
        };
    }, [byProvince, t]);

    // ── Status doughnut chart data ────────────────────────────────────────
    const statusChartData = useMemo(() => {
        if (!stats) return null;
        return {
            labels: [t('active'), t('delayed'), t('completed')],
            datasets: [{
                data: [stats.active, stats.delayed, stats.completed],
                backgroundColor: ['#1E7F4E', '#C2410C', '#2563EB'],
                borderColor: '#1A160F',
                borderWidth: 3,
                hoverOffset: 8,
                hoverBorderColor: '#FAD980',
                hoverBorderWidth: 2,
            }],
        };
    }, [stats, t]);

    // ── Sector horizontal bar chart data ──────────────────────────────────
    const sectorChartData = useMemo(() => {
        if (!bySector.length) return null;
        return {
            labels: bySector.map(s => s.sector),
            datasets: [{
                label: t('projectsLabel'),
                data: bySector.map(s => s.count),
                backgroundColor: 'rgba(255,184,28,0.7)',
                borderColor: '#FFB81C',
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(255,184,28,0.9)',
            }],
        };
    }, [bySector, t]);

    // ── Shared chart options ──────────────────────────────────────────────
    const horizontalBarOptions = useMemo(() => ({
        indexAxis: 'y',
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(45,37,24,0.95)',
                borderColor: 'rgba(142,111,62,0.28)',
                borderWidth: 1,
                titleColor: '#F5F1E6',
                bodyColor: '#C4A96E',
                padding: 12,
            },
        },
        scales: {
            x: {
                ticks: { color: '#C4A96E', font: { size: 11 }, stepSize: 1 },
                grid: { color: 'rgba(142,111,62,0.18)' },
                border: { color: 'rgba(142,111,62,0.28)' },
            },
            y: {
                ticks: { color: '#C4A96E', font: { size: 11 } },
                grid: { display: false },
                border: { color: 'rgba(142,111,62,0.28)' },
            },
        },
    }), []);

    const doughnutOptions = useMemo(() => ({
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 14, usePointStyle: true,
                    color: '#C4A96E', font: { size: 11 },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(45,37,24,0.95)',
                borderColor: 'rgba(142,111,62,0.28)',
                borderWidth: 1,
                titleColor: '#F5F1E6',
                bodyColor: '#C4A96E',
                padding: 12,
            },
        },
        cutout: '62%',
    }), []);

    // ── Helpers ───────────────────────────────────────────────────────────
    const progressColor = (pct) => {
        if (pct >= 75) return '#1E7F4E';
        if (pct >= 40) return '#FFB81C';
        return '#C2410C';
    };

    const statusBadge = (status) => {
        switch (status) {
            case 'Active':    return 'bg-[#1E7F4E]/20 text-[#1E7F4E]';
            case 'Completed': return 'bg-[#2563EB]/20 text-[#2563EB]';
            case 'Delayed':   return 'bg-[#C2410C]/20 text-[#C2410C]';
            default:          return 'bg-[#8E6F3E]/20 text-[#8E6F3E]';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin"></div>
            </div>
        );
    }

    const statCards = [
        { label: t('totalProjectsLabel'),      value: stats?.total ?? 0,     icon: FolderKanban,  accent: '#FFB81C' },
        { label: t('activeProjectsOverview'),   value: stats?.active ?? 0,    icon: Activity,      accent: '#1E7F4E' },
        { label: t('delayedProjectsLabel'),     value: stats?.delayed ?? 0,   icon: AlertTriangle, accent: '#C2410C' },
        { label: t('completedProjectsLabel'),   value: stats?.completed ?? 0, icon: CheckCircle2,  accent: '#1E7F4E' },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
            {/* Header with subtle golden radial backdrop */}
            <div className="mb-6 md:mb-10 relative">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-golden-radial opacity-40 pointer-events-none" />
                <h1 className="section-title text-parchment relative z-10">{t('dashboardTitle')}</h1>
                <p className="section-subtitle relative z-10">{t('dashboardSubtitle')}</p>
            </div>

            {/* ─── A) Top Stat Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
                {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.label}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            animate="visible"
                            className="glass-card p-3 md:p-4 relative overflow-hidden group hover:-translate-y-1 transition-all border-t-[3px]"
                            style={{ borderTopColor: card.accent }}
                        >
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Icon size={16} style={{ color: card.accent }} />
                                <p className="text-xs text-parchment-ghost font-medium">{card.label}</p>
                            </div>
                            <p className="text-base md:text-lg lg:text-xl font-heading font-bold text-parchment tabular-nums">
                                {card.value}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* ─── B & C) Province Bar + Status Doughnut ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12">
                {/* B) Province-wise Project Distribution */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible" className="lg:col-span-2 glass-card p-4 md:p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                        <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                        {t('projectsByProvince')}
                    </h3>
                    {provinceChartData && <Bar data={provinceChartData} options={horizontalBarOptions} />}
                </motion.div>

                {/* C) Project Status Breakdown */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible" className="glass-card p-4 md:p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                        <span className="w-1 h-5 rounded bg-bronze inline-block"></span>
                        {t('projectStatusBreakdown')}
                    </h3>
                    {statusChartData && <Doughnut data={statusChartData} options={doughnutOptions} />}
                </motion.div>
            </div>

            {/* ─── D) Sector Distribution ────────────────────────────────────── */}
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="glass-card p-4 md:p-6 mb-8 md:mb-12">
                <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                    <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                    {t('projectsBySector')}
                </h3>
                {sectorChartData && <Bar data={sectorChartData} options={horizontalBarOptions} />}
            </motion.div>

            {/* ─── E & F) Milestone Table + Recent Fund Releases ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12">
                {/* E) Milestone Progress Table */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible" className="lg:col-span-2 glass-card p-4 md:p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                        <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                        {t('milestoneProgressByProject')}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] text-sm">
                            <thead>
                                <tr className="border-b border-[rgba(142,111,62,0.28)]">
                                    <th className="text-left py-2 text-parchment-ghost font-medium">{t('projectName')}</th>
                                    <th className="text-left py-2 text-parchment-ghost font-medium">{t('province')}</th>
                                    <th className="text-center py-2 text-parchment-ghost font-medium">{t('totalLabel')}</th>
                                    <th className="text-center py-2 text-parchment-ghost font-medium">{t('completedLabel')}</th>
                                    <th className="text-left py-2 text-parchment-ghost font-medium pl-4">{t('progressLabel')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {milestones.map((m, i) => (
                                    <tr key={m.projectId} className={i < milestones.length - 1 ? 'border-b border-[rgba(142,111,62,0.15)]' : ''}>
                                        <td className="py-2.5 text-parchment font-medium">{m.name}</td>
                                        <td className="py-2.5 text-parchment-muted">{m.province}</td>
                                        <td className="py-2.5 text-center text-parchment-ghost tabular-nums">{m.totalMilestones}</td>
                                        <td className="py-2.5 text-center text-parchment-ghost tabular-nums">{m.completedMilestones}</td>
                                        <td className="py-2.5 pl-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1 rounded-full bg-[rgba(142,111,62,0.18)]">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${m.progress}%`, backgroundColor: progressColor(m.progress) }}
                                                    />
                                                </div>
                                                <span className="text-xs text-parchment-ghost tabular-nums w-8 text-right">{m.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {milestones.length === 0 && (
                                    <tr><td colSpan={5} className="py-6 text-center text-parchment-ghost">{t('noMilestones')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* F) Recent Fund Releases Feed */}
                <motion.div variants={scaleIn} initial="hidden" animate="visible" className="glass-card p-4 md:p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                        <span className="w-1 h-5 rounded bg-bronze inline-block"></span>
                        {t('recentFundReleases')}
                    </h3>
                    <div className="space-y-0">
                        {releases.map((r, i) => (
                            <div key={i} className={`py-3 ${i < releases.length - 1 ? 'border-b border-[rgba(142,111,62,0.18)]' : ''}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-parchment font-semibold text-sm truncate">{r.projectName}</p>
                                        <p className="text-golden font-mono text-sm mt-0.5">{formatNPR(r.amount)}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-parchment-ghost">
                                                {r.date ? new Date(r.date).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(142,111,62,0.18)] text-parchment-ghost">
                                                {r.province}
                                            </span>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={14} className="text-parchment-ghost mt-1 shrink-0" />
                                </div>
                            </div>
                        ))}
                        {releases.length === 0 && (
                            <p className="text-center text-parchment-ghost py-6 text-sm">{t('noRecentReleases')}</p>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ─── G) Recently Updated Projects ──────────────────────────────── */}
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="mb-8 md:mb-12">
                <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                    <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                    {t('recentlyUpdated')}
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                    {recentProjects.map((p) => (
                        <Link
                            key={p.projectId}
                            to={`/project/${p.projectId}`}
                            className="glass-card p-4 min-w-[260px] max-w-[300px] shrink-0 hover:-translate-y-1 transition-all border border-[rgba(142,111,62,0.28)] group"
                        >
                            <p className="text-parchment font-heading font-semibold text-sm truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-parchment-ghost">
                                <span>{p.province}</span>
                                <span className="text-[rgba(142,111,62,0.4)]">·</span>
                                <span>{p.sector}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge(p.status)}`}>
                                    {p.status}
                                </span>
                                <span className="text-xs text-golden font-mono">{formatNPR(p.totalBudget)}</span>
                            </div>
                            <p className="text-xs text-golden mt-3 group-hover:underline">{t('viewProjectLink')}</p>
                        </Link>
                    ))}
                    {recentProjects.length === 0 && (
                        <p className="text-parchment-ghost text-sm py-6">{t('noProjectsMatch')}</p>
                    )}
                </div>
            </motion.div>

            {/* Explore link */}
            <div className="text-center">
                <Link to="/projects" className="btn-primary">
                    {t('exploreAllProjects')}
                </Link>
            </div>
        </div>
    );
}
