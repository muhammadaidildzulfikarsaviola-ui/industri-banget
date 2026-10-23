<?php

namespace App\Http\Controllers;

use App\Models\AnalysisRun;
use App\Models\MrpBomLine;
use App\Models\MrpItem;
use App\Models\Project;
use App\Services\MrpPlanner;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use InvalidArgumentException;

class MrpController extends Controller
{
    public function create(Project $project): InertiaResponse
    {
        return Inertia::render('mrp/create', [
            'project' => $project,
            'items' => $project->mrpItems()->orderBy('code')->get(),
            'bomLines' => $project->mrpBomLines()->with(['parentItem', 'componentItem'])->orderBy('parent_item_id')->get(),
            'recentRuns' => $project->analysisRuns()->where('type', 'mrp')->latest()->limit(5)->get(),
        ]);
    }

    public function storeItem(Request $request, Project $project): RedirectResponse
    {
        $request->merge(['code' => strtoupper(trim((string) $request->input('code', '')))]);
        if ($project->mrpItems()->count() >= 200) {
            return back()->with('error', 'Satu proyek dibatasi maksimal 200 item MRP.');
        }
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('mrp_items', 'code')->where('project_id', $project->id)],
            'name' => ['required', 'string', 'max:150'],
            'unit' => ['required', 'string', 'max:30'],
            'lead_time_periods' => ['required', 'integer', 'min:0', 'max:32767'],
            'initial_on_hand' => ['required', 'numeric', 'min:0', 'max:99999999999.9999', $this->finiteNumber()],
            'lot_sizing_policy' => ['required', Rule::in(['lot_for_lot', 'fixed_order_quantity'])],
            'fixed_order_quantity' => ['required_if:lot_sizing_policy,fixed_order_quantity', 'nullable', 'numeric', 'gt:0', 'max:99999999999.9999', $this->finiteNumber()],
        ]);

        $project->mrpItems()->create([
            'code' => strtoupper(trim($data['code'])),
            'name' => $data['name'],
            'unit' => $data['unit'],
            'lead_time_periods' => (int) $data['lead_time_periods'],
            'initial_on_hand' => (float) $data['initial_on_hand'],
            'lot_sizing_policy' => $data['lot_sizing_policy'],
            'fixed_order_quantity' => $data['lot_sizing_policy'] === 'fixed_order_quantity'
                ? (float) $data['fixed_order_quantity']
                : null,
        ]);

        return back()->with('success', 'Item MRP ditambahkan ke proyek.');
    }

    public function updateItem(Request $request, Project $project, int $item): RedirectResponse
    {
        $mrpItem = $project->mrpItems()->findOrFail($item);
        $request->merge(['code' => strtoupper(trim((string) $request->input('code', '')))]);
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('mrp_items', 'code')->where('project_id', $project->id)->ignore($mrpItem->id)],
            'name' => ['required', 'string', 'max:150'],
            'unit' => ['required', 'string', 'max:30'],
            'lead_time_periods' => ['required', 'integer', 'min:0', 'max:32767'],
            'initial_on_hand' => ['required', 'numeric', 'min:0', 'max:99999999999.9999', $this->finiteNumber()],
            'lot_sizing_policy' => ['required', Rule::in(['lot_for_lot', 'fixed_order_quantity'])],
            'fixed_order_quantity' => ['required_if:lot_sizing_policy,fixed_order_quantity', 'nullable', 'numeric', 'gt:0', 'max:99999999999.9999', $this->finiteNumber()],
        ]);

        $mrpItem->update([
            ...$data,
            'code' => strtoupper(trim($data['code'])),
            'initial_on_hand' => (float) $data['initial_on_hand'],
            'lead_time_periods' => (int) $data['lead_time_periods'],
            'fixed_order_quantity' => $data['lot_sizing_policy'] === 'fixed_order_quantity' ? (float) $data['fixed_order_quantity'] : null,
        ]);

        return back()->with('success', 'Master item MRP diperbarui.');
    }

    public function destroyItem(Project $project, int $item): RedirectResponse
    {
        $isUsedByBom = DB::transaction(function () use ($project, $item): bool {
            $mrpItem = $project->mrpItems()->lockForUpdate()->findOrFail($item);
            if ($mrpItem->parentBomLines()->exists() || $mrpItem->componentBomLines()->exists()) {
                return true;
            }
            $mrpItem->delete();

            return false;
        });
        if ($isUsedByBom) {
            return back()->with('error', 'Item masih digunakan pada BOM. Hapus relasi BOM terlebih dahulu.');
        }

        return back()->with('success', 'Item MRP dihapus dari proyek.');
    }

    public function storeBomLine(Request $request, Project $project, MrpPlanner $planner): RedirectResponse
    {
        if ($project->mrpBomLines()->count() >= 1000) {
            return back()->with('error', 'Satu proyek dibatasi maksimal 1.000 baris BOM.');
        }
        $data = $request->validate([
            'parent_item_id' => ['required', 'integer', Rule::exists('mrp_items', 'id')->where('project_id', $project->id)],
            'component_item_id' => ['required', 'integer', 'different:parent_item_id', Rule::exists('mrp_items', 'id')->where('project_id', $project->id)],
            'quantity_per' => ['required', 'numeric', 'gt:0', 'max:99999999999.9999', $this->finiteNumber()],
        ]);

        DB::transaction(function () use ($project, $planner, $data): void {
            $this->assertBomLineCanBeSaved($project, $planner, $data);
            $project->mrpBomLines()->create([
                'parent_item_id' => (int) $data['parent_item_id'],
                'component_item_id' => (int) $data['component_item_id'],
                'quantity_per' => (float) $data['quantity_per'],
            ]);
        });

        return back()->with('success', 'Komponen ditambahkan ke BOM proyek.');
    }

    public function updateBomLine(Request $request, Project $project, int $bomLine, MrpPlanner $planner): RedirectResponse
    {
        $data = $request->validate([
            'parent_item_id' => ['required', 'integer', Rule::exists('mrp_items', 'id')->where('project_id', $project->id)],
            'component_item_id' => ['required', 'integer', 'different:parent_item_id', Rule::exists('mrp_items', 'id')->where('project_id', $project->id)],
            'quantity_per' => ['required', 'numeric', 'gt:0', 'max:99999999999.9999', $this->finiteNumber()],
        ]);

        DB::transaction(function () use ($project, $planner, $data, $bomLine): void {
            $project->mrpItems()->lockForUpdate()->get(['id']);
            $line = $project->mrpBomLines()->lockForUpdate()->findOrFail($bomLine);
            $this->assertBomLineCanBeSaved($project, $planner, $data, $line->id);
            $line->update([
                'parent_item_id' => (int) $data['parent_item_id'],
                'component_item_id' => (int) $data['component_item_id'],
                'quantity_per' => (float) $data['quantity_per'],
            ]);
        });

        return back()->with('success', 'Relasi BOM diperbarui.');
    }

    public function destroyBomLine(Project $project, int $bomLine): RedirectResponse
    {
        $project->mrpBomLines()->findOrFail($bomLine)->delete();

        return back()->with('success', 'Relasi BOM dihapus.');
    }

    public function store(Request $request, Project $project, MrpPlanner $planner): RedirectResponse
    {
        $periodCount = (int) $request->input('period_count', 0);
        $periods = $periodCount >= 1 && $periodCount <= 36
            ? array_map(static fn (int $index): string => 'P'.$index, range(1, $periodCount))
            : [];
        $periodRule = Rule::in($periods);
        $projectItemRule = Rule::exists('mrp_items', 'id')->where('project_id', $project->id);
        $data = $request->validate([
            'plan_name' => ['required', 'string', 'max:100'],
            'period_count' => ['required', 'integer', 'min:1', 'max:36'],
            'mps' => ['required', 'array', 'min:1', 'max:1000'],
            'mps.*.item_id' => ['required', 'integer', $projectItemRule],
            'mps.*.period' => ['required', 'string', $periodRule],
            'mps.*.quantity' => ['required', 'numeric', 'min:0', 'max:99999999999.9999', $this->finiteNumber()],
            'scheduled_receipts' => ['present', 'array', 'max:1000'],
            'scheduled_receipts.*.item_id' => ['required', 'integer', $projectItemRule],
            'scheduled_receipts.*.period' => ['required', 'string', $periodRule],
            'scheduled_receipts.*.quantity' => ['required', 'numeric', 'min:0', 'max:99999999999.9999', $this->finiteNumber()],
        ]);

        $mps = array_values(array_map(static fn (array $row): array => [
            'item_id' => (int) $row['item_id'],
            'period' => (string) $row['period'],
            'quantity' => (float) $row['quantity'],
        ], $data['mps']));
        $receipts = array_values(array_map(static fn (array $row): array => [
            'item_id' => (int) $row['item_id'],
            'period' => (string) $row['period'],
            'quantity' => (float) $row['quantity'],
        ], $data['scheduled_receipts']));

        try {
            $analysisRun = DB::transaction(function () use ($project, $planner, $data, $mps, $receipts): AnalysisRun {
                $items = $project->mrpItems()->orderBy('id')->lockForUpdate()->get();
                if ($items->isEmpty()) {
                    throw ValidationException::withMessages(['mps' => 'Tambahkan item proyek sebelum membuat rencana MRP.']);
                }
                $itemSnapshots = array_values($items->map(static fn (MrpItem $item): array => [
                    'id' => (int) $item->id,
                    'project_id' => (int) $item->project_id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'lead_time_periods' => (int) $item->lead_time_periods,
                    'initial_on_hand' => (float) $item->initial_on_hand,
                    'lot_sizing_policy' => $item->lot_sizing_policy,
                    'fixed_order_quantity' => $item->fixed_order_quantity === null ? null : (float) $item->fixed_order_quantity,
                ])->all());
                $bomSnapshots = array_values($project->mrpBomLines()->orderBy('id')->lockForUpdate()->get()->map(static fn (MrpBomLine $line): array => [
                    'parent_item_id' => (int) $line->parent_item_id,
                    'component_item_id' => (int) $line->component_item_id,
                    'quantity_per' => (float) $line->quantity_per,
                ])->all());
                $results = $planner->calculate((int) $data['period_count'], $itemSnapshots, $bomSnapshots, $mps, $receipts);
                $inputs = [
                    'plan_name' => $data['plan_name'],
                    'period_count' => (int) $data['period_count'],
                    'mps' => $mps,
                    'scheduled_receipts' => $receipts,
                    'item_snapshots' => $itemSnapshots,
                    'bom_snapshots' => $bomSnapshots,
                ];

                return $project->analysisRuns()->create([
                    'type' => 'mrp',
                    'inputs' => $inputs,
                    'results' => $results,
                ]);
            });
        } catch (InvalidArgumentException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('analysis-runs.show', [$project, $analysisRun])
            ->with('success', 'Rencana MRP dihitung dan disimpan ke proyek.');
    }

    private function finiteNumber(): Closure
    {
        return static function (string $attribute, mixed $value, Closure $fail): void {
            if ($value !== null && (! is_numeric($value) || ! is_finite((float) $value))) {
                $fail("{$attribute} harus berupa angka hingga yang valid.");
            }
        };
    }

    /** @param array{parent_item_id: int|string, component_item_id: int|string, quantity_per: int|float|string} $data */
    private function assertBomLineCanBeSaved(Project $project, MrpPlanner $planner, array $data, ?int $ignoreLineId = null): void
    {
        $duplicate = $project->mrpBomLines()
            ->where('parent_item_id', $data['parent_item_id'])
            ->where('component_item_id', $data['component_item_id'])
            ->when($ignoreLineId !== null, static fn (Builder $query) => $query->where('id', '!=', $ignoreLineId))
            ->exists();
        if ($duplicate) {
            throw ValidationException::withMessages(['component_item_id' => 'Komponen tersebut sudah tercatat pada item induk ini.']);
        }

        $itemIds = array_values($project->mrpItems()->lockForUpdate()->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all());
        $lines = array_values($project->mrpBomLines()
            ->when($ignoreLineId !== null, static fn (Builder $query) => $query->where('id', '!=', $ignoreLineId))
            ->get(['parent_item_id', 'component_item_id', 'quantity_per'])
            ->map(static fn (MrpBomLine $line): array => [
                'parent_item_id' => (int) $line->parent_item_id,
                'component_item_id' => (int) $line->component_item_id,
                'quantity_per' => (float) $line->quantity_per,
            ])->all());
        $lines[] = [
            'parent_item_id' => (int) $data['parent_item_id'],
            'component_item_id' => (int) $data['component_item_id'],
            'quantity_per' => (float) $data['quantity_per'],
        ];

        try {
            $planner->assertAcyclic($itemIds, $lines);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['component_item_id' => $exception->getMessage()]);
        }
    }
}
