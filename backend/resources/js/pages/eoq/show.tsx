import { Head, Link } from '@inertiajs/react';
import { EoqCostChart } from '@/components/eoq-cost-chart';
import { FlashMessage } from '@/components/flash-message';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { AnalysisRun, FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    analysisRun: Extract<AnalysisRun, { type: 'eoq' }>;
    flash?: FlashMessages;
};

function quantity(value: number): string {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(
        value,
    );
}

function money(value: number, currency: string): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

export default function EoqShow({ project, analysisRun, flash }: Props) {
    const { inputs, results } = analysisRun;
    const currency = inputs.currency_code;

    return (
        <>
            <Head title={`Hasil EOQ · ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-7 border-b border-line pb-6">
                        <div className="flex items-start justify-between gap-3">
                            <Link
                                href={`/projects/${project.id}`}
                                className="pt-2 text-base font-semibold tracking-[0.16em] text-muted hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
                            >
                                ← {project.name}
                            </Link>
                            <WorkspaceActions />
                        </div>
                        <p className="mt-6 font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                            SAVED ANALYSIS / EOQ-
                            {analysisRun.id.toString().padStart(4, '0')}
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                            Hasil EOQ
                            <span className="text-accent-strong">.</span>
                        </h1>
                        <p className="mt-2 text-base text-muted">
                            {project.name} ·{' '}
                            {new Intl.DateTimeFormat('id-ID', {
                                dateStyle: 'long',
                                timeStyle: 'short',
                            }).format(new Date(analysisRun.created_at))}
                        </p>
                    </header>

                    <div className="mb-6">
                        <FlashMessage flash={flash} />
                    </div>

                    <section
                        aria-labelledby="eoq-result-title"
                        className="mb-8"
                    >
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                            <div>
                                <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                    REKOMENDASI MODEL
                                </p>
                                <h2
                                    id="eoq-result-title"
                                    className="mt-2 text-2xl font-semibold"
                                >
                                    Kuantitas pesanan ekonomis
                                </h2>
                            </div>
                            <p className="font-mono text-2xl font-semibold text-accent-strong">
                                {quantity(results.eoq)}{' '}
                                <span className="text-base font-normal text-muted">
                                    unit/pesanan
                                </span>
                            </p>
                        </div>
                        <dl className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
                            <div className="bg-surface p-4 sm:p-5">
                                <dt className="text-base text-muted">
                                    Frekuensi pesanan
                                </dt>
                                <dd className="mt-3 font-mono text-xl">
                                    {quantity(results.orders_per_year)}{' '}
                                    <span className="text-base text-muted">
                                        pesanan/tahun
                                    </span>
                                </dd>
                            </div>
                            <div className="bg-surface p-4 sm:p-5">
                                <dt className="text-base text-muted">
                                    Interval rata-rata
                                </dt>
                                <dd className="mt-3 font-mono text-xl">
                                    {quantity(results.interval_days)}{' '}
                                    <span className="text-base text-muted">
                                        hari
                                    </span>
                                </dd>
                            </div>
                            <div className="bg-surface p-4 sm:p-5">
                                <dt className="text-base text-muted">
                                    Biaya pemesanan/tahun
                                </dt>
                                <dd className="mt-3 font-mono text-lg break-words">
                                    {money(
                                        results.annual_ordering_cost,
                                        currency,
                                    )}
                                </dd>
                            </div>
                            <div className="bg-surface p-4 sm:p-5">
                                <dt className="text-base text-muted">
                                    Biaya penyimpanan/tahun
                                </dt>
                                <dd className="mt-3 font-mono text-lg break-words">
                                    {money(
                                        results.annual_holding_cost,
                                        currency,
                                    )}
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-l-4 border-accent bg-accent-soft px-5 py-4 sm:px-6">
                            <p className="text-base">
                                Total biaya persediaan relevan per tahun
                            </p>
                            <p className="font-mono text-xl font-semibold">
                                {money(results.total_relevant_cost, currency)}
                            </p>
                        </div>
                        <p className="mt-3 text-base leading-6 text-muted">
                            Pada EOQ ini, biaya pemesanan tahunan{' '}
                            {money(results.annual_ordering_cost, currency)} dan
                            biaya penyimpanan tahunan{' '}
                            {money(results.annual_holding_cost, currency)}{' '}
                            seimbang. Model memperkirakan sekitar{' '}
                            {quantity(results.orders_per_year)} pesanan per
                            tahun, atau satu pesanan setiap{' '}
                            {quantity(results.interval_days)} hari.
                        </p>
                    </section>

                    {results.comparison && (
                        <section
                            aria-labelledby="comparison-title"
                            className="mb-8 border border-line p-5"
                        >
                            <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                KEBIJAKAN PEMBANDING
                            </p>
                            <h2
                                id="comparison-title"
                                className="mt-2 text-lg font-semibold"
                            >
                                Kuantitas{' '}
                                {quantity(results.comparison.quantity)}{' '}
                                unit/pesanan
                            </h2>
                            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <dt className="text-base text-muted">
                                        Biaya pemesanan/tahun
                                    </dt>
                                    <dd className="mt-1 font-mono">
                                        {money(
                                            results.comparison.ordering_cost,
                                            currency,
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-base text-muted">
                                        Biaya penyimpanan/tahun
                                    </dt>
                                    <dd className="mt-1 font-mono">
                                        {money(
                                            results.comparison.holding_cost,
                                            currency,
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-base text-muted">
                                        Total biaya relevan/tahun
                                    </dt>
                                    <dd className="mt-1 font-mono">
                                        {money(
                                            results.comparison.total_cost,
                                            currency,
                                        )}
                                    </dd>
                                </div>
                            </dl>
                            <p className="mt-4 text-base leading-5 text-muted">
                                Selisih total biaya terhadap EOQ:{' '}
                                {money(
                                    results.comparison.total_cost -
                                        results.total_relevant_cost,
                                    currency,
                                )}{' '}
                                per tahun.
                            </p>
                        </section>
                    )}

                    <section
                        aria-labelledby="cost-chart-title"
                        className="mb-8"
                    >
                        <div className="mb-4">
                            <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                COST CURVE
                            </p>
                            <h2
                                id="cost-chart-title"
                                className="mt-2 text-xl font-semibold"
                            >
                                Biaya relevan terhadap kuantitas pesanan
                            </h2>
                            <p className="mt-2 text-base text-muted">
                                Kurva dihitung dari input tersimpan. EOQ
                                ditandai pada titik minimum biaya total.
                            </p>
                        </div>
                        <EoqCostChart
                            points={results.chart}
                            eoq={results.eoq}
                            totalAtEoq={results.total_relevant_cost}
                            currency={currency}
                        />
                    </section>

                    <section className="grid grid-cols-1 gap-8 border-t border-line pt-6 md:grid-cols-2">
                        <div>
                            <h2 className="text-base font-semibold">
                                Input yang digunakan
                            </h2>
                            <dl className="mt-3 space-y-2 text-base text-muted">
                                <div className="flex justify-between gap-4">
                                    <dt>D · Permintaan tahunan</dt>
                                    <dd>
                                        {quantity(inputs.annual_demand)} unit
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>S · Biaya per pesanan</dt>
                                    <dd>
                                        {money(inputs.order_cost, currency)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>H · Biaya simpan/unit/tahun</dt>
                                    <dd>
                                        {money(inputs.holding_cost, currency)}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt>Kode mata uang</dt>
                                    <dd>{currency}</dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold">
                                Cakupan hasil
                            </h2>
                            <p className="mt-3 text-base leading-6 text-muted">
                                Biaya total relevan mencakup biaya pemesanan
                                tahunan dan biaya penyimpanan tahunan. Biaya
                                pembelian barang, diskon kuantitas, dan titik
                                pemesanan ulang tidak termasuk dalam model ini.
                            </p>
                            <Link
                                href={`/projects/${project.id}/eoq`}
                                className="mt-4 inline-flex min-h-10 items-center border border-line-strong px-3 text-base font-medium hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
                            >
                                Analisis input lain →
                            </Link>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
