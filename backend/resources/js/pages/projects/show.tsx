import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { AnalysisRun, FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    analysisRuns: AnalysisRun[];
    hasMrpMasterData: boolean;
    flash?: FlashMessages;
};

const statusLabels = {
    active: 'Aktif',
    completed: 'Selesai',
    on_hold: 'Ditunda',
} as const;

const statusStyles = {
    active: 'border-success-line bg-success-soft text-success',
    completed: 'border-info-line bg-info-soft text-info',
    on_hold: 'border-warning-line bg-warning-soft text-warning',
} as const;

export default function ProjectShow({
    project,
    analysisRuns,
    hasMrpMasterData,
    flash,
}: Props) {
    const { delete: destroy, processing } = useForm({});
    const hasAnalysisHistory = analysisRuns.length > 0;
    const deletionBlocked = hasAnalysisHistory || hasMrpMasterData;
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const cancelDeleteRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!deleteDialogOpen) return;

        cancelDeleteRef.current?.focus();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setDeleteDialogOpen(false);
            }

            if (event.key === 'Tab') {
                event.preventDefault();
                document
                    .querySelector<HTMLButtonElement>(
                        event.shiftKey
                            ? '[data-delete-confirm]'
                            : '[data-delete-cancel]',
                    )
                    ?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteDialogOpen]);

    return (
        <>
            <Head title={project.name} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-7 border-b border-line pb-6">
                        <div className="flex items-start justify-between gap-3">
                            <Link
                                href="/projects"
                                className="pt-2 text-base font-semibold tracking-[0.16em] text-muted hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
                            >
                                ← PROJECT REGISTER
                            </Link>
                            <WorkspaceActions />
                        </div>
                        <p className="mt-6 font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                            PROJECT / PRJ-
                            {project.id.toString().padStart(4, '0')}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <h1 className="text-4xl font-semibold tracking-tight break-words sm:text-5xl">
                                {project.name}
                            </h1>
                            <span
                                className={`border px-3 py-1 text-sm font-semibold ${statusStyles[project.status]}`}
                            >
                                {statusLabels[project.status]}
                            </span>
                        </div>
                    </header>

                    <div className="mb-6">
                        <FlashMessage flash={flash} />
                    </div>

                    <section
                        className="grid grid-cols-1 gap-x-8 gap-y-7 border-y border-line bg-surface py-7 sm:grid-cols-2 lg:grid-cols-4 lg:px-6"
                        aria-label="Informasi proyek"
                    >
                        <div>
                            <p className="font-mono text-xs font-semibold tracking-[0.12em] text-muted">
                                INDUSTRI
                            </p>
                            <p className="mt-2 text-base">
                                {project.industry || 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="font-mono text-xs font-semibold tracking-[0.12em] text-muted">
                                DIBUAT
                            </p>
                            <p className="mt-2 text-base">
                                {new Intl.DateTimeFormat('id-ID', {
                                    dateStyle: 'long',
                                }).format(new Date(project.created_at))}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="font-mono text-xs font-semibold tracking-[0.12em] text-muted">
                                DESKRIPSI
                            </p>
                            <p className="mt-2 text-base leading-6 whitespace-pre-wrap text-muted">
                                {project.description || 'Belum ada deskripsi.'}
                            </p>
                        </div>
                    </section>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/projects/${project.id}/eoq`}
                            className="inline-flex min-h-12 items-center bg-accent px-4 text-base font-semibold text-ink hover:bg-accent-strong hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            Jalankan analisis EOQ →
                        </Link>
                        <Link
                            href={`/projects/${project.id}/forecasting`}
                            className="inline-flex min-h-12 items-center border border-line-strong px-4 text-base font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            Jalankan Forecasting →
                        </Link>
                        <Link
                            href={`/projects/${project.id}/mrp`}
                            className="inline-flex min-h-12 items-center border border-line-strong px-4 text-base font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            Jalankan MRP →
                        </Link>
                        <Link
                            href={`/projects/${project.id}/spc`}
                            className="inline-flex min-h-12 items-center border border-line-strong px-4 text-base font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            Jalankan SPC →
                        </Link>
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className="inline-flex min-h-12 items-center border border-line-strong px-4 text-base font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                        >
                            Edit proyek
                        </Link>
                        <button
                            type="button"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={deletionBlocked || processing}
                            title={
                                hasAnalysisHistory
                                    ? 'Proyek yang memiliki riwayat analisis tidak dapat dihapus.'
                                    : hasMrpMasterData
                                      ? 'Hapus master item MRP di proyek terlebih dahulu.'
                                      : undefined
                            }
                            className="min-h-12 border border-danger-line px-4 text-base font-medium text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Menghapus…' : 'Hapus proyek'}
                        </button>
                    </div>
                    {deletionBlocked && (
                        <p className="mt-2 text-base text-muted">
                            {hasAnalysisHistory
                                ? 'Penghapusan dikunci karena proyek memiliki riwayat analisis yang harus dipertahankan.'
                                : 'Penghapusan dikunci karena proyek memiliki master item MRP yang harus dihapus terlebih dahulu.'}
                        </p>
                    )}

                    <section
                        className="mt-12"
                        aria-labelledby="analysis-history-title"
                    >
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                            <div>
                                <p className="font-mono text-base tracking-[0.16em] text-accent-strong">
                                    AUDIT TRAIL
                                </p>
                                <h2
                                    id="analysis-history-title"
                                    className="mt-2 text-xl font-semibold"
                                >
                                    Riwayat analisis
                                </h2>
                            </div>
                            <span className="text-base text-muted">
                                {analysisRuns.length} hasil tersimpan
                            </span>
                        </div>
                        {analysisRuns.length === 0 ? (
                            <p className="border border-dashed border-line-strong px-5 py-10 text-base text-muted">
                                Belum ada analisis. Jalankan EOQ atau
                                Forecasting untuk menyimpan input dan hasil
                                perhitungan di proyek ini.
                            </p>
                        ) : (
                            <ul className="divide-y divide-line border-y border-line">
                                {analysisRuns.map((run) => (
                                    <li
                                        key={run.id}
                                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                                    >
                                        <div>
                                            <p className="text-base font-semibold">
                                                {run.type === 'eoq' ? (
                                                    <>
                                                        EOQ ·{' '}
                                                        {new Intl.NumberFormat(
                                                            'id-ID',
                                                            {
                                                                maximumFractionDigits: 2,
                                                            },
                                                        ).format(
                                                            run.results.eoq,
                                                        )}{' '}
                                                        unit
                                                    </>
                                                ) : run.type ===
                                                  'forecasting' ? (
                                                    <>
                                                        Forecasting ·{' '}
                                                        {
                                                            run.inputs
                                                                .analysis_name
                                                        }
                                                    </>
                                                ) : run.type === 'mrp' ? (
                                                    <>
                                                        MRP ·{' '}
                                                        {run.inputs.plan_name}
                                                    </>
                                                ) : (
                                                    <>
                                                        SPC ·{' '}
                                                        {
                                                            run.inputs
                                                                .analysis_name
                                                        }
                                                    </>
                                                )}
                                            </p>
                                            <p className="mt-1 text-base text-muted">
                                                {new Intl.DateTimeFormat(
                                                    'id-ID',
                                                    {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short',
                                                    },
                                                ).format(
                                                    new Date(run.created_at),
                                                )}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/projects/${project.id}/analyses/${run.id}`}
                                            className="text-base font-medium text-accent-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                                        >
                                            Buka hasil →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {deleteDialogOpen && (
                        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4">
                            <section
                                role="alertdialog"
                                aria-modal="true"
                                aria-labelledby="delete-project-title"
                                aria-describedby="delete-project-description"
                                className="w-full max-w-lg border border-line bg-surface p-6 shadow-xl sm:p-8"
                            >
                                <p className="font-mono text-sm font-semibold tracking-[0.14em] text-danger">
                                    KONFIRMASI PENGHAPUSAN
                                </p>
                                <h2
                                    id="delete-project-title"
                                    className="mt-3 text-2xl font-semibold"
                                >
                                    Hapus proyek ini?
                                </h2>
                                <p
                                    id="delete-project-description"
                                    className="mt-3 text-base leading-7 text-muted"
                                >
                                    Proyek “{project.name}” akan dihapus
                                    permanen. Tindakan ini tidak dapat
                                    dibatalkan.
                                </p>
                                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        ref={cancelDeleteRef}
                                        data-delete-cancel
                                        onClick={() =>
                                            setDeleteDialogOpen(false)
                                        }
                                        className="inline-flex min-h-12 items-center justify-center border border-line-strong px-5 text-base font-medium hover:bg-canvas"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        data-delete-confirm
                                        disabled={processing}
                                        onClick={() =>
                                            destroy(`/projects/${project.id}`, {
                                                onFinish: () =>
                                                    setDeleteDialogOpen(false),
                                            })
                                        }
                                        className="inline-flex min-h-12 items-center justify-center bg-danger px-5 text-base font-semibold text-surface hover:opacity-90 disabled:opacity-60"
                                    >
                                        {processing
                                            ? 'Menghapus…'
                                            : 'Ya, hapus proyek'}
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
