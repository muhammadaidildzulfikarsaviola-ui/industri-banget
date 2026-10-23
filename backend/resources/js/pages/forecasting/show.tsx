import { Head, Link } from '@inertiajs/react';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { ForecastMethod } from '@/types/forecasting';
import type { AnalysisRun, Project } from '@/types/project';

type Props = {
    project: Project;
    analysisRun: Extract<AnalysisRun, { type: 'forecasting' }>;
};
const fmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const methodOrder: ForecastMethod[] = [
    'naive',
    'moving_average',
    'weighted_moving_average',
    'single_exponential_smoothing',
    'linear_trend',
];

export default function ForecastingShow({ project, analysisRun }: Props) {
    const { inputs, results } = analysisRun;
    const best = results.recommended_method;
    const projections = best ? (results.projections[best] ?? []) : [];
    const evalRows = best ? (results.evaluation.rows[best] ?? []) : [];
    const firstHoldoutIndex = results.historical.findIndex(
        (row) => row.period === results.evaluation.periods[0],
    );
    const forecastSeries = best
        ? [
              ...(evalRows.length > 0
                  ? [
                        {
                            index: Math.max(0, firstHoldoutIndex - 1),
                            value: results.historical[
                                Math.max(0, firstHoldoutIndex - 1)
                            ].actual,
                            period: results.historical[
                                Math.max(0, firstHoldoutIndex - 1)
                            ].period,
                        },
                    ]
                  : []),
              ...evalRows.map((row) => ({
                  index: results.historical.findIndex(
                      (historical) => historical.period === row.period,
                  ),
                  value: row.forecast,
                  period: row.period,
              })),
              ...projections.map((row, index) => ({
                  index: results.historical.length + index,
                  value: row.forecast,
                  period: row.period,
              })),
          ]
        : [];
    const values = [
        ...results.historical.map((row) => row.actual),
        ...forecastSeries.map((row) => row.value),
    ];
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const xFor = (index: number) =>
        30 +
        (index * 620) /
            Math.max(results.historical.length + projections.length - 1, 1);
    const yFor = (value: number) =>
        175 - ((value - min) * 145) / (max - min || 1);
    const actualPoints = results.historical
        .map((row, index) => `${xFor(index)},${yFor(row.actual)}`)
        .join(' ');
    const forecastPoints = forecastSeries
        .map((row) => `${xFor(row.index)},${yFor(row.value)}`)
        .join(' ');
    return (
        <>
            <Head title={`Hasil forecasting · ${project.name}`} />
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
                            HASIL TERSIMPAN / FORECASTING
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            {inputs.analysis_name}
                        </h1>
                        <p className="mt-3 text-muted">
                            {inputs.interval === 'daily'
                                ? 'Harian'
                                : inputs.interval === 'weekly'
                                  ? 'Mingguan'
                                  : 'Bulanan'}{' '}
                            · {inputs.unit} · {inputs.horizon} periode ke depan
                            ·{' '}
                            {new Intl.DateTimeFormat('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            }).format(new Date(analysisRun.created_at))}
                        </p>
                    </header>
                    <section className="border-y border-line bg-surface p-5">
                        <h2 className="text-xl font-semibold">
                            Ringkasan model
                        </h2>
                        <p className="mt-2 leading-7 text-muted">
                            {results.interpretation}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                            Evaluasi rolling-origin menggunakan{' '}
                            {results.evaluation.holdout_count} periode terakhir
                            yang sama untuk metode yang dapat dilatih dari{' '}
                            {results.evaluation.training_count} periode awal.
                            Tidak ada data dari periode evaluasi yang digunakan
                            untuk melatih prediksinya.
                        </p>
                    </section>
                    {best && (
                        <section className="mt-7 border-y border-line py-5">
                            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Aktual dan forecast ·{' '}
                                        {results.methods[best]?.label}
                                    </h2>
                                    <p className="text-sm text-muted">
                                        Menampilkan evaluasi rolling-origin dan
                                        proyeksi metode MAE terendah.
                                    </p>
                                </div>
                                <span className="text-sm text-muted">
                                    {inputs.unit}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <svg
                                    role="img"
                                    aria-label="Grafik perbandingan aktual dan forecast"
                                    viewBox="0 0 680 210"
                                    className="w-full min-w-[560px]"
                                >
                                    <line
                                        x1="30"
                                        y1="180"
                                        x2="650"
                                        y2="180"
                                        stroke="var(--color-line-strong)"
                                    />
                                    <polyline
                                        points={actualPoints}
                                        fill="none"
                                        stroke="var(--color-ink)"
                                        strokeWidth="2.5"
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />
                                    <polyline
                                        points={forecastPoints}
                                        fill="none"
                                        stroke="var(--color-accent-strong)"
                                        strokeWidth="3"
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />
                                    {results.historical.map((row, index) => (
                                        <circle
                                            key={row.period}
                                            cx={xFor(index)}
                                            cy={yFor(row.actual)}
                                            r="3"
                                            fill="var(--color-ink)"
                                        >
                                            <title>
                                                {row.period}: aktual{' '}
                                                {fmt.format(row.actual)}
                                            </title>
                                        </circle>
                                    ))}
                                    {forecastSeries.map((row, index) => (
                                        <circle
                                            key={`${row.index}-${index}`}
                                            cx={xFor(row.index)}
                                            cy={yFor(row.value)}
                                            r="3.5"
                                            fill="var(--color-accent-strong)"
                                        >
                                            <title>
                                                {row.period}: forecast{' '}
                                                {fmt.format(row.value)}{' '}
                                                {inputs.unit}
                                            </title>
                                        </circle>
                                    ))}
                                </svg>
                                <div className="mt-2 flex flex-wrap gap-5 text-sm">
                                    <span className="inline-flex items-center gap-2">
                                        <i className="size-3 rounded-full bg-ink" />{' '}
                                        Aktual
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <i className="size-3 rounded-full bg-accent-strong" />{' '}
                                        Forecast dan proyeksi
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}
                    <section className="mt-8">
                        <h2 className="mb-3 text-xl font-semibold">
                            Perbandingan metode pada holdout
                        </h2>
                        <div className="overflow-x-auto border-y border-line">
                            <table className="w-full min-w-[780px] text-left text-sm">
                                <thead className="bg-surface text-muted">
                                    <tr>
                                        {[
                                            'Metode',
                                            'MAE',
                                            'MSE',
                                            'RMSE',
                                            'MAPE',
                                            'Status',
                                        ].map((label) => (
                                            <th
                                                key={label}
                                                className="px-3 py-3 font-semibold"
                                            >
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {methodOrder
                                        .filter((method) =>
                                            inputs.methods.includes(method),
                                        )
                                        .map((method) => {
                                            const item =
                                                results.methods[method];
                                            const metrics = item?.metrics;
                                            const params =
                                                item?.parameters ?? {};
                                            const parameterText =
                                                method === 'moving_average'
                                                    ? `Jendela: ${String(params.window)} periode`
                                                    : method ===
                                                        'weighted_moving_average'
                                                      ? `Jendela: ${String(params.window)}; bobot tertua ke terbaru: ${Array.isArray(params.weights_oldest_to_newest) ? params.weights_oldest_to_newest.join(', ') : ''}`
                                                      : method ===
                                                          'single_exponential_smoothing'
                                                        ? `Alpha: ${String(params.alpha)}`
                                                        : method ===
                                                            'linear_trend'
                                                          ? 'Least-squares, indeks waktu 0 sampai n−1'
                                                          : 'Nilai aktual terakhir';
                                            return (
                                                <tr key={method}>
                                                    <th className="px-3 py-3 font-medium">
                                                        {item?.label}
                                                        {best === method && (
                                                            <span className="ml-2 border border-info-line bg-info-soft px-2 py-1 text-info">
                                                                Terendah MAE
                                                            </span>
                                                        )}
                                                        <span className="mt-1 block font-normal text-muted">
                                                            {parameterText}
                                                        </span>
                                                    </th>
                                                    <td className="px-3 py-3">
                                                        {metrics
                                                            ? fmt.format(
                                                                  metrics.mae,
                                                              )
                                                            : '—'}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {metrics
                                                            ? fmt.format(
                                                                  metrics.mse,
                                                              )
                                                            : '—'}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {metrics
                                                            ? fmt.format(
                                                                  metrics.rmse,
                                                              )
                                                            : '—'}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {metrics?.mape ===
                                                            null || !metrics
                                                            ? '—'
                                                            : `${fmt.format(metrics.mape)}%`}
                                                        {metrics?.mape_reason && (
                                                            <span className="block text-xs text-muted">
                                                                {
                                                                    metrics.mape_reason
                                                                }
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        {item?.reason ??
                                                            'Dapat dievaluasi'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section className="mt-8 grid gap-8 lg:grid-cols-2">
                        <div>
                            <h2 className="mb-3 text-xl font-semibold">
                                Proyeksi mendatang
                            </h2>
                            <div className="overflow-x-auto border-y border-line">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-surface text-muted">
                                        <tr>
                                            <th className="px-3 py-3">
                                                Periode
                                            </th>
                                            {methodOrder
                                                .filter((method) =>
                                                    inputs.methods.includes(
                                                        method,
                                                    ),
                                                )
                                                .map((method) => (
                                                    <th
                                                        className="px-3 py-3"
                                                        key={method}
                                                    >
                                                        {
                                                            results.methods[
                                                                method
                                                            ]?.label
                                                        }
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {projections.map(
                                            ({ period }, index) => (
                                                <tr key={period}>
                                                    <th className="px-3 py-3">
                                                        {period}
                                                    </th>
                                                    {methodOrder
                                                        .filter((method) =>
                                                            inputs.methods.includes(
                                                                method,
                                                            ),
                                                        )
                                                        .map((method) => (
                                                            <td
                                                                className="px-3 py-3"
                                                                key={method}
                                                            >
                                                                {results
                                                                    .methods[
                                                                    method
                                                                ]
                                                                    ?.forecast_available
                                                                    ? fmt.format(
                                                                          results
                                                                              .projections[
                                                                              method
                                                                          ]?.[
                                                                              index
                                                                          ]
                                                                              ?.forecast ??
                                                                              0,
                                                                      )
                                                                    : '—'}
                                                            </td>
                                                        ))}
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h2 className="mb-3 text-xl font-semibold">
                                Aktual dan evaluasi
                            </h2>
                            <div className="max-h-96 overflow-auto border-y border-line">
                                <table className="w-full text-left text-sm">
                                    <thead className="sticky top-0 bg-surface text-muted">
                                        <tr>
                                            <th className="px-3 py-3">
                                                Periode
                                            </th>
                                            <th className="px-3 py-3">
                                                Aktual
                                            </th>
                                            <th className="px-3 py-3">
                                                Forecast holdout
                                            </th>
                                            <th className="px-3 py-3">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {results.historical.map((row) => {
                                            const evaluation = evalRows.find(
                                                (item) =>
                                                    item.period === row.period,
                                            );
                                            return (
                                                <tr key={row.period}>
                                                    <th className="px-3 py-2">
                                                        {row.period}
                                                    </th>
                                                    <td className="px-3 py-2">
                                                        {fmt.format(row.actual)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {evaluation
                                                            ? fmt.format(
                                                                  evaluation.forecast,
                                                              )
                                                            : '—'}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {evaluation
                                                            ? fmt.format(
                                                                  evaluation.error,
                                                              )
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                    <section className="mt-8 border-t border-line pt-5">
                        <h2 className="text-lg font-semibold">Asumsi</h2>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
                            <li>
                                Periode historis berurutan, memiliki jarak yang
                                sama, dan satuan tetap.
                            </li>
                            <li>
                                Holdout adalah floor(20% × jumlah histori),
                                minimum satu periode; semua metode layak
                                dibandingkan pada rentang periode evaluasi yang
                                sama.
                            </li>
                            <li>
                                Naive memakai aktual terakhir; Moving Average
                                memakai jendela akhir dan proyeksi rekursif; WMA
                                memakai bobot tertua ke terbaru berjumlah 1; SES
                                memakai level awal aktual pertama; trend memakai
                                least-squares atas indeks waktu 0 hingga n−1.
                            </li>
                            <li>
                                MAPE tidak tersedia jika ada aktual nol. Nilai
                                permintaan negatif tidak diterima.
                            </li>
                        </ul>
                    </section>
                    <Link
                        href={`/projects/${project.id}/forecasting`}
                        className="mt-8 inline-flex min-h-12 items-center bg-accent px-5 font-semibold text-ink hover:bg-accent-strong"
                    >
                        Analisis baru →
                    </Link>
                </div>
            </main>
        </>
    );
}
