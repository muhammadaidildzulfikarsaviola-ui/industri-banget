import { Head, Link } from '@inertiajs/react';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { AnalysisRun, Project } from '@/types/project';

type Props = {
    project: Project;
    analysisRun: Extract<AnalysisRun, { type: 'mrp' }>;
};
const numberFormat = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 4,
});

export default function MrpShow({ project, analysisRun }: Props) {
    const { inputs, results } = analysisRun;
    const orders = results.records.flatMap((record) =>
        record.periods
            .filter((period) => period.planned_order_releases > 0)
            .map((period) => ({
                code: record.item.code,
                name: record.item.name,
                unit: record.item.unit,
                period: period.period,
                quantity: period.planned_order_releases,
                leadTime: record.item.lead_time_periods,
            })),
    );
    return (
        <>
            <Head title={`Hasil MRP · ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-7 border-b border-line pb-6">
                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href={`/projects/${project.id}`}
                                className="text-base font-semibold text-muted hover:text-accent-strong"
                            >
                                ← {project.name}
                            </Link>
                            <WorkspaceActions />
                        </div>
                        <p className="mt-6 font-mono text-sm tracking-[0.16em] text-accent-strong">
                            SNAPSHOT TERSIMPAN / MRP
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            {inputs.plan_name}
                        </h1>
                        <p className="mt-3 text-muted">
                            {results.periods.length} periode ·{' '}
                            {results.records.length} item ·{' '}
                            {new Intl.DateTimeFormat('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            }).format(new Date(analysisRun.created_at))}
                        </p>
                    </header>
                    <section className="border-y border-line bg-surface p-5">
                        <h2 className="text-xl font-semibold">
                            Ringkasan rencana
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-muted">
                            {results.lead_time_note}{' '}
                            {results.lot_sizing_notes.lot_for_lot}{' '}
                            {results.lot_sizing_notes.fixed_order_quantity}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                            Item, struktur BOM, MPS, scheduled receipts, dan
                            hasil di bawah adalah snapshot saat perhitungan.
                            Perubahan master setelahnya tidak mengubah hasil
                            lama.
                        </p>
                    </section>
                    {results.warnings.length > 0 && (
                        <section
                            role="alert"
                            className="mt-6 border border-warning-line bg-warning-soft p-5 text-warning"
                        >
                            <h2 className="font-semibold">
                                Peringatan waktu rilis dan kebutuhan
                            </h2>
                            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                                {results.warnings.map((warning, index) => (
                                    <li key={`${warning.type}-${index}`}>
                                        {warning.message}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    <section className="mt-8">
                        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Planned order releases
                                </h2>
                                <p className="mt-1 text-sm text-muted">
                                    Jumlah dan bucket rilis untuk pemesanan
                                    terencana.
                                </p>
                            </div>
                            <span className="text-sm text-muted">
                                {orders.length} baris rilis dalam horizon
                            </span>
                        </div>
                        {orders.length === 0 ? (
                            <p className="border border-dashed border-line-strong p-5 text-muted">
                                Tidak ada planned order release di dalam
                                horizon. Periksa persediaan awal, scheduled
                                receipts, atau peringatan rilis sebelum horizon.
                            </p>
                        ) : (
                            <div className="overflow-x-auto border-y border-line">
                                <table className="w-full min-w-[620px] text-left text-sm">
                                    <thead className="bg-surface text-muted">
                                        <tr>
                                            {[
                                                'Kode',
                                                'Item',
                                                'Periode rilis',
                                                'Jumlah',
                                                'Lead time',
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="px-3 py-3 font-semibold"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {orders.map((order, index) => (
                                            <tr
                                                key={`${order.code}-${order.period}-${index}`}
                                            >
                                                <th className="px-3 py-3">
                                                    {order.code}
                                                </th>
                                                <td className="px-3 py-3">
                                                    {order.name}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {order.period}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {numberFormat.format(
                                                        order.quantity,
                                                    )}{' '}
                                                    {order.unit}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {order.leadTime} periode
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                    <section className="mt-8 space-y-7">
                        <h2 className="text-xl font-semibold">
                            MRP per item dan periode
                        </h2>
                        {results.records.map((record) => (
                            <article
                                key={record.item.id}
                                className="border-y border-line"
                            >
                                <header className="bg-surface px-4 py-3">
                                    <h3 className="font-semibold">
                                        {record.item.code} · {record.item.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted">
                                        {record.item.unit} · stok awal{' '}
                                        {numberFormat.format(
                                            record.item.initial_on_hand,
                                        )}{' '}
                                        · lead time{' '}
                                        {record.item.lead_time_periods} periode
                                        ·{' '}
                                        {record.item.lot_sizing_policy ===
                                        'lot_for_lot'
                                            ? 'Lot-for-Lot'
                                            : `FOQ ${numberFormat.format(record.item.fixed_order_quantity ?? 0)}`}
                                    </p>
                                </header>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[850px] text-right text-sm">
                                        <thead className="text-muted">
                                            <tr>
                                                <th className="px-3 py-3 text-left">
                                                    Besaran
                                                </th>
                                                {record.periods.map(
                                                    (period) => (
                                                        <th
                                                            key={period.period}
                                                            className="px-3 py-3"
                                                        >
                                                            {period.period}
                                                        </th>
                                                    ),
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-line">
                                            {(
                                                [
                                                    [
                                                        'Gross Requirements',
                                                        'gross_requirements',
                                                    ],
                                                    [
                                                        'Scheduled Receipts',
                                                        'scheduled_receipts',
                                                    ],
                                                    [
                                                        'Projected On-Hand',
                                                        'projected_on_hand',
                                                    ],
                                                    [
                                                        'Net Requirements',
                                                        'net_requirements',
                                                    ],
                                                    [
                                                        'Planned Order Receipts',
                                                        'planned_order_receipts',
                                                    ],
                                                    [
                                                        'Planned Order Releases',
                                                        'planned_order_releases',
                                                    ],
                                                ] as const
                                            ).map(([label, key]) => (
                                                <tr key={key}>
                                                    <th className="px-3 py-3 text-left font-medium">
                                                        {label} (
                                                        {record.item.unit})
                                                    </th>
                                                    {record.periods.map(
                                                        (period) => (
                                                            <td
                                                                key={
                                                                    period.period
                                                                }
                                                                className="px-3 py-3"
                                                            >
                                                                {numberFormat.format(
                                                                    period[key],
                                                                )}
                                                            </td>
                                                        ),
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        ))}
                    </section>
                    <section className="mt-8 border-t border-line pt-5">
                        <h2 className="text-lg font-semibold">
                            Data input tersimpan
                        </h2>
                        <p className="mt-2 text-sm text-muted">
                            {inputs.mps.length} baris MPS ·{' '}
                            {inputs.scheduled_receipts.length} scheduled receipt
                            · {inputs.bom_snapshots.length} relasi BOM saat
                            analisis.
                        </p>
                    </section>
                    <Link
                        href={`/projects/${project.id}/mrp`}
                        className="mt-8 inline-flex min-h-12 items-center bg-accent px-5 font-semibold text-ink hover:bg-accent-strong"
                    >
                        Buat rencana MRP baru →
                    </Link>
                </div>
            </main>
        </>
    );
}
