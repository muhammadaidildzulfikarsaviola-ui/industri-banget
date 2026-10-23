import { useForm } from '@inertiajs/react';
import { ThemeToggle } from '@/components/theme-toggle';

export function WorkspaceActions() {
    const { post, processing } = useForm({});

    return (
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <button
                type="button"
                disabled={processing}
                onClick={() => post('/logout')}
                className="inline-flex min-h-11 items-center justify-center border border-line-strong bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
                {processing ? 'Keluar…' : 'Keluar'}
            </button>
        </div>
    );
}
