import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { SpcChartType } from '@/types/spc';
import type { AnalysisRun, FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    recentRuns: Extract<AnalysisRun, { type: 'spc' }>[];
    flash?: FlashMessages;
};
type CountRow = {
    defects: number;
    sample_size?: number;
    opportunities?: number;
};
type FormData = {
    analysis_name: string;
    characteristic: string;
    unit: string;
    chart_type: SpcChartType;
    observations: (number | CountRow)[];
    subgroups: number[][];
    labels: string[];
};
const charts: { type: SpcChartType; label: string; hint: string }[] = [
    {
        type: 'imr',
        label: 'I-MR',
        hint: 'Observasi individual, satu angka per baris.',
    },
    {
        type: 'xbar_r',
        label: 'X-bar R',
        hint: 'Satu subgroup per baris; angka dipisahkan koma. Ukuran tetap 2–10.',
    },
    {
        type: 'p',
        label: 'p-chart',
        hint: 'Satu baris per sampel: jumlah unit cacat, ukuran sampel.',
    },
    {
        type: 'np',
        label: 'np-chart',
        hint: 'Satu baris per sampel: jumlah unit cacat, ukuran sampel tetap.',
    },
    {
        type: 'c',
        label: 'c-chart',
        hint: 'Satu angka defect per baris; area peluang harus konstan.',
    },
    {
        type: 'u',
        label: 'u-chart',
        hint: 'Satu baris per sampel: jumlah defect, jumlah unit/peluang.',
    },
];
const fieldClass =
    'mt-1 min-h-12 w-full border border-line-strong bg-surface px-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-accent';
const parseLines = (value: string) =>
    value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
const parseLabelLines = (value: string) =>
    value.trim() === '' ? [] : value.split(/\r?\n/).map((line) => line.trim());
const parseNumbers = (value: string) =>
    parseLines(value).map((line) => Number(line));
const parsePairs = (value: string, chartType: SpcChartType): CountRow[] =>
    parseLines(value).map((line) => {
        const [defects, size] = line.split(/[\s,;]+/).map(Number);
        return chartType === 'u'
            ? { defects, opportunities: size }
            : { defects, sample_size: size };
    });

export default function SpcCreate({ project, recentRuns, flash }: Props) {
    const form = useForm<FormData>({
        analysis_name: 'Analisis kualitas',
        characteristic: '',
        unit: '',
        chart_type: 'imr',
        observations: [0, 0],
        subgroups: [
            [0, 0],
            [0, 0],
        ],
        labels: [],
    });
    const [dataText, setDataText] = useState('');
    const [labelsText, setLabelsText] = useState('');
    const selected = charts.find(
        (chart) => chart.type === form.data.chart_type,
    )!;
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const data =
            form.data.chart_type === 'xbar_r'
                ? {
                      ...form.data,
                      subgroups: parseLines(dataText).map((line) =>
                          line.split(/[\s,;]+/).map(Number),
                      ),
                      observations: [],
                  }
                : {
                      ...form.data,
                      observations:
                          form.data.chart_type === 'imr' ||
                          form.data.chart_type === 'c'
                              ? parseNumbers(dataText)
                              : parsePairs(dataText, form.data.chart_type),
                      subgroups: [],
                  };
        data.labels = parseLabelLines(labelsText);
        form.transform(() => data);
        form.post(`/projects/${project.id}/spc`, {
            onFinish: () => form.transform((values) => values),
        });
    };
    const inputError = Object.entries(form.errors).map(
        ([field, message]) => `${field}: ${message}`,
    );

    return (
        <>
            <Head title={`SPC · ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-6xl">
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
                            QUALITY ENGINEERING / SPC
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            Statistical Process Control
                        </h1>
                        <p className="mt-3 max-w-3xl text-muted">
                            Pilih chart sesuai tipe data dan asumsi proses.
                            Batas kontrol menunjukkan variasi proses; batas
                            spesifikasi produk tidak dihitung di sini.
                        </p>
                    </header>
                    <div className="mb-5">
                        <FlashMessage flash={flash} />
                        {inputError.length > 0 && (
                            <div
                                role="alert"
                                className="mt-3 border border-danger-line bg-danger-soft px-4 py-3 text-danger"
                            >
                                {inputError.map((error) => (
                                    <p key={error}>{error}</p>
                                ))}
                            </div>
                        )}
                    </div>
                    <form onSubmit={submit} className="space-y-7">
                        <section className="grid gap-5 border-y border-line bg-surface p-5 sm:grid-cols-3 sm:p-7">
                            <label className="text-sm font-semibold">
                                Nama analisis
                                <input
                                    className={fieldClass}
                                    maxLength={100}
                                    required
                                    value={form.data.analysis_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'analysis_name',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="text-sm font-semibold">
                                Karakteristik kualitas
                                <input
                                    className={fieldClass}
                                    maxLength={100}
                                    required
                                    placeholder="Contoh: diameter"
                                    value={form.data.characteristic}
                                    onChange={(event) =>
                                        form.setData(
                                            'characteristic',
                                            event.target.value,
                                        )
                                    }
                                />
                            </label>
                            <label className="text-sm font-semibold">
                                Satuan
                                <input
                                    className={fieldClass}
                                    maxLength={30}
                                    required
                                    placeholder="mm, unit cacat/unit"
                                    value={form.data.unit}
                                    onChange={(event) =>
                                        form.setData('unit', event.target.value)
                                    }
                                />
                            </label>
                            <label className="text-sm font-semibold sm:col-span-3">
                                Control chart
                                <select
                                    className={fieldClass}
                                    value={form.data.chart_type}
                                    onChange={(event) =>
                                        form.setData(
                                            'chart_type',
                                            event.target.value as SpcChartType,
                                        )
                                    }
                                >
                                    {charts.map((chart) => (
                                        <option
                                            key={chart.type}
                                            value={chart.type}
                                        >
                                            {chart.label}
                                        </option>
                                    ))}
                                </select>
                                <span className="mt-1 block font-normal text-muted">
                                    {selected.hint}
                                </span>
                            </label>
                            <label className="text-sm font-semibold sm:col-span-3">
                                Data sampel
                                <textarea
                                    className={`${fieldClass} min-h-44 py-3 font-mono text-sm`}
                                    required
                                    value={dataText}
                                    onChange={(event) =>
                                        setDataText(event.target.value)
                                    }
                                    placeholder={
                                        form.data.chart_type === 'xbar_r'
                                            ? '10.1, 10.3, 10.2\n10.4, 10.1, 10.2'
                                            : form.data.chart_type === 'p' ||
                                                form.data.chart_type === 'np' ||
                                                form.data.chart_type === 'u'
                                              ? '2, 100\n4, 120\n1, 80'
                                              : '10.1\n10.3\n10.2\n10.4'
                                    }
                                />
                                <span className="mt-1 block font-normal text-muted">
                                    {form.data.chart_type === 'xbar_r'
                                        ? 'Pisahkan nilai dalam satu subgroup dengan koma, titik koma, atau spasi; setiap baris adalah subgroup.'
                                        : ['p', 'np', 'u'].includes(
                                                form.data.chart_type,
                                            )
                                          ? 'Format: jumlah cacat, ukuran sampel/peluang. Gunakan satu baris untuk setiap titik.'
                                          : 'Gunakan satu angka per baris. Nilai harus numerik, hingga, dan tidak negatif.'}
                                </span>
                            </label>
                            <label className="text-sm font-semibold sm:col-span-3">
                                Label titik (opsional)
                                <textarea
                                    className={`${fieldClass} min-h-24 py-3`}
                                    value={labelsText}
                                    onChange={(event) =>
                                        setLabelsText(event.target.value)
                                    }
                                    placeholder={'Lot 1\nLot 2\nLot 3'}
                                />
                                <span className="mt-1 block font-normal text-muted">
                                    Satu label per baris, mengikuti urutan data.
                                    Label kosong akan dibuat otomatis.
                                </span>
                            </label>
                        </section>
                        <div className="flex flex-wrap gap-3">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="min-h-12 bg-accent px-5 font-semibold text-ink hover:bg-accent-strong hover:text-surface disabled:opacity-50"
                            >
                                {form.processing
                                    ? 'Menghitung…'
                                    : 'Hitung dan simpan control chart'}
                            </button>
                            <Link
                                href={`/projects/${project.id}`}
                                className="inline-flex min-h-12 items-center border border-line-strong px-5 font-medium hover:bg-surface"
                            >
                                Kembali ke proyek
                            </Link>
                        </div>
                    </form>
                    <section
                        className="mt-12"
                        aria-labelledby="spc-history-title"
                    >
                        <div className="mb-4 border-b border-line pb-3">
                            <p className="font-mono text-sm tracking-[0.15em] text-accent-strong">
                                SNAPSHOT HISTORY
                            </p>
                            <h2
                                id="spc-history-title"
                                className="text-xl font-semibold"
                            >
                                Riwayat analisis SPC
                            </h2>
                        </div>
                        {recentRuns.length === 0 ? (
                            <p className="border border-dashed border-line-strong px-5 py-8 text-muted">
                                Belum ada control chart tersimpan.
                            </p>
                        ) : (
                            <ul className="divide-y divide-line border-y border-line">
                                {recentRuns.map((run) => (
                                    <li
                                        key={run.id}
                                        className="flex flex-wrap items-center justify-between gap-3 py-4"
                                    >
                                        <div>
                                            <p className="font-semibold">
                                                {run.inputs.analysis_name} ·{' '}
                                                {run.inputs.chart_type.toUpperCase()}
                                            </p>
                                            <p className="text-sm text-muted">
                                                {run.inputs.characteristic} ·{' '}
                                                {new Intl.DateTimeFormat(
                                                    'id-ID',
                                                    {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short',
                                                    },
                                                ).format(
                                                    new Date(run.created_at),
                                                )}
                                            </p>
                                        </div>
                                        <Link
                                            className="font-medium text-accent-strong underline-offset-4 hover:underline"
                                            href={`/projects/${project.id}/analyses/${run.id}`}
                                        >
                                            Buka snapshot →
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
