import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { ForecastMethod } from '@/types/forecasting';
import type { AnalysisRun, FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    recentRuns: Extract<AnalysisRun, { type: 'forecasting' }>[];
    flash?: FlashMessages;
};
const methods: { id: ForecastMethod; label: string }[] = [
    { id: 'naive', label: 'Naive Forecast' },
    { id: 'moving_average', label: 'Moving Average' },
    { id: 'weighted_moving_average', label: 'Weighted Moving Average' },
    {
        id: 'single_exponential_smoothing',
        label: 'Single Exponential Smoothing',
    },
    { id: 'linear_trend', label: 'Linear Trend Projection' },
];
const fieldClass =
    'mt-1 min-h-12 w-full border border-line-strong bg-surface px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

export default function ForecastingCreate({
    project,
    recentRuns,
    flash,
}: Props) {
    const form = useForm<{
        analysis_name: string;
        unit: string;
        interval: 'daily' | 'weekly' | 'monthly';
        horizon: number;
        methods: ForecastMethod[];
        history: { period: string; actual: number | '' }[];
        moving_average_window: number;
        weighted_moving_average_weights: number[];
        alpha: number;
    }>({
        analysis_name: 'Forecast permintaan',
        unit: 'unit',
        interval: 'monthly' as 'daily' | 'weekly' | 'monthly',
        horizon: 3,
        methods: [
            'naive',
            'moving_average',
            'single_exponential_smoothing',
            'linear_trend',
        ] as ForecastMethod[],
        history: [
            { period: '', actual: '' },
            { period: '', actual: '' },
            { period: '', actual: '' },
        ],
        moving_average_window: 3,
        weighted_moving_average_weights: [0.2, 0.3, 0.5],
        alpha: 0.3,
    });
    const [weightsText, setWeightsText] = useState('0.2, 0.3, 0.5');
    const toggleMethod = (method: ForecastMethod) =>
        form.setData(
            'methods',
            form.data.methods.includes(method)
                ? form.data.methods.filter((item) => item !== method)
                : [...form.data.methods, method],
        );

    return (
        <>
            <Head title={`Forecasting · ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-8 border-b border-line pb-6">
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
                            ANALISIS / FORECASTING
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            Peramalan permintaan
                        </h1>
                        <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
                            Masukkan deret waktu berurutan. Metode dibandingkan
                            pada holdout akhir yang sama; hasil adalah ringkasan
                            historis, bukan jaminan akurasi masa depan.
                        </p>
                    </header>
                    <FlashMessage flash={flash} />
                    {Object.keys(form.errors).length > 0 && (
                        <div
                            role="alert"
                            aria-label="Kesalahan validasi"
                            className="mt-4 border border-danger-line bg-danger-soft p-4 text-danger"
                        >
                            <p className="font-semibold">
                                Periksa kembali input berikut:
                            </p>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                                {Object.entries(form.errors).map(
                                    ([field, message]) => (
                                        <li key={field}>
                                            {field}: {message}
                                        </li>
                                    ),
                                )}
                            </ul>
                        </div>
                    )}
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.transform((data) => ({
                                ...data,
                                weighted_moving_average_weights: weightsText
                                    .split(',')
                                    .map((value) => Number(value.trim())),
                            }));
                            form.post(`/projects/${project.id}/forecasting`);
                        }}
                        className="mt-6 space-y-7"
                    >
                        <section className="grid gap-5 border-y border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="text-sm font-semibold">
                                Nama analisis
                                <input
                                    className={fieldClass}
                                    value={form.data.analysis_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'analysis_name',
                                            e.target.value,
                                        )
                                    }
                                />
                                {form.errors.analysis_name && (
                                    <span className="text-danger">
                                        {form.errors.analysis_name}
                                    </span>
                                )}
                            </label>
                            <label className="text-sm font-semibold">
                                Satuan
                                <input
                                    className={fieldClass}
                                    value={form.data.unit}
                                    onChange={(e) =>
                                        form.setData('unit', e.target.value)
                                    }
                                />
                                {form.errors.unit && (
                                    <span className="text-danger">
                                        {form.errors.unit}
                                    </span>
                                )}
                            </label>
                            <label className="text-sm font-semibold">
                                Interval
                                <select
                                    className={fieldClass}
                                    value={form.data.interval}
                                    onChange={(e) =>
                                        form.setData(
                                            'interval',
                                            e.target
                                                .value as typeof form.data.interval,
                                        )
                                    }
                                >
                                    <option value="daily">Harian</option>
                                    <option value="weekly">
                                        Mingguan (ISO)
                                    </option>
                                    <option value="monthly">Bulanan</option>
                                </select>
                            </label>
                            <label className="text-sm font-semibold">
                                Horizon (periode)
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    className={fieldClass}
                                    value={form.data.horizon}
                                    onChange={(e) =>
                                        form.setData(
                                            'horizon',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                                {form.errors.horizon && (
                                    <span className="text-danger">
                                        {form.errors.horizon}
                                    </span>
                                )}
                            </label>
                        </section>
                        <section className="border-y border-line py-5">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        Data historis
                                    </h2>
                                    <p className="mt-1 text-sm text-muted">
                                        Periode harus berurutan dan tidak boleh
                                        ada celah. Format tanggal mengikuti
                                        interval.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData('history', [
                                            ...form.data.history,
                                            {
                                                period: '',
                                                actual: '',
                                            },
                                        ])
                                    }
                                    className="min-h-11 border border-line-strong px-4 font-medium hover:border-accent"
                                >
                                    Tambah periode
                                </button>
                            </div>
                            <div className="space-y-3">
                                {form.data.history.map((row, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-[1fr_1fr_auto] items-end gap-3"
                                    >
                                        <label className="text-sm font-semibold">
                                            Periode {index + 1}
                                            <input
                                                aria-label={`Periode ${index + 1}`}
                                                placeholder={
                                                    form.data.interval ===
                                                    'daily'
                                                        ? '2025-01-31'
                                                        : form.data.interval ===
                                                            'weekly'
                                                          ? '2025-W05'
                                                          : '2025-01'
                                                }
                                                className={fieldClass}
                                                value={row.period}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'history',
                                                        form.data.history.map(
                                                            (item, i) =>
                                                                i === index
                                                                    ? {
                                                                          ...item,
                                                                          period: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : item,
                                                        ),
                                                    )
                                                }
                                            />
                                        </label>
                                        <label className="text-sm font-semibold">
                                            Aktual ({form.data.unit || 'unit'})
                                            <input
                                                aria-label={`Aktual periode ${index + 1}`}
                                                type="number"
                                                min="0"
                                                step="any"
                                                className={fieldClass}
                                                value={row.actual}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'history',
                                                        form.data.history.map(
                                                            (item, i) =>
                                                                i === index
                                                                    ? {
                                                                          ...item,
                                                                          actual:
                                                                              e
                                                                                  .target
                                                                                  .value ===
                                                                              ''
                                                                                  ? ''
                                                                                  : Number(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ),
                                                                      }
                                                                    : item,
                                                        ),
                                                    )
                                                }
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            disabled={
                                                form.data.history.length <= 3
                                            }
                                            onClick={() =>
                                                form.setData(
                                                    'history',
                                                    form.data.history.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                            aria-label={`Hapus periode ${index + 1}`}
                                            className="mb-px min-h-12 border border-danger-line px-3 text-danger disabled:opacity-40"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {Object.entries(form.errors)
                                .filter(([key]) => key.startsWith('history'))
                                .map(([key, error]) => (
                                    <p
                                        key={key}
                                        className="mt-2 text-sm text-danger"
                                    >
                                        {key}: {error}
                                    </p>
                                ))}
                        </section>
                        <section className="grid gap-6 border-y border-line bg-surface p-5 lg:grid-cols-2">
                            <fieldset>
                                <legend className="text-lg font-semibold">
                                    Metode yang dibandingkan
                                </legend>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    {methods.map(({ id, label }) => (
                                        <label key={id} className="flex gap-3">
                                            <input
                                                type="checkbox"
                                                checked={form.data.methods.includes(
                                                    id,
                                                )}
                                                onChange={() =>
                                                    toggleMethod(id)
                                                }
                                                className="mt-1 size-5 shrink-0 accent-accent-strong"
                                            />
                                            <span>
                                                <span className="font-medium">
                                                    {label}
                                                </span>
                                                <span className="block text-sm leading-6 font-normal text-muted">
                                                    {id === 'naive' &&
                                                        'Mengulang aktual terakhir; baseline sederhana.'}
                                                    {id === 'moving_average' &&
                                                        'Merata-ratakan k observasi terakhir; proyeksi multi-periode memakai forecast sebelumnya.'}
                                                    {id ===
                                                        'weighted_moving_average' &&
                                                        'Memberi bobot berbeda pada jendela, dari observasi tertua ke terbaru.'}
                                                    {id ===
                                                        'single_exponential_smoothing' &&
                                                        'Memuluskan level; alpha tinggi memberi respons lebih pada observasi terbaru.'}
                                                    {id === 'linear_trend' &&
                                                        'Memasang garis least-squares pada indeks waktu dan meneruskan tren linear.'}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {form.errors.methods && (
                                    <p className="mt-2 text-danger">
                                        {form.errors.methods}
                                    </p>
                                )}
                            </fieldset>
                            <div className="space-y-4">
                                <label className="block text-sm font-semibold">
                                    Jendela Moving Average
                                    <input
                                        type="number"
                                        min="1"
                                        className={fieldClass}
                                        value={form.data.moving_average_window}
                                        onChange={(e) =>
                                            form.setData(
                                                'moving_average_window',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </label>
                                <label className="block text-sm font-semibold">
                                    Bobot Weighted Moving Average
                                    <input
                                        className={fieldClass}
                                        value={weightsText}
                                        onChange={(e) => {
                                            setWeightsText(e.target.value);
                                            form.setData(
                                                'weighted_moving_average_weights',
                                                e.target.value
                                                    .split(',')
                                                    .map((value) =>
                                                        Number(value.trim()),
                                                    ),
                                            );
                                        }}
                                    />
                                    <span className="mt-1 block font-normal text-muted">
                                        Dari observasi tertua ke terbaru; setiap
                                        bobot ≥ 0 dan jumlahnya 1.
                                    </span>
                                    {form.errors
                                        .weighted_moving_average_weights && (
                                        <span className="text-danger">
                                            {
                                                form.errors
                                                    .weighted_moving_average_weights
                                            }
                                        </span>
                                    )}
                                </label>
                                <label className="block text-sm font-semibold">
                                    Alpha (Single Exponential Smoothing)
                                    <input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="any"
                                        className={fieldClass}
                                        value={form.data.alpha}
                                        onChange={(e) =>
                                            form.setData(
                                                'alpha',
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                    <span className="mt-1 block font-normal text-muted">
                                        Nilai antara 0 dan 1.
                                    </span>
                                </label>
                            </div>
                        </section>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                disabled={form.processing}
                                className="min-h-12 bg-accent px-5 font-semibold text-ink hover:bg-accent-strong disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Menghitung…'
                                    : 'Hitung dan simpan forecast'}
                            </button>
                            <Link
                                href={`/projects/${project.id}`}
                                className="inline-flex min-h-12 items-center border border-line-strong px-5"
                            >
                                Kembali ke proyek
                            </Link>
                        </div>
                    </form>
                    <section className="mt-12 border-t border-line pt-5">
                        <h2 className="text-xl font-semibold">
                            Forecast terbaru
                        </h2>
                        {recentRuns.length === 0 ? (
                            <p className="mt-3 text-muted">
                                Belum ada hasil tersimpan.
                            </p>
                        ) : (
                            <ul className="mt-3 divide-y divide-line">
                                {recentRuns.map((run) => (
                                    <li
                                        key={run.id}
                                        className="flex justify-between gap-3 py-3"
                                    >
                                        <span>{run.inputs.analysis_name}</span>
                                        <Link
                                            className="text-accent-strong hover:underline"
                                            href={`/projects/${project.id}/analyses/${run.id}`}
                                        >
                                            Buka hasil →
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
