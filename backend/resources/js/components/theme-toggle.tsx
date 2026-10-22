import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const storageKey = 'industri-banget.theme';

function currentTheme(): Theme {
    if (typeof document !== 'undefined') {
        return document.documentElement.dataset.theme === 'dark'
            ? 'dark'
            : 'light';
    }

    return 'light';
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(currentTheme);

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const followSystemPreference = (event: MediaQueryListEvent) => {
            if (document.documentElement.dataset.themePreference !== 'system')
                return;

            const nextTheme = event.matches ? 'dark' : 'light';
            document.documentElement.dataset.theme = nextTheme;
            setTheme(nextTheme);
        };

        media.addEventListener('change', followSystemPreference);

        return () =>
            media.removeEventListener('change', followSystemPreference);
    }, []);

    function toggleTheme() {
        const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = nextTheme;
        document.documentElement.dataset.themePreference = 'manual';
        setTheme(nextTheme);
        try {
            window.localStorage.setItem(storageKey, nextTheme);
        } catch {
            // Keep the selected theme for this page even when storage is unavailable.
        }
    }

    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Tema ${isDark ? 'gelap' : 'terang'} aktif. Ganti ke tema ${isDark ? 'terang' : 'gelap'}.`}
            aria-pressed={isDark}
            title={`Tema ${isDark ? 'gelap' : 'terang'} aktif · klik untuk mengganti`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-line-strong bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4"
        >
            {isDark ? (
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z"
                    />
                </svg>
            ) : (
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path
                        strokeLinecap="round"
                        d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
                    />
                </svg>
            )}
            <span>{isDark ? 'Dark' : 'Light'}</span>
        </button>
    );
}
