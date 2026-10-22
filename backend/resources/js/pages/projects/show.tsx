import { Head, Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import type { AnalysisRun, FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    analysisRuns: AnalysisRun[];
    flash?: FlashMessages;
};

const statusLabels = {
    active: 'Aktif',
    completed: 'Selesai',
    on_hold: 'Ditunda',
} as const;

export default function ProjectShow({ project, analysisRuns, flash }: Props) {
    const { delete: destroy, processing } = useForm({});
    const hasAnalysisHistory = analysisRuns.length > 0;

    function deleteProject() {
        if (hasAnalysisHistory || processing) return;

        const confirmed = window.confirm(
            `Hapus proyek “${project.name}”? Penghapusan tidak dapat dibatalkan.`,
        );

        if (confirmed) destroy(`/projects/${project.id}`);
    }

    return (
        <>
            <Head title={project.name} />
            <main className="min-h-screen bg-[#111210] px-4 py-6 text-[#e9e9e3] sm:px-6 sm:py-10 md:px-10">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-7 border-b border-[#30312c] pb-6">
                        <Link
                            href="/projects"
                            className="text-xs font-semibold tracking-[0.16em] text-[#a5a69d] hover:text-[#e8f06b] focus-visible:outline-2 focus-visible:outline-[#e8f06b]"
                        >
                            ← PROJECT REGISTER
                        </Link>
                        <p className="mt-7 font-mono text-[10px] tracking-[0.2em] text-[#e8f06b]">
                            PROJECT / PRJ-
                            {project.id.toString().padStart(4, '0')}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
                                {project.name}
                            </h1>
                            <span className="border border-[#45463e] px-2 py-1 text-[10px] font-medium text-[#e8f06b]">
                                {statusLabels[project.status]}
                            </span>
                        </div>
                    </header>

                    <div className="mb-6">
                        <FlashMessage flash={flash} />
                    </div>

                    <section
                        className="grid gap-6 border-y border-[#30312c] py-6 sm:grid-cols-2 lg:grid-cols-4"
                        aria-label="Informasi proyek"
                    >
                        <div>
                            <p className="font-mono text-[10px] tracking-[0.15em] text-[#77786f]">
                                INDUSTRI
                            </p>
                            <p className="mt-2 text-sm">
                                {project.industry || 'Belum diisi'}
                            </p>
                        </div>
                        <div>
                            <p className="font-mono text-[10px] tracking-[0.15em] text-[#77786f]">
                                DIBUAT
                            </p>
                            <p className="mt-2 text-sm">
                                {new Intl.DateTimeFormat('id-ID', {
                                    dateStyle: 'long',
                                }).format(new Date(project.created_at))}
                            </p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="font-mono text-[10px] tracking-[0.15em] text-[#77786f]">
                                DESKRIPSI
                            </p>
                            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-[#c3c4bc]">
                                {project.description || 'Belum ada deskripsi.'}
                            </p>
                        </div>
                    </section>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={`/projects/${project.id}/eoq`}
                            className="inline-flex min-h-11 items-center bg-[#e8f06b] px-4 text-sm font-semibold text-[#171815] hover:bg-[#f2f6a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8f06b]"
                        >
                            Jalankan analisis EOQ →
                        </Link>
                        <Link
                            href={`/projects/${project.id}/edit`}
                            className="inline-flex min-h-11 items-center border border-[#45463e] px-4 text-sm font-medium hover:border-[#e8f06b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8f06b]"
                        >
                            Edit proyek
                        </Link>
                        <button
                            type="button"
                            onClick={deleteProject}
                            disabled={hasAnalysisHistory || processing}
                            title={
                                hasAnalysisHistory
                                    ? 'Proyek yang memiliki riwayat analisis tidak dapat dihapus.'
                                    : undefined
                            }
                            className="min-h-11 border border-[#8d4d3b] px-4 text-sm font-medium text-[#f2a58d] hover:bg-[#241916] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2a58d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Menghapus…' : 'Hapus proyek'}
                        </button>
                    </div>
                    {hasAnalysisHistory && (
                        <p className="mt-2 text-xs text-[#92938a]">
                            Penghapusan dikunci karena proyek memiliki riwayat
                            analisis yang harus dipertahankan.
                        </p>
                    )}

                    <section
                        className="mt-12"
                        aria-labelledby="analysis-history-title"
                    >
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[#30312c] pb-4">
                            <div>
                                <p className="font-mono text-[10px] tracking-[0.16em] text-[#e8f06b]">
                                    AUDIT TRAIL
                                </p>
                                <h2
                                    id="analysis-history-title"
                                    className="mt-2 text-xl font-semibold"
                                >
                                    Riwayat analisis
                                </h2>
                            </div>
                            <span className="text-xs text-[#92938a]">
                                {analysisRuns.length} hasil tersimpan
                            </span>
                        </div>
                        {analysisRuns.length === 0 ? (
                            <p className="border border-dashed border-[#45463e] px-5 py-10 text-sm text-[#a5a69d]">
                                Belum ada analisis. Jalankan EOQ untuk menyimpan
                                input dan hasil perhitungan di proyek ini.
                            </p>
                        ) : (
                            <ul className="divide-y divide-[#30312c] border-y border-[#30312c]">
                                {analysisRuns.map((run) => (
                                    <li
                                        key={run.id}
                                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold">
                                                EOQ ·{' '}
                                                {new Intl.NumberFormat(
                                                    'id-ID',
                                                    {
                                                        maximumFractionDigits: 2,
                                                    },
                                                ).format(run.results.eoq)}{' '}
                                                unit
                                            </p>
                                            <p className="mt-1 text-xs text-[#92938a]">
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
                                            className="text-sm font-medium text-[#e8f06b] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#e8f06b]"
                                        >
                                            Buka hasil →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
