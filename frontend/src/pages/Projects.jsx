import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, formatNPR, getStatusBg } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

function ProjectCard({ project }) {
    const { t } = useLanguage();
    const p = project;
    const budgetPct = p.allocatedBudget > 0
        ? ((p.releasedAmount / p.allocatedBudget) * 100).toFixed(1)
        : 0;
    const milestonePct = p.milestoneCount > 0
        ? ((p.milestonesCompleted / p.milestoneCount) * 100).toFixed(0)
        : 0;

    return (
        <Link to={`/project/${p.projectId}`} className={`card p-4 md:p-6 group hover:-translate-y-1 transition-all duration-300 block ${p.status === 'Completed' ? 'opacity-75 border-parchment-ghost/20' : ''}`}>
            {/* Status badge */}
            <div className="flex items-start justify-between mb-4">
                <span className={`badge ${
                    p.status === 'Active' ? 'badge-active' :
                    p.status === 'Completed' ? 'bg-earth text-parchment-ghost border border-parchment-ghost/30' :
                    p.status === 'Suspended' ? 'bg-red-900/20 text-red-400 border border-red-500/30' :
                    'badge-completed'
                }`}>
                    {p.status === 'Completed' ? `🔒 ${t('closed')}` : p.status}
                </span>
                <span className="text-xs text-parchment-ghost">{p.province}</span>
            </div>

            {/* Title */}
            <h3 className="font-heading font-bold text-lg text-parchment mb-2 group-hover:text-golden transition-colors">
                {p.name}
            </h3>

            {/* Meta */}
            <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-earth-light text-parchment-muted px-2 py-1 rounded-md">
                        📍 {p.district}
                    </span>
                <span className="text-xs bg-earth-light text-parchment-muted px-2 py-1 rounded-md">
                        🏗 {p.sector}
                    </span>
            </div>

            {/* Contractor */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-earth-light flex items-center justify-center">
                    <svg className="w-5 h-5 text-parchment-ghost" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
                <div>
                    <p className="text-xs text-parchment-ghost">{t('contractorLabel')}</p>
                    <p className="text-sm font-medium text-parchment-dim">{p.contractor}</p>
                </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p className="text-xs text-parchment-ghost">{t('totalBudgetLabel')}</p>
                    <p className="text-sm font-bold text-parchment">{formatNPR(p.totalBudget)}</p>
                </div>
                <div>
                    <p className="text-xs text-parchment-ghost">{t('released')}</p>
                    <p className="text-sm font-bold text-golden">{formatNPR(p.releasedAmount)}</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-parchment-ghost">{t('fundUtilization')}</span>
                    <span className="font-semibold text-parchment">{budgetPct}%</span>
                </div>
                <div className="progress-bar h-2">
                    <div
                        className="progress-fill bg-gradient-to-r from-golden to-amber-glow"
                        style={{ width: `${Math.min(budgetPct, 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* Milestones */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-parchment-ghost">
                    {t('milestonesLabel')}: {p.milestonesCompleted}/{p.milestoneCount}
                </span>
                <div className="flex flex-wrap gap-1">
                    {Array.from({ length: Math.min(p.milestoneCount, 8) }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2.5 h-2.5 rounded-full ${i < p.milestonesCompleted ? 'bg-golden' : 'bg-earth-light'}`}
                        ></div>
                    ))}
                    {p.milestoneCount > 8 && (
                        <span className="text-[10px] text-parchment-ghost leading-tight">+{p.milestoneCount - 8}</span>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="mt-3 pt-3 border-t border-earth-border text-xs text-parchment-ghost">
                {t('estCompletion')}: {new Date(p.estimatedCompletion).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            </div>
        </Link>
    );
}

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ province: '', sector: '', status: '' });
    const { t } = useLanguage();

    useEffect(() => {
        getProjects().then(data => { setProjects(data); setLoading(false); });
    }, []);

    const filtered = useMemo(() => {
        return projects.filter(p => {
            if (filters.province && p.province !== filters.province) return false;
            if (filters.sector && p.sector !== filters.sector) return false;
            if (filters.status && p.status !== filters.status) return false;
            return true;
        });
    }, [projects, filters]);

    const uniqueProvinces = [...new Set(projects.map(p => p.province))].sort();
    const uniqueSectors = [...new Set(projects.map(p => p.sector))].sort();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
            <div className="mb-6 md:mb-10">
                <h1 className="section-title">{t('govProjects')}</h1>
                <p className="section-subtitle">{t('browseProjects')}</p>
            </div>

            {/* Filters */}
            <div className="card p-3 md:p-4 mb-6 md:mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select
                        className="input-field"
                        value={filters.province}
                        onChange={e => setFilters(f => ({ ...f, province: e.target.value }))}
                    >
                        <option value="">{t('allProvinces')}</option>
                        {uniqueProvinces.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <select
                        className="input-field"
                        value={filters.sector}
                        onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
                    >
                        <option value="">{t('allSectors')}</option>
                        {uniqueSectors.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <select
                        className="input-field"
                        value={filters.status}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                    >
                        <option value="">{t('allStatus')}</option>
                        <option value="Active">{t('activeStatus')}</option>
                        <option value="Completed">{t('completedStatus')}</option>
                        <option value="Suspended">{t('suspendedStatus')}</option>
                    </select>
                </div>
                <div className="mt-3 text-sm text-parchment-ghost">
                    {t('showing')} {filtered.length} {t('of')} {projects.length} {t('projectsLabel')}
                </div>
            </div>

            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filtered.map(p => (
                    <ProjectCard key={p.projectId} project={p} />
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-20 text-parchment-muted">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-lg">{t('noProjectsMatch')}</p>
                </div>
            )}
        </div>
    );
}
