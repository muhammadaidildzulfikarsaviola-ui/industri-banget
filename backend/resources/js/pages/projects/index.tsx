import { Head, Link } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { ProjectForm } from '@/components/project-form';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { FlashMessages, Project, ProjectStatus } from '@/types/project';

type Props = {
    projects: Project[];
    flash?: FlashMessages;
};

const statusLabels: Record<ProjectStatus, string> = {
    active: 'Aktif',
    completed: 'Selesai',
    on_hold: 'Ditunda',
};

const statusStyles: Record<ProjectStatus, string> = {
    active: 'border-success-line bg-success-soft text-success',
    completed: 'border-info-line bg-info-soft text-info',
    on_hold: 'border-warning-line bg-warning-soft text-warning',
};

export default function ProjectsIndex({ projects, flash }: Props) {
    return (
        <>
            <Head title="Projects" />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-[1500px]">
                    <header className="mb-9 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7">
                        <div>
                            <Link
                                href="/"
                                className="text-base font-semibold tracking-[0.18em] text-muted hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                            >
                                ← WORKSPACE OVERVIEW
                            </Link>
                            <p className="mt-6 font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                01 / PROJECT REGISTER
                            </p>
                            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                                Proyek
                            </h1>
                            <p className="mt-3 max-w-2xl text-lg leading-7 text-muted">
                                Simpan ruang lingkup kerja teknik industri dan
                                pantau status setiap proyek.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-5">
                            <p className="font-mono text-xs font-medium text-muted sm:text-sm">
                                {projects.length.toString().padStart(2, '0')}{' '}
                                RECORD
                                {projects.length === 1 ? '' : 'S'}
                            </p>
                            <WorkspaceActions />
                        </div>
                    </header>

                    <div className="mb-6">
                        <FlashMessage flash={flash} />
                    </div>

                    <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] xl:gap-12">
                        <section
                            aria-labelledby="new-project-title"
                            className="h-fit border border-line bg-surface p-5 sm:p-7"
                        >
                            <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                NEW ENTRY
                            </p>
                            <h2
                                id="new-project-title"
                                className="mt-2 mb-6 text-2xl font-semibold"
                            >
                                Buat proyek
                            </h2>
                            <ProjectForm />
                        </section>

                        <section aria-labelledby="projects-list-title">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-line pb-4">
                                <div>
                                    <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                        PROJECT REGISTER
                                    </p>
                                    <h2
                                        id="projects-list-title"
                                        className="mt-2 text-xl font-semibold"
                                    >
                                        Daftar proyek
                                    </h2>
                                </div>
                                <span className="text-sm text-muted">
                                    Terbaru lebih dulu
                                </span>
                            </div>
                            {projects.length === 0 ? (
                                <div className="border border-dashed border-line-strong px-5 py-14 text-center sm:py-20">
                                    <p className="font-mono text-base tracking-[0.15em] text-accent-strong">
                                        NO PROJECTS YET
                                    </p>
                                    <h3 className="mt-3 text-lg font-medium">
                                        Mulai dari satu masalah nyata.
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-sm text-base leading-6 text-muted">
                                        Buat proyek pertama untuk mencatat
                                        konteks, bidang industri, dan status
                                        pekerjaannya.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-line border-y border-line">
                                    {projects.map((project) => (
                                        <li
                                            key={project.id}
                                            className="py-5 sm:py-6"
                                        >
                                            <article className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                                        <Link
                                                            href={`/projects/${project.id}`}
                                                            className="text-xl font-semibold break-words hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                                        >
                                                            {project.name}
                                                        </Link>
                                                        <span
                                                            className={`border px-3 py-1 text-sm font-semibold ${statusStyles[project.status]}`}
                                                        >
                                                            {
                                                                statusLabels[
                                                                    project
                                                                        .status
                                                                ]
                                                            }
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-muted">
                                                        {project.industry ||
                                                            'Bidang industri belum diisi'}{' '}
                                                        <span aria-hidden="true">
                                                            ·
                                                        </span>{' '}
                                                        Dibuat{' '}
                                                        {new Intl.DateTimeFormat(
                                                            'id-ID',
                                                            {
                                                                dateStyle:
                                                                    'medium',
                                                            },
                                                        ).format(
                                                            new Date(
                                                                project.created_at,
                                                            ),
                                                        )}
                                                    </p>
                                                    <p className="mt-2 text-sm text-muted">
                                                        {project.analysis_runs_count ??
                                                            0}{' '}
                                                        analisis tersimpan
                                                    </p>
                                                    {project.description && (
                                                        <p className="mt-4 max-w-3xl text-base leading-7 whitespace-pre-wrap text-muted">
                                                            {
                                                                project.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/projects/${project.id}`}
                                                    aria-label={`Buka proyek ${project.name}`}
                                                    className="inline-flex min-h-11 items-center font-mono text-sm font-medium whitespace-nowrap text-accent-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                                                >
                                                    PRJ-
                                                    {project.id
                                                        .toString()
                                                        .padStart(4, '0')}{' '}
                                                    →
                                                </Link>
                                            </article>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </>
    );
}
