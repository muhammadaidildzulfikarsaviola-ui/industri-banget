import { Head, Link } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { ProjectForm } from '@/components/project-form';
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

export default function ProjectsIndex({ projects, flash }: Props) {
    return (
        <>
            <Head title="Projects" />
            <main className="min-h-screen bg-[#111210] px-4 py-6 text-[#e9e9e3] sm:px-6 sm:py-10 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-[#30312c] pb-6">
                        <div>
                            <Link
                                href="/"
                                className="text-xs font-semibold tracking-[0.18em] text-[#a5a69d] hover:text-[#e8f06b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8f06b]"
                            >
                                ← WORKSPACE OVERVIEW
                            </Link>
                            <p className="mt-7 font-mono text-[10px] tracking-[0.2em] text-[#e8f06b]">
                                01 / PROJECT REGISTER
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Projects
                                <span className="text-[#e8f06b]">.</span>
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-[#a5a69d]">
                                Simpan ruang lingkup kerja teknik industri dan
                                pantau status setiap proyek.
                            </p>
                        </div>
                        <p className="font-mono text-sm text-[#a5a69d]">
                            {projects.length.toString().padStart(2, '0')} RECORD
                            {projects.length === 1 ? '' : 'S'}
                        </p>
                    </header>

                    <div className="mb-6">
                        <FlashMessage flash={flash} />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[minmax(270px,350px)_1fr]">
                        <section
                            aria-labelledby="new-project-title"
                            className="h-fit border border-[#30312c] bg-[#171815] p-5 sm:p-6"
                        >
                            <p className="font-mono text-[10px] tracking-[0.18em] text-[#e8f06b]">
                                NEW ENTRY
                            </p>
                            <h2
                                id="new-project-title"
                                className="mt-2 mb-5 text-lg font-semibold"
                            >
                                Buat proyek
                            </h2>
                            <ProjectForm />
                        </section>

                        <section aria-labelledby="projects-list-title">
                            <div className="mb-4 flex items-end justify-between border-b border-[#30312c] pb-4">
                                <div>
                                    <p className="font-mono text-[10px] tracking-[0.18em] text-[#e8f06b]">
                                        PROJECT REGISTER
                                    </p>
                                    <h2
                                        id="projects-list-title"
                                        className="mt-2 text-xl font-semibold"
                                    >
                                        Daftar proyek
                                    </h2>
                                </div>
                                <span className="text-xs text-[#a5a69d]">
                                    Terbaru lebih dulu
                                </span>
                            </div>
                            {projects.length === 0 ? (
                                <div className="border border-dashed border-[#45463e] px-5 py-14 text-center sm:py-20">
                                    <p className="font-mono text-xs tracking-[0.15em] text-[#e8f06b]">
                                        NO PROJECTS YET
                                    </p>
                                    <h3 className="mt-3 text-lg font-medium">
                                        Mulai dari satu masalah nyata.
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#a5a69d]">
                                        Buat proyek pertama untuk mencatat
                                        konteks, bidang industri, dan status
                                        pekerjaannya.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-[#30312c] border-y border-[#30312c]">
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
                                                            className="text-base font-semibold break-words hover:text-[#e8f06b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8f06b]"
                                                        >
                                                            {project.name}
                                                        </Link>
                                                        <span className="border border-[#45463e] px-2 py-1 text-[10px] font-medium tracking-wide text-[#e8f06b]">
                                                            {
                                                                statusLabels[
                                                                    project
                                                                        .status
                                                                ]
                                                            }
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-xs text-[#a5a69d]">
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
                                                    <p className="mt-2 text-xs text-[#85867d]">
                                                        {project.analysis_runs_count ??
                                                            0}{' '}
                                                        analisis tersimpan
                                                    </p>
                                                    {project.description && (
                                                        <p className="mt-3 max-w-3xl text-sm leading-6 whitespace-pre-wrap text-[#c3c4bc]">
                                                            {
                                                                project.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <Link
                                                    href={`/projects/${project.id}`}
                                                    aria-label={`Buka proyek ${project.name}`}
                                                    className="font-mono text-[10px] text-[#77786f] underline-offset-4 hover:text-[#e8f06b] hover:underline focus-visible:outline-2 focus-visible:outline-[#e8f06b]"
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
