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
        // Earth / Golden palette — harmonized with the cinematic dark theme
        const colors = [
            '#FFB81C', // Golden Sun
            '#8E6F3E', // Bronze
            '#1E7F4E', // Gov Green
            '#C2410C', // Civic Orange
            '#FAD980', // Amber Glow
            '#A8875A', // Bronze Light
            '#6E5428', // Bronze Dark
        ];
        return {
            labels: analytics.provinceStats.map(s => s.province),
            datasets: [
                {
                    label: 'Total Budget',
                    data: analytics.provinceStats.map(s => s.budget),
                    backgroundColor: colors.map(c => c + '30'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: colors.map(c => c + '55'),
                },
                {
                    label: 'Released',
                    data: analytics.provinceStats.map(s => s.released),
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                    hoverBackgroundColor: colors.map(c => c + 'BB'),
                },
            ],
        };
    }, [analytics]);

    const sectorChartData = useMemo(() => {
        if (!analytics) return null;
        // Doughnut palette — distinct, high-contrast on dark backgrounds
        const bgColors = [
            '#FFB81C', // Golden Sun
            '#1E7F4E', // Gov Green
            '#C2410C', // Civic Orange
            '#8E6F3E', // Bronze
            '#FAD980', // Amber Glow
            '#A8875A', // Bronze Light
        ];
        return {
            labels: analytics.sectorStats.map(s => s.sector),
            datasets: [{
                data: analytics.sectorStats.map(s => s.budget),
                backgroundColor: bgColors.map(c => c + 'CC'),
                borderColor: '#1A160F',
                borderWidth: 3,
                hoverOffset: 8,
                hoverBorderColor: '#FAD980',
                hoverBorderWidth: 2,
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

    // Budget semantic colors: allocated vs released vs remaining
    const allocPct = overview.totalBudget > 0
        ? ((overview.totalAllocated / overview.totalBudget) * 100).toFixed(1)
        : '0.0';
    const releasePct = overview.totalAllocated > 0
        ? ((overview.totalReleased / overview.totalAllocated) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header with subtle golden radial backdrop */}
            <div className="mb-10 relative">
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-golden-radial opacity-40 pointer-events-none" />
                <h1 className="section-title text-parchment relative z-10">Public Dashboard</h1>
                <p className="section-subtitle relative z-10">Real-time government spending transparency</p>
            </div>

            {/* Overview Cards — glass-card style with semantic top-border colors */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                {[
                    { label: 'Total Budget', value: formatNPR(overview.totalBudget), borderColor: 'border-t-golden', icon: '💰' },
                    { label: 'Allocated', value: formatNPR(overview.totalAllocated), borderColor: 'border-t-bronze', icon: '📊' },
                    { label: 'Released', value: formatNPR(overview.totalReleased), borderColor: 'border-t-gov-green', icon: '💵' },
                    { label: 'Projects', value: overview.totalProjects, borderColor: 'border-t-amber-glow', icon: '🏗️' },
                    { label: 'Active', value: overview.activeProjects, borderColor: 'border-t-gov-green', icon: '✅' },
                    { label: 'Utilization', value: `${overview.utilizationRate}%`, borderColor: 'border-t-golden', icon: '📈' },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className={`glass-card p-4 relative overflow-hidden group hover:-translate-y-1 transition-all border-t-[3px] ${stat.borderColor}`}
                    >
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-base">{stat.icon}</span>
                            <p className="text-xs text-parchment-ghost font-medium">{stat.label}</p>
                        </div>
                        <p className="text-lg md:text-xl font-heading font-bold text-parchment tabular-nums">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts — deeper card styling */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Province Spending */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                        <span className="w-1 h-5 rounded bg-golden inline-block"></span>
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
                                        labels: { color: '#C4A96E', padding: 14, usePointStyle: true, font: { size: 12 } },
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(45,37,24,0.95)',
                                        borderColor: 'rgba(142,111,62,0.28)',
                                        borderWidth: 1,
                                        titleColor: '#F5F1E6',
                                        bodyColor: '#C4A96E',
                                        padding: 12,
                                        boxShadow: '0 4px 16px rgba(13,11,7,0.25)',
                                        callbacks: {
                                            label: (ctx) => ` ${ctx.dataset.label}: ${formatNPR(ctx.raw)}`,
                                        },
                                    },
                                },
                                scales: {
                                    y: {
                                        ticks: { callback: (v) => formatNPR(v), color: '#C4A96E', font: { size: 11 } },
                                        grid: { color: 'rgba(142,111,62,0.18)' },
                                        border: { color: 'rgba(142,111,62,0.28)' },
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#C4A96E', font: { size: 11 } },
                                        border: { color: 'rgba(142,111,62,0.28)' },
                                    },
                                },
                            }}
                        />
                    )}
                </div>

                {/* Sector Distribution */}
                <div className="glass-card p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-parchment flex items-center gap-2">
                        <span className="w-1 h-5 rounded bg-bronze inline-block"></span>
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

            {/* Budget Utilization Bar — semantic color coding */}
            <div className="glass-card p-6 mb-12">
                <h3 className="font-heading font-bold text-lg mb-6 text-parchment flex items-center gap-2">
                    <span className="w-1 h-5 rounded bg-golden inline-block"></span>
                    Overall Budget Utilization
                </h3>
                <div className="space-y-6">
                    {/* Allocated vs Total — bronze→golden gradient */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-parchment-muted">Allocated / Total Budget</span>
                            <span className="font-bold tabular-nums text-golden">
                                {allocPct}%
                            </span>
                        </div>
                        <div className="progress-bar h-3 rounded-full">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${allocPct}%`,
                                    background: `linear-gradient(90deg, #8E6F3E 0%, #FFB81C ${Math.min(Number(allocPct) * 1.2, 100)}%, #FAD980 100%)`,
                                }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-parchment-ghost mt-1">
                            <span>{formatNPR(overview.totalAllocated)} allocated</span>
                            <span>{formatNPR(overview.totalBudget)} total</span>
                        </div>
                    </div>

                    {/* Released vs Allocated — green gradient for spent funds */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-parchment-muted">Released / Allocated</span>
                            <span className={`font-bold tabular-nums ${
                                Number(releasePct) >= 80 ? 'text-gov-green' :
                                Number(releasePct) >= 50 ? 'text-golden' :
                                'text-gov-orange'
                            }`}>
                                {releasePct}%
                            </span>
                        </div>
                        <div className="progress-bar h-3 rounded-full">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${releasePct}%`,
                                    background: Number(releasePct) >= 80
                                        ? 'linear-gradient(90deg, #1E7F4E 0%, #2DA562 100%)'
                                        : Number(releasePct) >= 50
                                        ? 'linear-gradient(90deg, #FFB81C 0%, #FAD980 100%)'
                                        : 'linear-gradient(90deg, #C2410C 0%, #E8690A 100%)',
                                }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-parchment-ghost mt-1">
                            <span>{formatNPR(overview.totalReleased)} released</span>
                            <span>{formatNPR(overview.totalAllocated)} allocated</span>
                        </div>
                    </div>

                    {/* Remaining unallocated — subtle indicator */}
                    {overview.totalBudget > overview.totalAllocated && (
                        <div className="pt-2 border-t border-earth-border">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-parchment-ghost">Unallocated Funds</span>
                                <span className="font-semibold text-parchment-muted tabular-nums">
                                    {formatNPR(overview.totalBudget - overview.totalAllocated)}
                                </span>
                            </div>
                        </div>
                    )}
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
