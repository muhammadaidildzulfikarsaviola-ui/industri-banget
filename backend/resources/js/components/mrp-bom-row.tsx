import { useForm } from '@inertiajs/react';
import type { MrpBomLine, MrpItem } from '@/types/mrp';

type Props = { projectId: number; line: MrpBomLine; items: MrpItem[] };
const inputClass =
    'mt-1 min-h-11 w-full border border-line-strong bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-accent';

export function MrpBomRow({ projectId, line, items }: Props) {
    const form = useForm({
        parent_item_id: line.parent_item_id,
        component_item_id: line.component_item_id,
        quantity_per: line.quantity_per,
    });
    const remove = useForm({});
    return (
        <details className="border-b border-line py-3">
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 font-medium">
                <span>
                    {line.parent_item.code} → {line.component_item.code}
                </span>
                <span className="text-sm text-muted">
                    {line.quantity_per} {line.component_item.unit} per unit
                    induk
                </span>
            </summary>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(`/projects/${projectId}/mrp/bom/${line.id}`);
                }}
                className="mt-4 grid gap-3 bg-canvas p-4 sm:grid-cols-3"
            >
                <label className="text-sm font-medium">
                    Item induk
                    <select
                        className={inputClass}
                        value={form.data.parent_item_id}
                        onChange={(e) =>
                            form.setData(
                                'parent_item_id',
                                Number(e.target.value),
                            )
                        }
                    >
                        {items.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.code} · {item.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm font-medium">
                    Komponen
                    <select
                        className={inputClass}
                        value={form.data.component_item_id}
                        onChange={(e) =>
                            form.setData(
                                'component_item_id',
                                Number(e.target.value),
                            )
                        }
                    >
                        {items.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.code} · {item.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm font-medium">
                    Kuantitas per unit
                    <input
                        type="number"
                        min="0.0001"
                        step="any"
                        className={inputClass}
                        value={form.data.quantity_per}
                        onChange={(e) =>
                            form.setData('quantity_per', Number(e.target.value))
                        }
                    />
                </label>
                <div className="flex gap-3">
                    <button
                        disabled={form.processing}
                        className="min-h-11 bg-accent px-4 font-semibold text-ink"
                    >
                        Simpan BOM
                    </button>
                    <button
                        type="button"
                        disabled={remove.processing}
                        onClick={() =>
                            remove.delete(
                                `/projects/${projectId}/mrp/bom/${line.id}`,
                            )
                        }
                        className="min-h-11 border border-danger-line px-4 text-danger"
                    >
                        Hapus
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
