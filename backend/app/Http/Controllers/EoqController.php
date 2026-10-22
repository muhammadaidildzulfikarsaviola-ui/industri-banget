<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\EoqCalculator;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use InvalidArgumentException;

class EoqController extends Controller
{
    public function create(Project $project): InertiaResponse
    {
        return Inertia::render('eoq/create', [
            'project' => $project,
            'recentRuns' => $project->analysisRuns()->where('type', 'eoq')->latest()->limit(5)->get(),
        ]);
    }

    public function store(Request $request, Project $project, EoqCalculator $calculator): RedirectResponse
    {
        $finiteNumber = static function (string $attribute, mixed $value, Closure $fail): void {
            if ($value !== null && (! is_numeric($value) || ! is_finite((float) $value))) {
                $fail("{$attribute} harus berupa angka hingga yang valid.");
            }
        };

        $validated = $request->validate([
            'annual_demand' => ['required', 'numeric', 'gt:0', $finiteNumber],
            'order_cost' => ['required', 'numeric', 'gt:0', $finiteNumber],
            'holding_cost' => ['required', 'numeric', 'gt:0', $finiteNumber],
            'currency_code' => ['required', 'string', 'regex:/^[A-Z]{3}$/'],
            'comparison_quantity' => ['nullable', 'numeric', 'gt:0', $finiteNumber],
        ]);

        $inputs = [
            'annual_demand' => (float) $validated['annual_demand'],
            'order_cost' => (float) $validated['order_cost'],
            'holding_cost' => (float) $validated['holding_cost'],
            'currency_code' => $validated['currency_code'],
            'comparison_quantity' => isset($validated['comparison_quantity'])
                ? (float) $validated['comparison_quantity']
                : null,
        ];

        try {
            $results = $calculator->calculate(
                $inputs['annual_demand'],
                $inputs['order_cost'],
                $inputs['holding_cost'],
                $inputs['comparison_quantity'],
            );
        } catch (InvalidArgumentException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        $analysisRun = DB::transaction(fn () => $project->analysisRuns()->create([
            'type' => 'eoq',
            'inputs' => $inputs,
            'results' => $results,
        ]));

        return redirect()
            ->route('analysis-runs.show', [$project, $analysisRun])
            ->with('success', 'Analisis EOQ dihitung dan disimpan ke proyek.');
    }
}
