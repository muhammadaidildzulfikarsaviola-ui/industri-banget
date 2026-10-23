import { Head, Link } from '@inertiajs/react';
import { SpcControlChart } from '@/components/spc-control-chart';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { AnalysisRun, Project } from '@/types/project';

type Props = {
    project: Project;
    analysisRun: Extract<AnalysisRun, { type: 'spc' }>;
};
const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 });

export default function SpcShow({ project, analysisRun }: Props) {
    const { inputs, results } = analysisRun;
    const outsideKeys = new Set(
        results.outside_points.map((point) => `${point.chart}:${point.point}`),
    );
    return (
        <>
            <Head title={`Hasil SPC · ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-7 border-b border-line pb-6">
                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href={`/projects/${project.id}`}
                                className="font-semibold text-muted hover:text-accent-strong"
                            >
                                ← {project.name}
                            </Link>
                            <WorkspaceActions />
                        </div>
                        <p className="mt-6 font-mono text-sm tracking-[0.16em] text-accent-strong">
                            SNAPSHOT ANALISIS / SPC
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            {inputs.analysis_name}
                        </h1>
                        <p className="mt-3 text-muted">
                            {inputs.chart_type.toUpperCase()} ·{' '}
                            {inputs.characteristic} ({inputs.unit}) · disimpan{' '}
                            {new Intl.DateTimeFormat('id-ID', {
                                dateStyle: 'long',
                                timeStyle: 'short',
                            }).format(new Date(analysisRun.created_at))}
                        </p>
                    </header>

                    <section
                        className={`border p-5 sm:p-7 ${results.status === 'in_control' ? 'border-success-line bg-success-soft' : 'border-danger-line bg-danger-soft'}`}
                        aria-live="polite"
                    >
                        <p className="font-mono text-sm font-bold tracking-[0.15em]">
                            STATUS PROSES
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            {results.status === 'in_control'
                                ? 'IN CONTROL'
                                : 'OUT OF CONTROL'}
                        </h2>
                        <p className="mt-2 leading-7">
                            {results.interpretation}
                        </p>
                        <p className="mt-2 text-sm">
                            {results.outside_points.length} titik di luar batas
                            · {results.nelson_violations.length} sinyal Nelson
                            Rules
                        </p>
                    </section>

                    <section
                        className="mt-8 space-y-6"
                        aria-label="Grafik control chart"
                    >
                        {results.charts.map((chart) => (
                            <article
                                key={chart.key}
                                className="border-y border-line bg-surface p-4 sm:p-6"
                            >
                                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                                    <div>
                                        <h2 className="text-xl font-semibold">
                                            {chart.label}
                                        </h2>
                                        <p className="text-sm text-muted">
                                            CL {fmt.format(chart.center_line)}
                                            {chart.lcl !== null &&
                                            chart.ucl !== null
                                                ? ` · LCL ${fmt.format(chart.lcl)} · UCL ${fmt.format(chart.ucl)}`
                                                : ' · batas kontrol berubah per titik'}
                                        </p>
                                    </div>
                                    <span className="text-sm text-muted">
                                        {inputs.unit}
                                    </span>
                                </div>
                                <SpcControlChart
                                    chart={chart}
                                    unit={inputs.unit}
                                />
                            </article>
                        ))}
                    </section>

                    <section
                        className="mt-9"
                        aria-labelledby="spc-signals-title"
                    >
                        <h2
                            id="spc-signals-title"
                            className="mb-3 text-xl font-semibold"
                        >
                            Titik di luar batas kontrol
                        </h2>
                        {results.outside_points.length === 0 ? (
                            <p className="border border-line bg-surface px-4 py-4 text-muted">
                                Tidak ada titik yang berada di luar UCL/LCL.
                            </p>
                        ) : (
                            <div className="overflow-x-auto border border-line">
                                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                                    <thead className="bg-surface">
                                        <tr>
                                            {[
                                                'Chart',
                                                'Titik',
                                                'Statistik',
                                                'LCL',
                                                'UCL',
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="border-b border-line px-3 py-3 font-semibold"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.outside_points.map(
                                            (point, index) => (
                                                <tr
                                                    key={`${point.chart}-${point.point}-${index}`}
                                                    className="border-b border-line"
                                                >
                                                    <td className="px-3 py-3">
                                                        {point.chart}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {point.point}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {fmt.format(
                                                            point.value,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {fmt.format(point.lcl)}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {fmt.format(point.ucl)}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="mt-9" aria-labelledby="nelson-title">
                        <h2
                            id="nelson-title"
                            className="mb-2 text-xl font-semibold"
                        >
                            Nelson Rules 1–8
                        </h2>
                        <p className="mb-3 text-sm leading-6 text-muted">
                            {results.nelson_note}
                        </p>
                        {results.nelson_violations.length === 0 ? (
                            <p className="border border-line bg-surface px-4 py-4 text-muted">
                                Tidak ada rule yang terpicu pada chart yang
                                kompatibel. Rule yang membutuhkan lebih banyak
                                titik tidak diuji bila seri terlalu pendek.
                            </p>
                        ) : (
                            <div className="overflow-x-auto border border-line">
                                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                                    <thead className="bg-surface">
                                        <tr>
                                            {[
                                                'Rule',
                                                'Chart',
                                                'Rentang titik',
                                                'Alasan',
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="border-b border-line px-3 py-3 font-semibold"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.nelson_violations.map(
                                            (violation, index) => (
                                                <tr
                                                    key={`${violation.chart}-${violation.rule}-${violation.start_index}-${index}`}
                                                    className="border-b border-line"
                                                >
                                                    <td className="px-3 py-3 font-semibold">
                                                        Rule {violation.rule}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {violation.chart}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {violation.start_point}
                                                        {violation.start_index !==
                                                            violation.end_index &&
                                                            ` – ${violation.end_point}`}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {violation.reason}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="mt-9" aria-labelledby="spc-data-title">
                        <h2
                            id="spc-data-title"
                            className="mb-3 text-xl font-semibold"
                        >
                            Statistik setiap titik
                        </h2>
                        {results.charts.map((chart) => (
                            <div
                                key={chart.key}
                                className="mb-6 overflow-x-auto border border-line"
                            >
                                <h3 className="bg-surface px-4 py-3 font-semibold">
                                    {chart.label}
                                </h3>
                                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                                    <thead className="bg-surface/70">
                                        <tr>
                                            {[
                                                'Titik',
                                                'Statistik',
                                                'CL',
                                                'LCL',
                                                'UCL',
                                                'σ estimasi',
                                                'z-score',
                                                'Sinyal',
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="border-y border-line px-3 py-3 font-semibold"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chart.points.map((point) => (
                                            <tr
                                                key={`${chart.key}-${point.index}`}
                                                className={`border-b border-line ${outsideKeys.has(`${chart.key}:${point.label}`) ? 'bg-danger-soft' : ''}`}
                                            >
                                                <td className="px-3 py-3">
                                                    {point.label}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {fmt.format(point.value)}{' '}
                                                    {inputs.unit}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {fmt.format(point.cl)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {fmt.format(point.lcl)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {fmt.format(point.ucl)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {fmt.format(point.sigma)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {fmt.format(point.z_score)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {point.outside_control_limits
                                                        ? 'Di luar batas'
                                                        : 'Dalam batas'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </section>

                    <section className="mt-9 border-y border-line bg-surface p-5 sm:p-7">
                        <h2 className="text-xl font-semibold">
                            Formula dan asumsi
                        </h2>
                        <p className="mt-3 leading-7">{results.formula_note}</p>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
                            {results.assumptions.map((assumption) => (
                                <li key={assumption}>{assumption}</li>
                            ))}
                        </ul>
                        <p className="mt-4 text-sm text-muted">
                            Control limits memperkirakan variasi proses dari
                            data yang dianalisis. Control limits bukan
                            specification limits, dan sinyal statistik perlu
                            ditafsirkan bersama pengetahuan proses.
                        </p>
                    </section>
                    <p className="mt-6 text-sm text-muted">
                        Halaman ini membaca snapshot tersimpan; perubahan
                        perhitungan berikutnya tidak mengubah hasil lama.
                    </p>
                </div>
            </main>
        </>
    );
}
