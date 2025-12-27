/**
 * Theme Context for MindFlow
 *
 * Provides theme switching functionality with localStorage persistence.
 * Supports light and dark themes with manual toggle control.
 */

"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

// ============================================================================
// Type Definitions
// ============================================================================

export type Theme = "light" | "dark";

export interface ThemeContextValue {
	/**
	 * Current active theme
	 */
	theme: Theme;
	/**
	 * Set a specific theme
	 */
	setTheme: (theme: Theme) => void;
	/**
	 * Toggle between light and dark themes
	 */
	toggleTheme: () => void;
}

// ============================================================================
// Context Creation
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface ThemeProviderProps {
	children: ReactNode;
	/**
	 * Default theme to use when no preference is stored
	 * @default "light"
	 */
	defaultTheme?: Theme;
	/**
	 * localStorage key for persisting theme preference
	 * @default "mindflow-theme"
	 */
	storageKey?: string;
}

/**
 * Provider component for theme switching functionality.
 *
 * Wrap the application with this provider to enable theme switching
 * throughout all components.
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="light">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({
	children,
	defaultTheme = "light",
	storageKey = "mindflow-theme",
}: ThemeProviderProps) {
	// Track if we're on client (mounted) to avoid hydration mismatch
	const [isMounted, setIsMounted] = useState(false);

	// Initialize theme from localStorage or use default
	const [theme, setThemeState] = useState<Theme>(defaultTheme);

	// After mount, read from localStorage and apply theme
	useEffect(() => {
		setIsMounted(true);
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored === "dark" || stored === "light") {
				setThemeState(stored as Theme);
			}
		} catch {
			// localStorage might be disabled
		}
	}, [storageKey]);

	// Apply theme to document and persist to localStorage
	useEffect(() => {
		if (!isMounted) return;

		const root = document.documentElement;

		// Remove old theme attribute
		root.removeAttribute("data-theme");

		// Apply new theme
		if (theme === "dark") {
			root.setAttribute("data-theme", "dark");
		}

		// Persist to localStorage
		try {
			localStorage.setItem(storageKey, theme);
		} catch {
			// localStorage might be disabled
		}
	}, [theme, storageKey, isMounted]);

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	const toggleTheme = () => {
		setThemeState((prev) => (prev === "light" ? "dark" : "light"));
	};

	const value: ThemeContextValue = {
		theme,
		setTheme,
		toggleTheme,
	};

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

// ============================================================================
// Hook for Consuming Context
// ============================================================================

/**
 * Hook to access theme switching functionality.
 *
 * @returns The theme context value
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, toggleTheme } = useTheme();
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Switch to {theme === 'light' ? 'dark' : 'light'} mode
 *     </button>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}

	return context;
}
