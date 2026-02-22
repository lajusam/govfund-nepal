import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import WalletContextProvider from './context/WalletContext';
import LanguageProvider from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Welcome     = lazy(() => import('./pages/Welcome'));
const Landing     = lazy(() => import('./pages/Landing'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Projects    = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Admin       = lazy(() => import('./pages/Admin'));

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
function AppShell() {
    const location = useLocation();
    const isWelcome = location.pathname === '/';
    return (
        <div className="min-h-screen flex flex-col">
            {!isWelcome && <Navbar />}
            <main className="flex-1">
                <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/"           element={<Welcome />} />
                        <Route path="/home"       element={<Landing />} />
                        <Route path="/dashboard"  element={<Dashboard />} />
                        <Route path="/projects"   element={<Projects />} />
                        <Route path="/project/:projectId" element={<ProjectDetail />} />
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
