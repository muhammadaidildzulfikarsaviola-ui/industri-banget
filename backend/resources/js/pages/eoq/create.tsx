import { Head, Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
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
            <main className="min-h-screen bg-[#111210] px-4 py-6 text-[#e9e9e3] sm:px-6 sm:py-10 md:px-10">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-7 border-b border-[#30312c] pb-6">
                        <Link
                            href={`/projects/${project.id}`}
                            className="text-xs font-semibold tracking-[0.16em] text-[#a5a69d] hover:text-[#e8f06b] focus-visible:outline-2 focus-visible:outline-[#e8f06b]"
                        >
                            ← {project.name}
                        </Link>
                        <p className="mt-7 font-mono text-[10px] tracking-[0.2em] text-[#e8f06b]">
                            INVENTORY / EOQ
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Economic Order Quantity
                            <span className="text-[#e8f06b]">.</span>
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a5a69d]">
                            Model klasik untuk menyeimbangkan biaya pemesanan
                            dan penyimpanan pada proyek{' '}
                            <span className="text-[#e9e9e3]">
                                {project.name}
                            </span>
                            .
                        </p>
                    </header>

                    <div className="mb-6">
                        <FlashMessage flash={flash} />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[minmax(300px,400px)_1fr]">
                        <section
                            aria-labelledby="eoq-input-title"
                            className="h-fit border border-[#30312c] bg-[#171815] p-5 sm:p-6"
                        >
                            <p className="font-mono text-[10px] tracking-[0.16em] text-[#e8f06b]">
                                INPUT PARAMETERS
                            </p>
                            <h2
                                id="eoq-input-title"
                                className="mt-2 mb-5 text-lg font-semibold"
                            >
                                Data persediaan
                            </h2>
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="annual_demand"
                                        className="mb-2 block text-sm"
                                    >
                                        D · Permintaan tahunan{' '}
                                        <span className="text-[#92938a]">
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
                                        className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm outline-none focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                                    />
                                    <p
                                        id="annual_demand-help"
                                        className="mt-1 text-xs text-[#77786f]"
                                    >
                                        Total kebutuhan dalam satu tahun.
                                    </p>
                                    {errors.annual_demand && (
                                        <p
                                            id="annual_demand-error"
                                            role="alert"
                                            className="mt-1 text-sm text-red-300"
                                        >
                                            {errors.annual_demand}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="order_cost"
                                        className="mb-2 block text-sm"
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
                                        className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm outline-none focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                                    />
                                    <p
                                        id="order_cost-help"
                                        className="mt-1 text-xs text-[#77786f]"
                                    >
                                        Biaya setiap kali melakukan pemesanan.
                                    </p>
                                    {errors.order_cost && (
                                        <p
                                            id="order_cost-error"
                                            role="alert"
                                            className="mt-1 text-sm text-red-300"
                                        >
                                            {errors.order_cost}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="holding_cost"
                                        className="mb-2 block text-sm"
                                    >
                                        H · Biaya simpan per unit{' '}
                                        <span className="text-[#92938a]">
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
                                        className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm outline-none focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                                    />
                                    <p
                                        id="holding_cost-help"
                                        className="mt-1 text-xs text-[#77786f]"
                                    >
                                        Biaya menyimpan satu unit selama satu
                                        tahun.
                                    </p>
                                    {errors.holding_cost && (
                                        <p
                                            id="holding_cost-error"
                                            role="alert"
                                            className="mt-1 text-sm text-red-300"
                                        >
                                            {errors.holding_cost}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="currency_code"
                                        className="mb-2 block text-sm"
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
                                        className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm uppercase outline-none focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                                    />
                                    <p
                                        id="currency_code-help"
                                        className="mt-1 text-xs text-[#77786f]"
                                    >
                                        Kode tiga huruf; S dan H harus memakai
                                        mata uang yang sama.
                                    </p>
                                    {errors.currency_code && (
                                        <p
                                            id="currency_code-error"
                                            role="alert"
                                            className="mt-1 text-sm text-red-300"
                                        >
                                            {errors.currency_code}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="comparison_quantity"
                                        className="mb-2 block text-sm"
                                    >
                                        Kuantitas pembanding{' '}
                                        <span className="text-[#92938a]">
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
                                        className="min-h-11 w-full border border-[#45463e] bg-[#111210] px-3 text-sm outline-none focus-visible:border-[#e8f06b] focus-visible:ring-1 focus-visible:ring-[#e8f06b]"
                                    />
                                    <p
                                        id="comparison_quantity-help"
                                        className="mt-1 text-xs text-[#77786f]"
                                    >
                                        Bandingkan biaya tahunan pada kebijakan
                                        kuantitas saat ini.
                                    </p>
                                    {errors.comparison_quantity && (
                                        <p
                                            id="comparison_quantity-error"
                                            role="alert"
                                            className="mt-1 text-sm text-red-300"
                                        >
                                            {errors.comparison_quantity}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="min-h-11 w-full bg-[#e8f06b] px-4 text-sm font-semibold text-[#171815] hover:bg-[#f2f6a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8f06b] disabled:cursor-wait disabled:opacity-60"
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
                                className="border-y border-[#30312c] py-5"
                            >
                                <p className="font-mono text-[10px] tracking-[0.16em] text-[#e8f06b]">
                                    MODEL KLASIK
                                </p>
                                <h2
                                    id="eoq-model-title"
                                    className="mt-2 text-xl font-semibold"
                                >
                                    Kuantitas pesanan ekonomis
                                </h2>
                                <p className="mt-3 font-mono text-lg text-[#e9e9e3]">
                                    Q* = √(2DS / H)
                                </p>
                                <p className="mt-2 text-sm leading-6 text-[#a5a69d]">
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
                                    className="text-sm font-semibold"
                                >
                                    Asumsi dan batas model
                                </h2>
                                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#a5a69d]">
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
                                <div className="mb-3 flex items-center justify-between border-b border-[#30312c] pb-3">
                                    <h2
                                        id="recent-eoq-title"
                                        className="text-sm font-semibold"
                                    >
                                        Analisis EOQ terbaru
                                    </h2>
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className="text-xs text-[#e8f06b] hover:underline"
                                    >
                                        Semua riwayat →
                                    </Link>
                                </div>
                                {recentRuns.length === 0 ? (
                                    <p className="text-sm text-[#92938a]">
                                        Hasil tersimpan untuk proyek ini akan
                                        tampil di sini.
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-[#30312c]">
                                        {recentRuns.map((run) => (
                                            <li
                                                key={run.id}
                                                className="flex flex-wrap items-center justify-between gap-2 py-3"
                                            >
                                                <span className="text-sm">
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
                                                    className="text-xs text-[#e8f06b] hover:underline"
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
