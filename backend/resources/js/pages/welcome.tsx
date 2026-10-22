import { Head } from '@inertiajs/react';

const navigation = [
    { number: '01', label: 'Dashboard', active: true },
    { number: '02', label: 'Projects', active: false },
    { number: '03', label: 'Analysis Workbench', active: false },
    { number: '04', label: 'Datasets', active: false },
    { number: '05', label: 'Reports', active: false },
    { number: '06', label: 'Knowledge Base', active: false },
];

const metrics = [
    { label: 'TOTAL PROJECTS', value: '00', note: 'Your analysis workspace' },
    { label: 'ACTIVE ANALYSES', value: '00', note: 'Currently in progress' },
    { label: 'DATASETS', value: '00', note: 'Available for analysis' },
];

const tools = [
    {
        code: 'EOQ',
        name: 'Economic Order Quantity',
        detail: 'Inventory optimization',
        status: 'AVAILABLE',
    },
    {
        code: 'FC',
        name: 'Forecasting',
        detail: 'Demand prediction',
        status: 'PLANNED',
    },
    {
        code: 'SPC',
        name: 'Statistical Process Control',
        detail: 'Quality monitoring',
        status: 'PLANNED',
    },
    {
        code: 'MRP',
        name: 'Material Requirements Planning',
        detail: 'Production planning',
        status: 'PLANNED',
    },
];

export default function Welcome() {
    return (
        <>
            <Head title="Dashboard | INDUSTRI BANGET" />

            <div className="min-h-screen bg-[#111210] text-[#e9e9e3]">
                <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-[#30312c] bg-[#171815] md:flex">
                    <div className="border-b border-[#30312c] px-6 py-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center bg-[#e8f06b] text-sm font-black text-[#171815]">
                                IB
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-wide">
                                    INDUSTRI BANGET
                                </p>
                                <p className="mt-1 text-[10px] tracking-[0.18em] text-[#92938a]">
                                    ENGINEERING WORKSPACE
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 pt-7">
                        <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#77786f]">
                            WORKSPACE
                        </p>
                        <nav className="space-y-1">
                            {navigation.map((item) => (
                                <a
                                    key={item.number}
                                    href={item.active ? '/' : '#'}
                                    className={`flex items-center gap-3 px-3 py-3 text-sm transition ${
                                        item.active
                                            ? 'border-l-2 border-[#e8f06b] bg-[#292b22] text-[#e8f06b]'
                                            : 'border-l-2 border-transparent text-[#a5a69d] hover:bg-[#22231f] hover:text-white'
                                    }`}
                                >
                                    <span className="font-mono text-[10px] text-[#73746b]">
                                        {item.number}
                                    </span>
                                    <span>{item.label}</span>
                                </a>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto border-t border-[#30312c] p-5">
                        <p className="text-xs text-[#92938a]">
                            INDUSTRIAL ENGINEERING
                        </p>
                        <p className="mt-1 text-xs text-[#62635c]">
                            Built for practical analysis.
                        </p>
                        <p className="mt-4 font-mono text-[10px] text-[#62635c]">
                            VERSION 0.1.0 / DEV
                        </p>
                    </div>
                </aside>

                <main className="md:ml-64">
                    <header className="flex min-h-16 items-center justify-between border-b border-[#30312c] px-5 md:px-10">
                        <div>
                            <p className="text-xs text-[#92938a]">
                                WORKSPACE / OVERVIEW
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 rounded-full bg-[#e8f06b]" />
                            <span className="text-xs text-[#b8b9af]">
                                LOCAL ENVIRONMENT
                            </span>
                        </div>
                    </header>

                    <div className="mx-auto max-w-[1500px] p-5 md:p-10">
                        <section className="flex flex-col justify-between gap-6 border-b border-[#30312c] pb-8 sm:flex-row sm:items-end">
                            <div>
                                <p className="mb-3 font-mono text-xs tracking-[0.2em] text-[#e8f06b]">
                                    YOUR ENGINEERING DESK
                                </p>
                                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                                    Dashboard
                                    <span className="text-[#e8f06b]">.</span>
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-[#92938a]">
                                    One workspace for industrial engineering
                                    projects, data, and quantitative analysis.
                                </p>
                            </div>
                            <a
                                href="#analysis-tools"
                                className="inline-flex min-h-11 items-center justify-center gap-3 bg-[#e8f06b] px-5 text-sm font-semibold text-[#171815] transition hover:bg-[#f2f6a0]"
                            >
                                Explore analysis tools{' '}
                                <span aria-hidden="true">↗</span>
                            </a>
                        </section>

                        <section className="grid grid-cols-1 gap-px border border-[#30312c] bg-[#30312c] sm:grid-cols-3">
                            {metrics.map((metric, index) => (
                                <div
                                    key={metric.label}
                                    className="bg-[#171815] p-6 md:p-7"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-semibold tracking-[0.16em] text-[#92938a]">
                                            {metric.label}
                                        </p>
                                        <span className="font-mono text-xs text-[#62635c]">
                                            0{index + 1}
                                        </span>
                                    </div>
                                    <p className="mt-6 font-mono text-4xl font-medium">
                                        {metric.value}
                                    </p>
                                    <p className="mt-2 text-xs text-[#77786f]">
                                        {metric.note}
                                    </p>
                                </div>
                            ))}
                        </section>

                        <section className="mt-12 grid grid-cols-1 gap-10 xl:grid-cols-[1.4fr_1fr]">
                            <div>
                                <div className="mb-5 flex items-end justify-between border-b border-[#30312c] pb-4">
                                    <div>
                                        <p className="font-mono text-[10px] tracking-[0.18em] text-[#e8f06b]">
                                            01 / ANALYSIS
                                        </p>
                                        <h2 className="mt-2 text-xl font-semibold">
                                            Analysis workbench
                                        </h2>
                                    </div>
                                    <span className="text-xs text-[#77786f]">
                                        4 modules
                                    </span>
                                </div>

                                <div className="divide-y divide-[#30312c] border-y border-[#30312c]">
                                    {tools.map((tool) => (
                                        <div
                                            key={tool.code}
                                            className="group flex items-center gap-4 py-5"
                                        >
                                            <div className="flex h-12 w-14 shrink-0 items-center justify-center border border-[#3a3b34] bg-[#1b1c18] font-mono text-xs font-bold text-[#e8f06b]">
                                                {tool.code}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-medium">
                                                    {tool.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-[#85867d]">
                                                    {tool.detail}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`text-[9px] font-semibold tracking-wider ${
                                                        tool.status ===
                                                        'AVAILABLE'
                                                            ? 'text-[#e8f06b]'
                                                            : 'text-[#77786f]'
                                                    }`}
                                                >
                                                    {tool.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-5 border-b border-[#30312c] pb-4">
                                    <p className="font-mono text-[10px] tracking-[0.18em] text-[#e8f06b]">
                                        02 / GET STARTED
                                    </p>
                                    <h2 className="mt-2 text-xl font-semibold">
                                        Set up your workspace
                                    </h2>
                                </div>

                                <div className="border border-[#30312c] bg-[#171815] p-6">
                                    <p className="text-sm leading-6 text-[#b8b9af]">
                                        Start with a project, organize its
                                        datasets, then run an analysis and save
                                        the results.
                                    </p>

                                    <div className="mt-6 space-y-5">
                                        {[
                                            [
                                                '01',
                                                'Create a project',
                                                'Define the problem you want to solve.',
                                            ],
                                            [
                                                '02',
                                                'Prepare your data',
                                                'Organize the inputs for your analysis.',
                                            ],
                                            [
                                                '03',
                                                'Run an analysis',
                                                'Calculate, inspect, and interpret results.',
                                            ],
                                        ].map(([number, title, detail]) => (
                                            <div
                                                key={number}
                                                className="flex gap-4"
                                            >
                                                <span className="font-mono text-xs text-[#e8f06b]">
                                                    {number}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {title}
                                                    </p>
                                                    <p className="mt-1 text-xs leading-5 text-[#85867d]">
                                                        {detail}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-7 border-t border-[#30312c] pt-5">
                                        <p className="text-[10px] tracking-[0.16em] text-[#77786f]">
                                            CURRENT STATUS
                                        </p>
                                        <p className="mt-2 text-sm">
                                            Workspace initialized.
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-[#85867d]">
                                            Project management and analysis
                                            workflows are the next development
                                            milestones.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <footer className="mt-16 flex flex-col gap-2 border-t border-[#30312c] py-6 text-[10px] tracking-wide text-[#62635c] sm:flex-row sm:justify-between">
                            <span>INDUSTRI BANGET © 2026</span>
                            <span>ENGINEERING · DATA · DECISIONS</span>
                        </footer>
                    </div>
                </main>
            </div>
        </>
    );
}
