import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics, formatNPR } from '../services/api';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
    Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Dashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnalytics().then(data => { setAnalytics(data); setLoading(false); });
    }, []);

    const provinceChartData = useMemo(() => {
        if (!analytics) return null;
        // Government palette — Slate Blue primary, grayscale-safe
        const colors = ['#2F5D8A', '#0B2A4A', '#4A78A8', '#1E7F4E', '#C2410C', '#E6A400', '#6B7280'];
        return {
            labels: analytics.provinceStats.map(s => s.province),
            datasets: [
                {
                    label: 'Total Budget',
                    data: analytics.provinceStats.map(s => s.budget),
                    backgroundColor: colors.map(c => c + '26'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6,
                },
                {
                    label: 'Released',
                    data: analytics.provinceStats.map(s => s.released),
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6,
                },
            ],
        };
    }, [analytics]);

    const sectorChartData = useMemo(() => {
        if (!analytics) return null;
        // Government palette — readable in grayscale, WCAG-safe
        const bgColors = ['#2F5D8A', '#0B2A4A', '#4A78A8', '#1E7F4E', '#C2410C', '#E6A400'];
        return {
            labels: analytics.sectorStats.map(s => s.sector),
            datasets: [{
                data: analytics.sectorStats.map(s => s.budget),
                backgroundColor: bgColors,
                borderColor: '#FFFFFF',
                borderWidth: 2,
                hoverOffset: 6,
            }],
        };
    }, [analytics]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin"></div>
            </div>
        );
    }

    const { overview } = analytics;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10">
                <h1 className="section-title">Public Dashboard</h1>
                <p className="section-subtitle">Real-time government spending transparency</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                {[
                    { label: 'Total Budget', value: formatNPR(overview.totalBudget), color: 'from-gov-slate to-gov-navy' },
                    { label: 'Allocated', value: formatNPR(overview.totalAllocated), color: 'from-gov-navy to-gov-slate' },
                    { label: 'Released', value: formatNPR(overview.totalReleased), color: 'from-gov-green to-gov-slate' },
                    { label: 'Projects', value: overview.totalProjects, color: 'from-gov-info to-gov-slate' },
                    { label: 'Active', value: overview.activeProjects, color: 'from-gov-slate/80 to-gov-navy/80' },
                    { label: 'Utilization', value: `${overview.utilizationRate}%`, color: 'from-gov-amber to-gov-amber-hover' },
                ].map((stat, i) => (
                    <div key={i} className="card p-4 relative overflow-hidden group hover:-translate-y-1 transition-all">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}></div>
                        <p className="text-xs text-parchment-ghost mb-1">{stat.label}</p>
                        <p className="text-lg md:text-xl font-heading font-bold text-gov-navy">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Province Spending */}
                <div className="lg:col-span-2 card p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment">
                        Province-wise Spending
                    </h3>
                    {provinceChartData && (
                        <Bar
                            data={provinceChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: { color: '#4B5563', padding: 14, usePointStyle: true, font: { size: 12 } },
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(255,255,255,0.98)',
                                        borderColor: '#D1D5DB',
                                        borderWidth: 1,
                                        titleColor: '#0B2A4A',
                                        bodyColor: '#4B5563',
                                        padding: 12,
                                        boxShadow: '0 4px 16px rgba(11,42,74,0.12)',
                                        callbacks: {
                                            label: (ctx) => ` ${ctx.dataset.label}: ${formatNPR(ctx.raw)}`,
                                        },
                                    },
                                },
                                scales: {
                                    y: {
                                        ticks: { callback: (v) => formatNPR(v), color: '#6B7280', font: { size: 11 } },
                                        grid: { color: 'rgba(209,213,219,0.60)' },
                                        border: { color: '#D1D5DB' },
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#6B7280', font: { size: 11 } },
                                        border: { color: '#D1D5DB' },
                                    },
                                },
                            }}
                        />
                    )}
                </div>

                {/* Sector Distribution */}
                <div className="card p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment">
                        Sector Distribution
                    </h3>
                    {sectorChartData && (
                        <Doughnut
                            data={sectorChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            padding: 14, usePointStyle: true,
                                            color: '#4B5563', font: { size: 11 },
                                        },
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(255,255,255,0.98)',
                                        borderColor: '#D1D5DB',
                                        borderWidth: 1,
                                        titleColor: '#0B2A4A',
                                        bodyColor: '#4B5563',
                                        padding: 12,
                                        callbacks: {
                                            label: (ctx) => ` ${ctx.label}: ${formatNPR(ctx.raw)}`,
                                        },
                                    },
                                },
                                cutout: '62%',
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Budget Utilization Bar */}
            <div className="card p-6 mb-12">
                <h3 className="font-heading font-bold text-lg mb-4 text-parchment">
                    Overall Budget Utilization
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-parchment-muted">Allocated / Total Budget</span>
                            <span className="font-semibold text-parchment">
                                {((overview.totalAllocated / overview.totalBudget) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill bg-gradient-to-r from-bronze to-golden"
                                style={{ width: `${(overview.totalAllocated / overview.totalBudget) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-parchment-muted">Released / Allocated</span>
                            <span className="font-semibold text-parchment">
                                {overview.utilizationRate}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill bg-gradient-to-r from-golden to-amber-glow"
                                style={{ width: `${overview.utilizationRate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Explore link */}
            <div className="text-center">
                <Link to="/projects" className="btn-primary">
                    Explore All Projects →
                </Link>
            </div>
        </div>
    );
}
