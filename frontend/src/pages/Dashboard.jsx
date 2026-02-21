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
        const colors = ['#DC143C', '#1B1F3B', '#3498db', '#D4A843', '#2ecc71', '#e74c3c', '#9b59b6'];
        return {
            labels: analytics.provinceStats.map(s => s.province),
            datasets: [
                {
                    label: 'Total Budget',
                    data: analytics.provinceStats.map(s => s.budget),
                    backgroundColor: colors.map(c => c + '40'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                },
                {
                    label: 'Released',
                    data: analytics.provinceStats.map(s => s.released),
                    backgroundColor: colors.map(c => c + '90'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                },
            ],
        };
    }, [analytics]);

    const sectorChartData = useMemo(() => {
        if (!analytics) return null;
        const bgColors = ['#DC143C', '#1B1F3B', '#3498db', '#D4A843', '#2ecc71', '#e67e22'];
        return {
            labels: analytics.sectorStats.map(s => s.sector),
            datasets: [{
                data: analytics.sectorStats.map(s => s.budget),
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 8,
            }],
        };
    }, [analytics]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-nepal-red/30 border-t-nepal-red rounded-full animate-spin"></div>
            </div>
        );
    }

    const { overview } = analytics;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10">
                <h1 className="section-title text-nepal-navy dark:text-white">Public Dashboard</h1>
                <p className="section-subtitle">Real-time government spending transparency</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
                {[
                    { label: 'Total Budget', value: formatNPR(overview.totalBudget), color: 'from-nepal-red to-nepal-red-dark' },
                    { label: 'Allocated', value: formatNPR(overview.totalAllocated), color: 'from-nepal-navy to-nepal-navy-light' },
                    { label: 'Released', value: formatNPR(overview.totalReleased), color: 'from-nepal-blue to-nepal-blue-soft' },
                    { label: 'Projects', value: overview.totalProjects, color: 'from-nepal-gold to-yellow-600' },
                    { label: 'Active', value: overview.activeProjects, color: 'from-green-500 to-emerald-600' },
                    { label: 'Utilization', value: `${overview.utilizationRate}%`, color: 'from-purple-500 to-purple-700' },
                ].map((stat, i) => (
                    <div key={i} className="card p-4 relative overflow-hidden group hover:-translate-y-1 transition-all">
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`}></div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-lg md:text-xl font-heading font-bold text-nepal-navy dark:text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Province Spending */}
                <div className="lg:col-span-2 card p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-nepal-navy dark:text-white">
                        Province-wise Spending
                    </h3>
                    {provinceChartData && (
                        <Bar
                            data={provinceChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'top' },
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => `${ctx.dataset.label}: ${formatNPR(ctx.raw)}`,
                                        },
                                    },
                                },
                                scales: {
                                    y: {
                                        ticks: {
                                            callback: (v) => formatNPR(v),
                                        },
                                        grid: { color: 'rgba(0,0,0,0.05)' },
                                    },
                                    x: { grid: { display: false } },
                                },
                            }}
                        />
                    )}
                </div>

                {/* Sector Distribution */}
                <div className="card p-6">
                    <h3 className="font-heading font-bold text-lg mb-4 text-nepal-navy dark:text-white">
                        Sector Distribution
                    </h3>
                    {sectorChartData && (
                        <Doughnut
                            data={sectorChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } },
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => `${ctx.label}: ${formatNPR(ctx.raw)}`,
                                        },
                                    },
                                },
                                cutout: '60%',
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Budget Utilization Bar */}
            <div className="card p-6 mb-12">
                <h3 className="font-heading font-bold text-lg mb-4 text-nepal-navy dark:text-white">
                    Overall Budget Utilization
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-300">Allocated / Total Budget</span>
                            <span className="font-semibold text-nepal-navy dark:text-white">
                                {((overview.totalAllocated / overview.totalBudget) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill bg-gradient-to-r from-nepal-navy to-nepal-blue"
                                style={{ width: `${(overview.totalAllocated / overview.totalBudget) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-300">Released / Allocated</span>
                            <span className="font-semibold text-nepal-navy dark:text-white">
                                {overview.utilizationRate}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill bg-gradient-to-r from-nepal-red to-nepal-gold"
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
