import { Head, Link } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { ProjectForm } from '@/components/project-form';
import { ThemeToggle } from '@/components/theme-toggle';
import type { FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    flash?: FlashMessages;
};

export default function ProjectEdit({ project, flash }: Props) {
    return (
        <>
            <Head title={`Edit ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10">
                <div className="mx-auto max-w-4xl">
                    <header className="mb-6 flex items-start justify-between gap-3 border-b border-line pb-4">
                        <Link
                            href={`/projects/${project.id}`}
                            className="pt-2 text-base font-semibold tracking-[0.16em] text-muted hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
                        >
                            ← DETAIL PROYEK
                        </Link>
                        <ThemeToggle />
                    </header>
                    <p className="mt-6 font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                        PROJECT / EDIT
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                        Edit proyek
                    </h1>
                    <p className="mt-2 text-base text-muted">
                        Perbarui metadata proyek. Riwayat analisis yang sudah
                        tersimpan tidak berubah.
                    </p>
                    <div className="my-6">
                        <FlashMessage flash={flash} />
                    </div>
                    <section className="border border-line bg-surface p-5 sm:p-8">
                        <ProjectForm project={project} />
                    </section>
                </div>
            </main>
        </>
    );
}
