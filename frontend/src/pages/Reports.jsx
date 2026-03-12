import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAnalytics, getProjects, formatNPR } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { PROVINCE_STYLES } from '../data/nepalGeoJSON';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
    Title, Tooltip, Legend, PointElement, LineElement, Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, ArcElement,
    Title, Tooltip, Legend, PointElement, LineElement, Filler,
);

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
    }),
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

export default function Reports() {
    const [analytics, setAnalytics] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        Promise.all([getAnalytics(), getProjects()])
            .then(([a, p]) => {
                setAnalytics(a);
                setProjects(Array.isArray(p) ? p : p?.projects || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const overview = analytics?.overview || {};

    // Province budget chart
    const provinceChart = useMemo(() => {
        if (!analytics?.provinceStats?.length) return null;
        const colors = ['#FFB81C', '#8E6F3E', '#1E7F4E', '#C2410C', '#FAD980', '#A8875A', '#6E5428'];
        return {
            labels: analytics.provinceStats.map(s => s.province),
            datasets: [
                {
                    label: 'Budget (NPR)',
                    data: analytics.provinceStats.map(s => s.budget),
                    backgroundColor: colors.map(c => c + '40'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6,
                },
                {
                    label: 'Released (NPR)',
                    data: analytics.provinceStats.map(s => s.released),
                    backgroundColor: colors.map(c => c + '90'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6,
                },
            ],
        };
    }, [analytics]);

    // Sector breakdown donut
    const sectorChart = useMemo(() => {
        if (!analytics?.sectorStats?.length) return null;
        const colors = ['#FFB81C', '#1E7F4E', '#4B7BB5', '#C2410C', '#8E6F3E', '#FAD980', '#A8875A'];
        return {
            labels: analytics.sectorStats.map(s => s.sector),
            datasets: [{
                data: analytics.sectorStats.map(s => s.count),
                backgroundColor: colors.slice(0, analytics.sectorStats.length),
                borderColor: '#0d1117',
                borderWidth: 3,
            }],
        };
    }, [analytics]);

    // Status breakdown
    const statusBreakdown = useMemo(() => {
        const counts = { active: 0, completed: 0, stalled: 0 };
        projects.forEach(p => {
            if (p.status === 'completed') counts.completed++;
            else if (p.status === 'stalled') counts.stalled++;
            else counts.active++;
        });
        return counts;
    }, [projects]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#c8b89a', font: { size: 12 } } },
            tooltip: {
                backgroundColor: '#1a1f2e',
                titleColor: '#FFB81C',
                bodyColor: '#c8b89a',
                borderColor: '#2a3040',
                borderWidth: 1,
            },
        },
        scales: {
            x: { ticks: { color: '#8a8070' }, grid: { color: '#1a2030' } },
            y: { ticks: { color: '#8a8070' }, grid: { color: '#1a2030' } },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-3 border-golden/30 border-t-golden rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-basalt pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial="hidden" animate="visible" variants={stagger}
                    className="mb-12"
                >
                    <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
                        Transparency Reports
                    </motion.h1>
                    <motion.p variants={fadeUp} custom={1} className="text-parchment-muted text-lg">
                        Real-time analytics and budget utilization data from the blockchain
                    </motion.p>
                </motion.div>

                {/* Overview Cards */}
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={stagger}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                >
                    {[
                        { label: 'Total Budget', value: formatNPR(overview.totalBudget || 0), icon: '💰' },
                        { label: 'Funds Released', value: formatNPR(overview.totalReleased || 0), icon: '📤' },
                        { label: 'Active Projects', value: overview.activeProjects || 0, icon: '🏗️' },
                        { label: 'Utilization', value: `${overview.utilizationRate || 0}%`, icon: '📊' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label} variants={fadeUp} custom={i}
                            className="card p-5 bg-earth/50 border border-earth-border hover:border-golden/20 transition-colors"
                        >
                            <div className="text-2xl mb-2">{stat.icon}</div>
                            <div className="text-xl md:text-2xl font-heading font-bold text-parchment">{stat.value}</div>
                            <div className="text-sm text-parchment-muted mt-1">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Province Budget Chart */}
                    {provinceChart && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.6 }}
                            className="card p-6 bg-earth/30 border border-earth-border"
                        >
                            <h3 className="text-lg font-heading font-semibold text-parchment mb-4">
                                Budget by Province
                            </h3>
                            <div style={{ height: 320 }}>
                                <Bar data={provinceChart} options={chartOptions} />
                            </div>
                        </motion.div>
                    )}

                    {/* Sector Donut */}
                    {sectorChart && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
                            className="card p-6 bg-earth/30 border border-earth-border"
                        >
                            <h3 className="text-lg font-heading font-semibold text-parchment mb-4">
                                Projects by Sector
                            </h3>
                            <div style={{ height: 320 }} className="flex items-center justify-center">
                                <Doughnut data={sectorChart} options={{
                                    ...chartOptions,
                                    scales: undefined,
                                    cutout: '60%',
                                }} />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Status Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.6 }}
                    className="card p-6 bg-earth/30 border border-earth-border mb-12"
                >
                    <h3 className="text-lg font-heading font-semibold text-parchment mb-6">
                        Project Status Overview
                    </h3>
                    <div className="grid grid-cols-3 gap-6">
                        {[
                            { label: 'Active', count: statusBreakdown.active, color: '#FFB81C' },
                            { label: 'Completed', count: statusBreakdown.completed, color: '#1E7F4E' },
                            { label: 'Stalled', count: statusBreakdown.stalled, color: '#C2410C' },
                        ].map(s => (
                            <div key={s.label} className="text-center">
                                <div
                                    className="text-4xl font-heading font-bold mb-1"
                                    style={{ color: s.color }}
                                >
                                    {s.count}
                                </div>
                                <div className="text-sm text-parchment-muted">{s.label}</div>
                                {/* Bar indicator */}
                                <div className="mt-3 h-1.5 rounded-full bg-earth-border overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: s.color }}
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${projects.length ? (s.count / projects.length) * 100 : 0}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Province Table */}
                {analytics?.provinceStats?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.6 }}
                        className="card bg-earth/30 border border-earth-border overflow-hidden"
                    >
                        <div className="p-6 border-b border-earth-border">
                            <h3 className="text-lg font-heading font-semibold text-parchment">
                                Province-wise Breakdown
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-earth/50">
                                        <th className="text-left p-4 text-parchment-muted font-medium">Province</th>
                                        <th className="text-right p-4 text-parchment-muted font-medium">Projects</th>
                                        <th className="text-right p-4 text-parchment-muted font-medium">Budget</th>
                                        <th className="text-right p-4 text-parchment-muted font-medium">Released</th>
                                        <th className="text-right p-4 text-parchment-muted font-medium">Utilization</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.provinceStats.map((prov, i) => {
                                        const util = prov.budget > 0 ? ((prov.released / prov.budget) * 100).toFixed(1) : '0.0';
                                        return (
                                            <tr key={i} className="border-t border-earth-border/50 hover:bg-earth/30 transition-colors">
                                                <td className="p-4 text-parchment font-medium">{prov.province}</td>
                                                <td className="p-4 text-right text-parchment-muted">{prov.count || 0}</td>
                                                <td className="p-4 text-right text-parchment">{formatNPR(prov.budget)}</td>
                                                <td className="p-4 text-right text-golden">{formatNPR(prov.released)}</td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                        parseFloat(util) > 70 ? 'bg-green-500/20 text-green-400' :
                                                        parseFloat(util) > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                        {util}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
