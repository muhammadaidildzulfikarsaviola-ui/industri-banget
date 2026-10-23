import { useForm } from '@inertiajs/react';
import type { MrpItem } from '@/types/mrp';

type Props = { projectId: number; item: MrpItem };
const inputClass =
    'mt-1 min-h-11 w-full border border-line-strong bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-accent';

export function MrpItemRow({ projectId, item }: Props) {
    const form = useForm({
        code: item.code,
        name: item.name,
        unit: item.unit,
        lead_time_periods: item.lead_time_periods,
        initial_on_hand: item.initial_on_hand,
        lot_sizing_policy: item.lot_sizing_policy,
        fixed_order_quantity: item.fixed_order_quantity ?? '',
    });
    const remove = useForm({});
    return (
        <details className="border-b border-line py-3">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 font-medium">
                <span>
                    {item.code} · {item.name}
                </span>
                <span className="text-sm text-muted">
                    {item.unit} · lead time {item.lead_time_periods} · stok{' '}
                    {item.initial_on_hand} ·{' '}
                    {item.lot_sizing_policy === 'lot_for_lot'
                        ? 'Lot-for-Lot'
                        : `FOQ ${item.fixed_order_quantity}`}
                </span>
            </summary>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(`/projects/${projectId}/mrp/items/${item.id}`);
                }}
                className="mt-4 grid gap-3 bg-canvas p-4 sm:grid-cols-2 lg:grid-cols-4"
            >
                <label className="text-sm font-medium">
                    Kode
                    <input
                        className={inputClass}
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value)}
                    />
                </label>
                <label className="text-sm font-medium">
                    Nama
                    <input
                        className={inputClass}
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                    />
                </label>
                <label className="text-sm font-medium">
                    Satuan
                    <input
                        className={inputClass}
                        value={form.data.unit}
                        onChange={(e) => form.setData('unit', e.target.value)}
                    />
                </label>
                <label className="text-sm font-medium">
                    Lead time (periode)
                    <input
                        type="number"
                        min="0"
                        max="32767"
                        className={inputClass}
                        value={form.data.lead_time_periods}
                        onChange={(e) =>
                            form.setData(
                                'lead_time_periods',
                                Number(e.target.value),
                            )
                        }
                    />
                </label>
                <label className="text-sm font-medium">
                    Persediaan awal
                    <input
                        type="number"
                        min="0"
                        step="any"
                        className={inputClass}
                        value={form.data.initial_on_hand}
                        onChange={(e) =>
                            form.setData(
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
                        value={form.data.lot_sizing_policy}
                        onChange={(e) =>
                            form.setData(
                                'lot_sizing_policy',
                                e.target
                                    .value as typeof form.data.lot_sizing_policy,
                            )
                        }
                    >
                        <option value="lot_for_lot">Lot-for-Lot</option>
                        <option value="fixed_order_quantity">
                            Fixed Order Quantity
                        </option>
                    </select>
                </label>
                {form.data.lot_sizing_policy === 'fixed_order_quantity' && (
                    <label className="text-sm font-medium">
                        Kuantitas tetap
                        <input
                            type="number"
                            min="0.0001"
                            step="any"
                            className={inputClass}
                            value={form.data.fixed_order_quantity}
                            onChange={(e) =>
                                form.setData(
                                    'fixed_order_quantity',
                                    e.target.value === ''
                                        ? ''
                                        : Number(e.target.value),
                                )
                            }
                        />
                    </label>
                )}
                <div className="flex flex-wrap items-end gap-3">
                    <button
                        disabled={form.processing}
                        className="min-h-11 bg-accent px-4 font-semibold text-ink disabled:opacity-50"
                    >
                        Simpan perubahan
                    </button>
                    <button
                        type="button"
                        disabled={remove.processing}
                        onClick={() =>
                            remove.delete(
                                `/projects/${projectId}/mrp/items/${item.id}`,
                            )
                        }
                        className="min-h-11 border border-danger-line px-4 text-danger disabled:opacity-50"
                    >
                        Hapus item
                    </button>
                </div>
                {Object.entries(form.errors).map(([key, message]) => (
                    <p key={key} className="text-sm text-danger">
                        {key}: {message}
                    </p>
                ))}
            </form>
        </details>
    );
}
