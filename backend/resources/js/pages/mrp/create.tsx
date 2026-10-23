import { Head, Link, useForm } from '@inertiajs/react';
import { FlashMessage } from '@/components/flash-message';
import { MrpBomRow } from '@/components/mrp-bom-row';
import { MrpItemRow } from '@/components/mrp-item-row';
import { WorkspaceActions } from '@/components/workspace-actions';
import type { MrpBomLine, MrpItem } from '@/types/mrp';
import type { AnalysisRun, FlashMessages, Project } from '@/types/project';

type Props = {
    project: Project;
    items: MrpItem[];
    bomLines: MrpBomLine[];
    recentRuns: Extract<AnalysisRun, { type: 'mrp' }>[];
    flash?: FlashMessages;
};
const inputClass =
    'mt-1 min-h-11 w-full border border-line-strong bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-accent';
type QuantityRow = {
    item_id: number | '';
    period: string;
    quantity: number | '';
};

export default function MrpCreate({
    project,
    items,
    bomLines,
    recentRuns,
    flash,
}: Props) {
    const itemForm = useForm({
        code: '',
        name: '',
        unit: 'unit',
        lead_time_periods: 0,
        initial_on_hand: 0,
        lot_sizing_policy: 'lot_for_lot' as
            | 'lot_for_lot'
            | 'fixed_order_quantity',
        fixed_order_quantity: '' as number | '',
    });
    const bomForm = useForm({
        parent_item_id: '' as number | '',
        component_item_id: '' as number | '',
        quantity_per: '' as number | '',
    });
    const planForm = useForm({
        plan_name: 'Rencana MRP',
        period_count: 6,
        mps: [
            {
                item_id: '' as number | '',
                period: 'P1',
                quantity: '' as number | '',
            },
        ],
        scheduled_receipts: [] as QuantityRow[],
    });
    const periods = Array.from(
        { length: planForm.data.period_count },
        (_, index) => `P${index + 1}`,
    );
    const errorEntries = (
        form: typeof itemForm | typeof bomForm | typeof planForm,
    ) => Object.entries(form.errors);

    return (
        <>
            <Head title={`MRP · ${project.name}`} />
            <main className="min-h-screen bg-canvas px-4 py-7 text-ink sm:px-6 sm:py-10 lg:px-10">
                <div className="mx-auto max-w-7xl">
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
                            ANALISIS / MRP
                        </p>
                        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                            Material Requirements Planning
                        </h1>
                        <p className="mt-3 max-w-4xl text-base leading-7 text-muted">
                            Kelola item dan BOM untuk proyek ini, lalu buat
                            rencana berbasis bucket periode P1 sampai horizon.
                            Lead time dinyatakan dalam jumlah bucket yang sama.
                        </p>
                    </header>
                    <FlashMessage flash={flash} />
                    <section className="mt-7 border-y border-line py-5">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">
                                Master item proyek
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                Kode item unik dalam proyek. Master tidak
                                dibagikan ke proyek lain.
                            </p>
                        </div>
                        {items.length === 0 ? (
                            <p className="mb-4 border border-dashed border-line-strong p-4 text-muted">
                                Belum ada item MRP pada proyek ini.
                            </p>
                        ) : (
                            <div className="divide-y divide-line border-y border-line">
                                {items.map((item) => (
                                    <MrpItemRow
                                        key={item.id}
                                        projectId={project.id}
                                        item={item}
                                    />
                                ))}
                            </div>
                        )}
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                itemForm.post(
                                    `/projects/${project.id}/mrp/items`,
                                    {
                                        onSuccess: () =>
                                            itemForm.reset('code', 'name'),
                                    },
                                );
                            }}
                            className="mt-5 grid gap-3 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <h3 className="text-lg font-semibold sm:col-span-2 lg:col-span-4">
                                Tambah item
                            </h3>
                            <label className="text-sm font-medium">
                                Kode
                                <input
                                    required
                                    maxLength={50}
                                    className={inputClass}
                                    value={itemForm.data.code}
                                    onChange={(e) =>
                                        itemForm.setData('code', e.target.value)
                                    }
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Nama
                                <input
                                    required
                                    maxLength={150}
                                    className={inputClass}
                                    value={itemForm.data.name}
                                    onChange={(e) =>
                                        itemForm.setData('name', e.target.value)
                                    }
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Satuan
                                <input
                                    required
                                    maxLength={30}
                                    className={inputClass}
                                    value={itemForm.data.unit}
                                    onChange={(e) =>
                                        itemForm.setData('unit', e.target.value)
                                    }
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Lead time (periode)
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    max="32767"
                                    className={inputClass}
                                    value={itemForm.data.lead_time_periods}
                                    onChange={(e) =>
                                        itemForm.setData(
                                            'lead_time_periods',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Persediaan awal
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="any"
                                    className={inputClass}
                                    value={itemForm.data.initial_on_hand}
                                    onChange={(e) =>
                                        itemForm.setData(
                                            'initial_on_hand',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Lot sizing
                                <select
                                    className={inputClass}
                                    value={itemForm.data.lot_sizing_policy}
                                    onChange={(e) =>
                                        itemForm.setData(
                                            'lot_sizing_policy',
                                            e.target
                                                .value as typeof itemForm.data.lot_sizing_policy,
                                        )
                                    }
                                >
                                    <option value="lot_for_lot">
                                        Lot-for-Lot
                                    </option>
                                    <option value="fixed_order_quantity">
                                        Fixed Order Quantity
                                    </option>
                                </select>
                            </label>
                            {itemForm.data.lot_sizing_policy ===
                                'fixed_order_quantity' && (
                                <label className="text-sm font-medium">
                                    Kuantitas tetap
                                    <input
                                        required
                                        type="number"
                                        min="0.0001"
                                        step="any"
                                        className={inputClass}
                                        value={
                                            itemForm.data.fixed_order_quantity
                                        }
                                        onChange={(e) =>
                                            itemForm.setData(
                                                'fixed_order_quantity',
                                                e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value),
                                            )
                                        }
                                    />
                                </label>
                            )}
                            <div className="flex items-end">
                                <button
                                    disabled={itemForm.processing}
                                    className="min-h-11 bg-accent px-4 font-semibold text-ink disabled:opacity-50"
                                >
                                    Tambah item
                                </button>
                            </div>
                            {errorEntries(itemForm).map(([field, message]) => (
                                <p key={field} className="text-sm text-danger">
                                    {field}: {message}
                                </p>
                            ))}
                        </form>
                    </section>
                    <section className="mt-8 border-y border-line py-5">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">
                                Bill of Materials
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                Siklus BOM dan hubungan lintas proyek ditolak.
                                Hapus baris yang dipakai sebelum menghapus item.
                            </p>
                        </div>
                        {bomLines.length === 0 ? (
                            <p className="mb-4 border border-dashed border-line-strong p-4 text-muted">
                                Belum ada struktur BOM. Item tanpa komponen
                                tetap dapat dijadwalkan sebagai produk akhir.
                            </p>
                        ) : (
                            <div className="divide-y divide-line border-y border-line">
                                {bomLines.map((line) => (
                                    <MrpBomRow
                                        key={line.id}
                                        projectId={project.id}
                                        line={line}
                                        items={items}
                                    />
                                ))}
                            </div>
                        )}
                        {items.length >= 2 && (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    bomForm.post(
                                        `/projects/${project.id}/mrp/bom`,
                                        {
                                            onSuccess: () =>
                                                bomForm.reset('quantity_per'),
                                        },
                                    );
                                }}
                                className="mt-5 grid gap-3 bg-surface p-4 sm:grid-cols-3"
                            >
                                <h3 className="text-lg font-semibold sm:col-span-3">
                                    Tambah relasi komponen
                                </h3>
                                <label className="text-sm font-medium">
                                    Item induk
                                    <select
                                        required
                                        className={inputClass}
                                        value={bomForm.data.parent_item_id}
                                        onChange={(e) =>
                                            bomForm.setData(
                                                'parent_item_id',
                                                Number(e.target.value),
                                            )
                                        }
                                    >
                                        <option value="">Pilih item</option>
                                        {items.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code} · {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm font-medium">
                                    Komponen
                                    <select
                                        required
                                        className={inputClass}
                                        value={bomForm.data.component_item_id}
                                        onChange={(e) =>
                                            bomForm.setData(
                                                'component_item_id',
                                                Number(e.target.value),
                                            )
                                        }
                                    >
                                        <option value="">Pilih item</option>
                                        {items.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {item.code} · {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-sm font-medium">
                                    Kuantitas per unit induk
                                    <input
                                        required
                                        type="number"
                                        min="0.0001"
                                        step="any"
                                        className={inputClass}
                                        value={bomForm.data.quantity_per}
                                        onChange={(e) =>
                                            bomForm.setData(
                                                'quantity_per',
                                                e.target.value === ''
                                                    ? ''
                                                    : Number(e.target.value),
                                            )
                                        }
                                    />
                                </label>
                                <div className="sm:col-span-3">
                                    <button
                                        disabled={bomForm.processing}
                                        className="min-h-11 bg-accent px-4 font-semibold text-ink"
                                    >
                                        Tambah komponen
                                    </button>
                                </div>
                                {errorEntries(bomForm).map(
                                    ([field, message]) => (
                                        <p
                                            key={field}
                                            className="text-sm text-danger"
                                        >
                                            {field}: {message}
                                        </p>
                                    ),
                                )}
                            </form>
                        )}
                    </section>
                    <section className="mt-8 border-y border-line py-5">
                        <h2 className="text-xl font-semibold">Rencana MRP</h2>
                        <p className="mt-1 text-sm leading-6 text-muted">
                            Masukkan Master Production Schedule untuk item yang
                            direncanakan. Scheduled receipts opsional. Baris
                            pada rencana disimpan sebagai snapshot agar hasil
                            lama tetap sama saat master berubah.
                        </p>
                        {items.length > 0 ? (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    planForm.post(
                                        `/projects/${project.id}/mrp`,
                                    );
                                }}
                                className="mt-4 space-y-5 bg-surface p-4"
                            >
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="text-sm font-medium">
                                        Nama rencana
                                        <input
                                            required
                                            maxLength={100}
                                            className={inputClass}
                                            value={planForm.data.plan_name}
                                            onChange={(e) =>
                                                planForm.setData(
                                                    'plan_name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                    <label className="text-sm font-medium">
                                        Jumlah periode
                                        <input
                                            required
                                            type="number"
                                            min="1"
                                            max="36"
                                            className={inputClass}
                                            value={planForm.data.period_count}
                                            onChange={(e) => {
                                                const count = Number(
                                                    e.target.value,
                                                );
                                                planForm.setData((data) => ({
                                                    ...data,
                                                    period_count: count,
                                                }));
                                            }}
                                        />
                                    </label>
                                </div>
                                <fieldset>
                                    <legend className="font-semibold">
                                        Master Production Schedule
                                    </legend>
                                    <div className="mt-2 space-y-3">
                                        {planForm.data.mps.map((row, index) => (
                                            <div
                                                key={index}
                                                className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                                            >
                                                <label className="text-sm">
                                                    Item
                                                    <select
                                                        required
                                                        className={inputClass}
                                                        value={row.item_id}
                                                        onChange={(e) =>
                                                            planForm.setData(
                                                                'mps',
                                                                planForm.data.mps.map(
                                                                    (
                                                                        item,
                                                                        i,
                                                                    ) =>
                                                                        i ===
                                                                        index
                                                                            ? {
                                                                                  ...item,
                                                                                  item_id:
                                                                                      Number(
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                      ),
                                                                              }
                                                                            : item,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Pilih item
                                                        </option>
                                                        {items.map((item) => (
                                                            <option
                                                                key={item.id}
                                                                value={item.id}
                                                            >
                                                                {item.code} ·{' '}
                                                                {item.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="text-sm">
                                                    Periode
                                                    <select
                                                        required
                                                        className={inputClass}
                                                        value={row.period}
                                                        onChange={(e) =>
                                                            planForm.setData(
                                                                'mps',
                                                                planForm.data.mps.map(
                                                                    (
                                                                        item,
                                                                        i,
                                                                    ) =>
                                                                        i ===
                                                                        index
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
                                                    >
                                                        {periods.map(
                                                            (period) => (
                                                                <option
                                                                    key={period}
                                                                >
                                                                    {period}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </label>
                                                <label className="text-sm">
                                                    Kuantitas
                                                    <input
                                                        required
                                                        type="number"
                                                        min="0"
                                                        step="any"
                                                        className={inputClass}
                                                        value={row.quantity}
                                                        onChange={(e) =>
                                                            planForm.setData(
                                                                'mps',
                                                                planForm.data.mps.map(
                                                                    (
                                                                        item,
                                                                        i,
                                                                    ) =>
                                                                        i ===
                                                                        index
                                                                            ? {
                                                                                  ...item,
                                                                                  quantity:
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
                                                        planForm.data.mps
                                                            .length <= 1
                                                    }
                                                    onClick={() =>
                                                        planForm.setData(
                                                            'mps',
                                                            planForm.data.mps.filter(
                                                                (_, i) =>
                                                                    i !== index,
                                                            ),
                                                        )
                                                    }
                                                    className="min-h-11 border border-danger-line px-3 text-danger disabled:opacity-40"
                                                >
                                                    Hapus
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            planForm.setData('mps', [
                                                ...planForm.data.mps,
                                                {
                                                    item_id: '',
                                                    period: 'P1',
                                                    quantity: '',
                                                },
                                            ])
                                        }
                                        className="mt-3 min-h-10 border border-line-strong px-3"
                                    >
                                        Tambah baris MPS
                                    </button>
                                </fieldset>
                                <fieldset>
                                    <legend className="font-semibold">
                                        Scheduled receipts
                                    </legend>
                                    <p className="mt-1 text-sm text-muted">
                                        Penerimaan terjadwal menambah projected
                                        on-hand pada periode terkait.
                                    </p>
                                    <div className="mt-2 space-y-3">
                                        {planForm.data.scheduled_receipts.map(
                                            (row, index) => (
                                                <div
                                                    key={index}
                                                    className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                                                >
                                                    <label className="text-sm">
                                                        Item
                                                        <select
                                                            required
                                                            className={
                                                                inputClass
                                                            }
                                                            value={row.item_id}
                                                            onChange={(e) =>
                                                                planForm.setData(
                                                                    'scheduled_receipts',
                                                                    planForm.data.scheduled_receipts.map(
                                                                        (
                                                                            item,
                                                                            i,
                                                                        ) =>
                                                                            i ===
                                                                            index
                                                                                ? {
                                                                                      ...item,
                                                                                      item_id:
                                                                                          Number(
                                                                                              e
                                                                                                  .target
                                                                                                  .value,
                                                                                          ),
                                                                                  }
                                                                                : item,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Pilih item
                                                            </option>
                                                            {items.map(
                                                                (item) => (
                                                                    <option
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        value={
                                                                            item.id
                                                                        }
                                                                    >
                                                                        {
                                                                            item.code
                                                                        }{' '}
                                                                        ·{' '}
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </label>
                                                    <label className="text-sm">
                                                        Periode
                                                        <select
                                                            required
                                                            className={
                                                                inputClass
                                                            }
                                                            value={row.period}
                                                            onChange={(e) =>
                                                                planForm.setData(
                                                                    'scheduled_receipts',
                                                                    planForm.data.scheduled_receipts.map(
                                                                        (
                                                                            item,
                                                                            i,
                                                                        ) =>
                                                                            i ===
                                                                            index
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
                                                        >
                                                            {periods.map(
                                                                (period) => (
                                                                    <option
                                                                        key={
                                                                            period
                                                                        }
                                                                    >
                                                                        {period}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </label>
                                                    <label className="text-sm">
                                                        Kuantitas
                                                        <input
                                                            required
                                                            type="number"
                                                            min="0"
                                                            step="any"
                                                            className={
                                                                inputClass
                                                            }
                                                            value={row.quantity}
                                                            onChange={(e) =>
                                                                planForm.setData(
                                                                    'scheduled_receipts',
                                                                    planForm.data.scheduled_receipts.map(
                                                                        (
                                                                            item,
                                                                            i,
                                                                        ) =>
                                                                            i ===
                                                                            index
                                                                                ? {
                                                                                      ...item,
                                                                                      quantity:
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
                                                        onClick={() =>
                                                            planForm.setData(
                                                                'scheduled_receipts',
                                                                planForm.data.scheduled_receipts.filter(
                                                                    (_, i) =>
                                                                        i !==
                                                                        index,
                                                                ),
                                                            )
                                                        }
                                                        className="min-h-11 border border-danger-line px-3 text-danger"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            planForm.setData(
                                                'scheduled_receipts',
                                                [
                                                    ...planForm.data
                                                        .scheduled_receipts,
                                                    {
                                                        item_id: '',
                                                        period: 'P1',
                                                        quantity: '',
                                                    },
                                                ],
                                            )
                                        }
                                        className="mt-3 min-h-10 border border-line-strong px-3"
                                    >
                                        Tambah scheduled receipt
                                    </button>
                                </fieldset>
                                <div>
                                    <button
                                        disabled={planForm.processing}
                                        className="min-h-12 bg-accent px-5 font-semibold text-ink disabled:opacity-50"
                                    >
                                        {planForm.processing
                                            ? 'Menghitung…'
                                            : 'Hitung dan simpan rencana'}
                                    </button>
                                    {errorEntries(planForm).map(
                                        ([field, message]) => (
                                            <p
                                                key={field}
                                                className="mt-2 text-sm text-danger"
                                            >
                                                {field}: {message}
                                            </p>
                                        ),
                                    )}
                                </div>
                            </form>
                        ) : (
                            <p className="mt-3 border border-dashed border-line-strong p-4 text-muted">
                                Tambahkan item sebelum membuat rencana MRP.
                            </p>
                        )}
                    </section>
                    <section className="mt-10 border-t border-line pt-5">
                        <h2 className="text-xl font-semibold">
                            Rencana tersimpan
                        </h2>
                        {recentRuns.length === 0 ? (
                            <p className="mt-3 text-muted">
                                Belum ada snapshot MRP pada proyek ini.
                            </p>
                        ) : (
                            <ul className="mt-3 divide-y divide-line">
                                {recentRuns.map((run) => (
                                    <li
                                        key={run.id}
                                        className="flex flex-wrap justify-between gap-3 py-3"
                                    >
                                        <span>
                                            {run.inputs.plan_name} ·{' '}
                                            {run.results.records.length} item
                                        </span>
                                        <Link
                                            href={`/projects/${project.id}/analyses/${run.id}`}
                                            className="text-accent-strong hover:underline"
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
