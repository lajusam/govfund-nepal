import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import WalletContextProvider from './context/WalletContext';
import LanguageProvider from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Admin = lazy(() => import('./pages/Admin'));

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-nepal-red/30 rounded-full animate-spin border-t-nepal-red"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-nepal-navy/30 rounded-full animate-spin border-b-nepal-navy" style={{ animationDirection: 'reverse' }}></div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <LanguageProvider>
        <ThemeProvider>
            <WalletContextProvider>
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <div className="min-h-screen flex flex-col">
                        <Navbar />
                        <main className="flex-1">
                            <ErrorBoundary>
                            <Suspense fallback={<LoadingSpinner />}>
                                <Routes>
                                    <Route path="/" element={<Landing />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/projects" element={<Projects />} />
                                    <Route path="/project/:projectId" element={<ProjectDetail />} />
                                    <Route path="/admin" element={<Admin />} />
                                </Routes>
                            </Suspense>
                            </ErrorBoundary>
                        </main>
                        <Footer />
                    </div>
                </Router>
            </WalletContextProvider>
        </ThemeProvider>
        </LanguageProvider>
    );
}
