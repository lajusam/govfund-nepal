import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * GovFund Nepal uses a single, fixed dark theme.
 * The ThemeProvider is kept for API compatibility but dark mode is always active.
 */
export function ThemeProvider({ children }) {
    useEffect(() => {
        // Always enforce dark class — single locked theme
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
    }, []);

    return (
        // dark is always true; toggle is a no-op — theme is fixed
        <ThemeContext.Provider value={{ dark: true, toggle: () => {} }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
