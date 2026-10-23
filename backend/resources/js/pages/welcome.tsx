import { Head } from '@inertiajs/react';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { Project, ProjectStatus } from '@/types/project';

type Props = {
    recentProjects: Project[];
};

const navigation = [
    { number: '01', label: 'Dashboard', href: '/', active: true },
    { number: '02', label: 'Projects', href: '/projects', active: false },
];

const tools = [
    {
        code: 'EOQ',
        name: 'Economic Order Quantity',
        detail: 'Optimasi kuantitas persediaan',
        status: 'TERSEDIA',
        available: true,
    },
    {
        code: 'FC',
        name: 'Forecasting',
        detail: 'Peramalan permintaan',
        status: 'TERSEDIA',
        available: true,
    },
    {
        code: 'SPC',
        name: 'Statistical Process Control',
        detail: 'Pemantauan kualitas',
        status: 'TERSEDIA',
        available: true,
    },
    {
        code: 'MRP',
        name: 'Material Requirements Planning',
        detail: 'Perencanaan produksi',
        status: 'TERSEDIA',
        available: true,
    },
];

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

export default function Welcome({ recentProjects }: Props) {
    return (
        <>
            <Head title="Dashboard | INDUSTRI BANGET" />

            <div className="min-h-screen bg-canvas text-ink">
                <aside className="fixed inset-y-0 left-0 z-10 hidden w-72 flex-col border-r border-line bg-surface md:flex">
                    <div className="border-b border-line px-6 py-7">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center bg-accent text-base font-black text-ink">
                                IB
                            </div>
                            <div>
                                <p className="text-base font-bold tracking-wide">
                                    INDUSTRI BANGET
                                </p>
                                <p className="mt-1 text-xs font-medium tracking-[0.12em] text-muted">
                                    ENGINEERING WORKSPACE
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pt-7">
                        <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted">
                            WORKSPACE
                        </p>
                        <nav aria-label="Navigasi utama" className="space-y-1">
                            {navigation.map((item) => (
                                <a
                                    key={item.number}
                                    href={item.href}
                                    aria-current={
                                        item.active ? 'page' : undefined
                                    }
                                    className={`flex min-h-12 items-center gap-3 px-3 py-3 text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                                        item.active
                                            ? 'border-l-2 border-accent bg-accent-soft font-semibold text-ink'
                                            : 'border-l-2 border-transparent text-muted hover:bg-canvas hover:text-ink'
                                    }`}
                                >
                                    <span className="font-mono text-sm text-subtle">
                                        {item.number}
                                    </span>
                                    <span>{item.label}</span>
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto border-t border-line p-6">
                        <p className="text-sm font-semibold text-ink">
                            INDUSTRIAL ENGINEERING
                        </p>
                        <p className="mt-1 text-sm text-muted">
                            Built for practical analysis.
                        </p>
                        <p className="mt-4 font-mono text-xs text-subtle">
                            VERSION 0.1.0 / DEV
                        </p>
                    </div>
                </aside>

                <main className="md:ml-72">
                    <header className="flex min-h-16 items-center justify-between border-b border-line bg-surface/95 px-4 sm:px-6 md:px-10">
                        <div>
                            <p className="hidden text-sm text-muted sm:block">
                                WORKSPACE / OVERVIEW
                            </p>
                            <a
                                href="/"
                                className="text-base font-bold tracking-wide md:hidden"
                            >
                                INDUSTRI BANGET
                            </a>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <a
                                href="/projects"
                                className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-accent-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:px-3 sm:text-base"
                            >
                                Daftar proyek →
                            </a>
                            <WorkspaceActions />
                        </div>
                    </header>

                    <div className="mx-auto max-w-[1600px] p-5 sm:p-7 lg:p-10 xl:p-12">
                        <section className="flex flex-col justify-between gap-7 border-b border-line pb-10 sm:flex-row sm:items-end">
                            <div>
                                <p className="mb-3 font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                    WORKSPACE TEKNIK INDUSTRI
                                </p>
                                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                                    Ruang kerja analisis
                                </h1>
                                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
                                    Catat proyek, jalankan perhitungan, dan
                                    tinjau hasil dalam satu ruang kerja.
                                </p>
                            </div>
                            <a
                                href="/projects"
                                className="inline-flex min-h-12 items-center justify-center gap-3 bg-accent px-6 text-base font-semibold text-ink transition hover:bg-accent-strong hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                                Buka daftar proyek{' '}
                                <span aria-hidden="true">↗</span>
                            </a>
                        </section>

                        <section
                            id="analysis-tools"
                            className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[1.4fr_1fr] xl:gap-14"
                        >
                            <div>
                                <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-line pb-4">
                                    <div>
                                        <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                            01 / ANALISIS
                                        </p>
                                        <h2 className="mt-2 text-2xl font-semibold">
                                            Perangkat analisis
                                        </h2>
                                    </div>
                                    <span className="text-sm text-muted">
                                        4 tersedia
                                    </span>
                                </div>

                                <div className="divide-y divide-line border-y border-line bg-surface">
                                    {tools.map((tool) => {
                                        const contents = (
                                            <>
                                                <div
                                                    className={`flex h-12 w-16 shrink-0 items-center justify-center border font-mono text-sm font-bold ${tool.available ? 'border-warning-line bg-accent-soft text-accent-strong' : 'border-line bg-canvas text-muted'}`}
                                                >
                                                    {tool.code}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-base font-semibold">
                                                        {tool.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-muted">
                                                        {tool.detail}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className={`text-xs font-semibold tracking-wide ${tool.available ? 'text-success' : 'text-muted'}`}
                                                    >
                                                        {tool.status}
                                                    </span>
                                                </div>
                                            </>
                                        );

                                        return tool.available ? (
                                            <a
                                                key={tool.code}
                                                href="/projects"
                                                className="flex items-center gap-4 px-4 py-5 transition hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:px-5"
                                            >
                                                {contents}
                                                <span className="hidden text-sm font-semibold whitespace-nowrap text-accent-strong sm:block">
                                                    Buka →
                                                </span>
                                            </a>
                                        ) : (
                                            <div
                                                key={tool.code}
                                                aria-disabled="true"
                                                className="flex items-center gap-4 px-4 py-5 sm:px-5"
                                            >
                                                {contents}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div className="mb-4 border-b border-line pb-4">
                                    <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                        02 / MULAI DI SINI
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold">
                                        Alur kerja
                                    </h2>
                                </div>

                                <div className="border border-line bg-surface p-5 sm:p-7">
                                    <p className="text-base leading-7 text-muted">
                                        Buat proyek, jalankan analisis EOQ atau
                                        Forecasting, lalu buka kembali hasil
                                        yang tersimpan di riwayat proyek.
                                    </p>

                                    <ol className="mt-7 space-y-6">
                                        {[
                                            [
                                                '01',
                                                'Buat proyek',
                                                'Tentukan masalah dan konteks industrinya.',
                                            ],
                                            [
                                                '02',
                                                'Jalankan analisis',
                                                'Pilih EOQ atau Forecasting dari halaman proyek.',
                                            ],
                                            [
                                                '03',
                                                'Tinjau hasil',
                                                'Buka kurva biaya dan riwayat proyek.',
                                            ],
                                        ].map(([number, title, detail]) => (
                                            <li
                                                key={number}
                                                className="flex gap-4"
                                            >
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-sm font-semibold text-accent-strong">
                                                    {number}
                                                </span>
                                                <div>
                                                    <p className="text-base font-semibold">
                                                        {title}
                                                    </p>
                                                    <p className="mt-1 text-sm leading-6 text-muted">
                                                        {detail}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>
                        </section>

                        <section
                            className="mt-12"
                            aria-labelledby="recent-projects-title"
                        >
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                                <div>
                                    <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                        PROJECT REGISTER
                                    </p>
                                    <h2
                                        id="recent-projects-title"
                                        className="mt-2 text-2xl font-semibold"
                                    >
                                        Proyek terbaru
                                    </h2>
                                </div>
                                <a
                                    href="/projects"
                                    className="inline-flex min-h-11 items-center text-base font-semibold text-accent-strong hover:underline"
                                >
                                    Lihat semua proyek →
                                </a>
                            </div>
                            {recentProjects.length === 0 ? (
                                <div className="border border-dashed border-line-strong bg-surface px-5 py-8 sm:px-7">
                                    <p className="text-base text-muted">
                                        Belum ada proyek. Mulai dengan mencatat
                                        masalah atau peluang perbaikan yang
                                        ingin dianalisis.
                                    </p>
                                    <a
                                        href="/projects"
                                        className="mt-4 inline-flex min-h-11 items-center bg-accent px-4 text-base font-semibold text-ink hover:bg-accent-strong hover:text-surface"
                                    >
                                        Buat proyek pertama →
                                    </a>
                                </div>
                            ) : (
                                <ul className="divide-y divide-line border-y border-line bg-surface">
                                    {recentProjects.map((project) => (
                                        <li
                                            key={project.id}
                                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5"
                                        >
                                            <div className="min-w-0">
                                                <a
                                                    href={`/projects/${project.id}`}
                                                    className="text-lg font-semibold break-words hover:text-accent-strong hover:underline"
                                                >
                                                    {project.name}
                                                </a>
                                                <p className="mt-1 text-base text-muted">
                                                    {project.industry ||
                                                        'Bidang industri belum diisi'}
                                                </p>
                                            </div>
                                            <span
                                                className={`border px-3 py-1 text-sm font-semibold ${statusStyles[project.status]}`}
                                            >
                                                {statusLabels[project.status]}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <footer className="mt-16 flex flex-col gap-2 border-t border-line py-6 text-sm tracking-wide text-subtle sm:flex-row sm:justify-between">
                            <span>INDUSTRI BANGET © 2026</span>
                            <span>ENGINEERING · DATA · DECISIONS</span>
                        </footer>
                    </div>
                </main>
            </div>
        </>
    );
}
