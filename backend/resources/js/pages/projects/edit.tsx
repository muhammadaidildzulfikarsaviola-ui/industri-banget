import { Head, Link } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { ProjectForm } from '@/components/project-form';
import type { FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    flash?: FlashMessages;
};

export default function ProjectEdit({ project, flash }: Props) {
    return (
        <>
            <Head title={`Edit ${project.name}`} />
            <main className="min-h-screen bg-[#111210] px-4 py-6 text-[#e9e9e3] sm:px-6 sm:py-10">
                <div className="mx-auto max-w-3xl">
                    <Link
                        href={`/projects/${project.id}`}
                        className="text-xs font-semibold tracking-[0.16em] text-[#a5a69d] hover:text-[#e8f06b] focus-visible:outline-2 focus-visible:outline-[#e8f06b]"
                    >
                        ← DETAIL PROYEK
                    </Link>
                    <p className="mt-7 font-mono text-[10px] tracking-[0.18em] text-[#e8f06b]">
                        PROJECT / EDIT
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Edit proyek
                    </h1>
                    <p className="mt-2 text-sm text-[#a5a69d]">
                        Perbarui metadata proyek. Riwayat analisis yang sudah
                        tersimpan tidak berubah.
                    </p>
                    <div className="my-6">
                        <FlashMessage flash={flash} />
                    </div>
                    <section className="border border-[#30312c] bg-[#171815] p-5 sm:p-7">
                        <ProjectForm project={project} />
                    </section>
                </div>
            </main>
        </>
    );
}
