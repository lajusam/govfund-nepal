import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import WalletContextProvider from './context/WalletContext';
import LanguageProvider from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import Footer from './components/Footer';
import { NavBar as TubelightNavbar } from './components/ui/tubelight-navbar';
import { Home, LayoutDashboard, FolderKanban, ShieldCheck, Megaphone, PieChart } from 'lucide-react';

const Welcome     = lazy(() => import('./pages/Welcome'));
const Landing     = lazy(() => import('./pages/Landing'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Projects    = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const ComplaintPage = lazy(() => import('./pages/ComplaintPage'));
const Complaints  = lazy(() => import('./pages/Complaints'));
const Admin       = lazy(() => import('./pages/Admin'));
const Budget      = lazy(() => import('./pages/Budget'));

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-golden/25 rounded-full animate-spin border-t-golden"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-bronze/25 rounded-full animate-spin border-b-bronze" style={{ animationDirection: 'reverse' }}></div>
                </div>
            </div>
        </div>
    );
}

// Hides chrome (Navbar + Footer) on the welcome splash screen
const tubelightItems = [
    { name: 'Home',      url: '/home',       icon: Home },
    { name: 'Dashboard', url: '/dashboard',  icon: LayoutDashboard },
    { name: 'Projects',  url: '/projects',   icon: FolderKanban },
    { name: 'Budget',     url: '/budget',     icon: PieChart },
    { name: 'Complaints', url: '/complaints', icon: Megaphone },
    { name: 'Admin',     url: '/admin',      icon: ShieldCheck },
];

function AppShell() {
    const location = useLocation();
    const isWelcome = location.pathname === '/';
    return (
        <div className="min-h-screen flex flex-col overflow-x-hidden">
            {!isWelcome && <TubelightNavbar items={tubelightItems} />}
            <main className="flex-1">
                <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/"           element={<Welcome />} />
                        <Route path="/home"       element={<Landing />} />
                        <Route path="/dashboard"  element={<Dashboard />} />
                        <Route path="/projects"   element={<Projects />} />
                        <Route path="/project/:projectId" element={<ProjectDetail />} />
                        <Route path="/project/:projectId/complaints" element={<ComplaintPage />} />
                        <Route path="/budget"     element={<Budget />} />
                        <Route path="/complaints" element={<Complaints />} />
                        <Route path="/admin"      element={<Admin />} />
                    </Routes>
                </Suspense>
                </ErrorBoundary>
            </main>
            {!isWelcome && <Footer />}
        </div>
    );
}

export default function App() {
    return (
        <LanguageProvider>
        <ThemeProvider>
            <WalletContextProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell />
                </Router>
            </WalletContextProvider>
        </ThemeProvider>
        </LanguageProvider>
    );
}
