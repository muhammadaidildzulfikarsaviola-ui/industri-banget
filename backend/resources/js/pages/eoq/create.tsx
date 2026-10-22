import { Head, Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { ThemeToggle } from '@/components/theme-toggle';
import type { AnalysisRun, FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    recentRuns: AnalysisRun[];
    flash?: FlashMessages;
};

type Inputs = {
    annual_demand: string;
    order_cost: string;
    holding_cost: string;
    currency_code: string;
    comparison_quantity: string;
};

export default function EoqCreate({ project, recentRuns, flash }: Props) {
    const { data, setData, post, processing, errors } = useForm<Inputs>({
        annual_demand: '',
        order_cost: '',
        holding_cost: '',
        currency_code: 'IDR',
        comparison_quantity: '',
    });

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post(`/projects/${project.id}/eoq`);
    }

    return (
        <>
            <Head title={`EOQ · ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-[1440px]">
                    <header className="mb-7 border-b border-line pb-6">
                        <div className="flex items-start justify-between gap-3">
                            <Link
                                href={`/projects/${project.id}`}
                                className="pt-2 text-base font-semibold tracking-[0.16em] text-muted hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-accent"
                            >
                                ← {project.name}
                            </Link>
                            <ThemeToggle />
                        </div>
                        <p className="mt-6 font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                            INVENTORY / EOQ
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight break-words sm:text-5xl">
                            Economic Order Quantity
                            <span className="text-accent-strong">.</span>
                        </h1>
                        <p className="mt-4 max-w-3xl text-lg leading-7 text-muted">
                            Model klasik untuk menyeimbangkan biaya pemesanan
                            dan penyimpanan pada proyek{' '}
                            <span className="text-ink">{project.name}</span>.
                        </p>
                    </header>

                    <div className="mb-6">
                        <FlashMessage flash={flash} />
                    </div>

                    <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(360px,460px)_minmax(0,1fr)] xl:gap-14">
                        <section
                            aria-labelledby="eoq-input-title"
                            className="h-fit border border-line bg-surface p-5 sm:p-7"
                        >
                            <p className="font-mono text-sm font-semibold tracking-[0.16em] text-accent-strong">
                                INPUT PARAMETERS
                            </p>
                            <h2
                                id="eoq-input-title"
                                className="mt-2 mb-6 text-2xl font-semibold"
                            >
                                Data persediaan
                            </h2>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="annual_demand"
                                        className="mb-2 block text-base"
                                    >
                                        D · Permintaan tahunan{' '}
                                        <span className="text-muted">
                                            (unit/tahun)
                                        </span>
                                    </label>
                                    <input
                                        id="annual_demand"
                                        type="number"
                                        min="0"
                                        step="any"
                                        inputMode="decimal"
                                        required
                                        value={data.annual_demand}
                                        onChange={(event) =>
                                            setData(
                                                'annual_demand',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            errors.annual_demand,
                                        )}
                                        aria-describedby={
                                            errors.annual_demand
                                                ? 'annual_demand-error'
                                                : 'annual_demand-help'
                                        }
                                        className="min-h-12 w-full border border-line-strong bg-canvas px-3 text-base outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
                                    />
                                    <p
                                        id="annual_demand-help"
                                        className="mt-1 text-base text-subtle"
                                    >
                                        Total kebutuhan dalam satu tahun.
                                    </p>
                                    {errors.annual_demand && (
                                        <p
                                            id="annual_demand-error"
                                            role="alert"
                                            className="mt-1 text-base text-danger"
                                        >
                                            {errors.annual_demand}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="order_cost"
                                        className="mb-2 block text-base"
                                    >
                                        S · Biaya per pesanan
                                    </label>
                                    <input
                                        id="order_cost"
                                        type="number"
                                        min="0"
                                        step="any"
                                        inputMode="decimal"
                                        required
                                        value={data.order_cost}
                                        onChange={(event) =>
                                            setData(
                                                'order_cost',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            errors.order_cost,
                                        )}
                                        aria-describedby={
                                            errors.order_cost
                                                ? 'order_cost-error'
                                                : 'order_cost-help'
                                        }
                                        className="min-h-12 w-full border border-line-strong bg-canvas px-3 text-base outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
                                    />
                                    <p
                                        id="order_cost-help"
                                        className="mt-1 text-base text-subtle"
                                    >
                                        Biaya setiap kali melakukan pemesanan.
                                    </p>
                                    {errors.order_cost && (
                                        <p
                                            id="order_cost-error"
                                            role="alert"
                                            className="mt-1 text-base text-danger"
                                        >
                                            {errors.order_cost}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="holding_cost"
                                        className="mb-2 block text-base"
                                    >
                                        H · Biaya simpan per unit{' '}
                                        <span className="text-muted">
                                            (per unit/tahun)
                                        </span>
                                    </label>
                                    <input
                                        id="holding_cost"
                                        type="number"
                                        min="0"
                                        step="any"
                                        inputMode="decimal"
                                        required
                                        value={data.holding_cost}
                                        onChange={(event) =>
                                            setData(
                                                'holding_cost',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            errors.holding_cost,
                                        )}
                                        aria-describedby={
                                            errors.holding_cost
                                                ? 'holding_cost-error'
                                                : 'holding_cost-help'
                                        }
                                        className="min-h-12 w-full border border-line-strong bg-canvas px-3 text-base outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
                                    />
                                    <p
                                        id="holding_cost-help"
                                        className="mt-1 text-base text-subtle"
                                    >
                                        Biaya menyimpan satu unit selama satu
                                        tahun.
                                    </p>
                                    {errors.holding_cost && (
                                        <p
                                            id="holding_cost-error"
                                            role="alert"
                                            className="mt-1 text-base text-danger"
                                        >
                                            {errors.holding_cost}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="currency_code"
                                        className="mb-2 block text-base"
                                    >
                                        Kode mata uang
                                    </label>
                                    <input
                                        id="currency_code"
                                        type="text"
                                        minLength={3}
                                        maxLength={3}
                                        pattern="[A-Za-z]{3}"
                                        required
                                        value={data.currency_code}
                                        onChange={(event) =>
                                            setData(
                                                'currency_code',
                                                event.target.value.toUpperCase(),
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            errors.currency_code,
                                        )}
                                        aria-describedby={
                                            errors.currency_code
                                                ? 'currency_code-error'
                                                : 'currency_code-help'
                                        }
                                        className="min-h-12 w-full border border-line-strong bg-canvas px-3 text-base uppercase outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
                                    />
                                    <p
                                        id="currency_code-help"
                                        className="mt-1 text-base text-subtle"
                                    >
                                        Kode tiga huruf; S dan H harus memakai
                                        mata uang yang sama.
                                    </p>
                                    {errors.currency_code && (
                                        <p
                                            id="currency_code-error"
                                            role="alert"
                                            className="mt-1 text-base text-danger"
                                        >
                                            {errors.currency_code}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="comparison_quantity"
                                        className="mb-2 block text-base"
                                    >
                                        Kuantitas pembanding{' '}
                                        <span className="text-muted">
                                            (opsional, unit/pesanan)
                                        </span>
                                    </label>
                                    <input
                                        id="comparison_quantity"
                                        type="number"
                                        min="0"
                                        step="any"
                                        inputMode="decimal"
                                        value={data.comparison_quantity}
                                        onChange={(event) =>
                                            setData(
                                                'comparison_quantity',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={Boolean(
                                            errors.comparison_quantity,
                                        )}
                                        aria-describedby={
                                            errors.comparison_quantity
                                                ? 'comparison_quantity-error'
                                                : 'comparison_quantity-help'
                                        }
                                        className="min-h-12 w-full border border-line-strong bg-canvas px-3 text-base outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent"
                                    />
                                    <p
                                        id="comparison_quantity-help"
                                        className="mt-1 text-base text-subtle"
                                    >
                                        Bandingkan biaya tahunan pada kebijakan
                                        kuantitas saat ini.
                                    </p>
                                    {errors.comparison_quantity && (
                                        <p
                                            id="comparison_quantity-error"
                                            role="alert"
                                            className="mt-1 text-base text-danger"
                                        >
                                            {errors.comparison_quantity}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="min-h-12 w-full bg-accent px-4 text-base font-semibold text-ink hover:bg-accent-strong hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60"
                                >
                                    {processing
                                        ? 'Menghitung dan menyimpan…'
                                        : 'Hitung dan simpan hasil →'}
                                </button>
                            </form>
                        </section>

                        <div className="space-y-8">
                            <section
                                aria-labelledby="eoq-model-title"
                                className="border-y border-line py-5"
                            >
                                <p className="font-mono text-base tracking-[0.16em] text-accent-strong">
                                    MODEL KLASIK
                                </p>
                                <h2
                                    id="eoq-model-title"
                                    className="mt-2 text-xl font-semibold"
                                >
                                    Kuantitas pesanan ekonomis
                                </h2>
                                <p className="mt-3 font-mono text-lg text-ink">
                                    Q* = √(2DS / H)
                                </p>
                                <p className="mt-2 text-base leading-6 text-muted">
                                    D adalah permintaan tahunan, S biaya
                                    pemesanan per pesanan, dan H biaya simpan
                                    per unit per tahun. Total biaya relevan
                                    hanya menjumlahkan biaya pemesanan dan
                                    penyimpanan; biaya pembelian barang tidak
                                    termasuk.
                                </p>
                            </section>
                            <section aria-labelledby="eoq-assumptions-title">
                                <h2
                                    id="eoq-assumptions-title"
                                    className="text-base font-semibold"
                                >
                                    Asumsi dan batas model
                                </h2>
                                <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-6 text-muted">
                                    <li>
                                        Permintaan tahunan relatif stabil dan
                                        dapat diperkirakan.
                                    </li>
                                    <li>
                                        Biaya pemesanan dan biaya simpan per
                                        unit tetap selama periode analisis.
                                    </li>
                                    <li>
                                        Model dasar mengasumsikan pengisian
                                        ulang diterima sekaligus dan tidak
                                        memodelkan kekurangan stok.
                                    </li>
                                    <li>
                                        Lead time tidak mengubah EOQ; titik
                                        pemesanan ulang harus dianalisis
                                        terpisah.
                                    </li>
                                    <li>
                                        Diskon kuantitas, batas kapasitas, dan
                                        variasi permintaan tidak termasuk.
                                    </li>
                                </ul>
                            </section>
                            <section aria-labelledby="recent-eoq-title">
                                <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
                                    <h2
                                        id="recent-eoq-title"
                                        className="text-base font-semibold"
                                    >
                                        Analisis EOQ terbaru
                                    </h2>
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-base text-accent-strong hover:underline"
                                    >
                                        Semua riwayat →
                                    </Link>
                                </div>
                                {recentRuns.length === 0 ? (
                                    <p className="text-base text-muted">
                                        Hasil tersimpan untuk proyek ini akan
                                        tampil di sini.
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-line">
                                        {recentRuns.map((run) => (
                                            <li
                                                key={run.id}
                                                className="flex flex-wrap items-center justify-between gap-2 py-3"
                                            >
                                                <span className="text-base">
                                                    EOQ ·{' '}
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                        {
                                                            maximumFractionDigits: 2,
                                                        },
                                                    ).format(
                                                        run.results.eoq,
                                                    )}{' '}
                                                    unit
                                                </span>
                                                <Link
                                                    href={`/projects/${project.id}/analyses/${run.id}`}
                                                    className="text-base text-accent-strong hover:underline"
                                                >
                                                    Buka ·{' '}
                                                    {new Intl.DateTimeFormat(
                                                        'id-ID',
                                                        { dateStyle: 'medium' },
                                                    ).format(
                                                        new Date(
                                                            run.created_at,
                                                        ),
                                                    )}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
