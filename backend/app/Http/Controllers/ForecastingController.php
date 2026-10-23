<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ForecastingCalculator;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use InvalidArgumentException;

class ForecastingController extends Controller
{
    public function create(Project $project): InertiaResponse
    {
        return Inertia::render('forecasting/create', [
            'project' => $project,
            'recentRuns' => $project->analysisRuns()->where('type', 'forecasting')->latest()->limit(5)->get(),
        ]);
    }

    public function store(Request $request, Project $project, ForecastingCalculator $calculator): RedirectResponse
    {
        $finiteNumber = static function (string $attribute, mixed $value, Closure $fail): void {
            if ($value !== null && (! is_numeric($value) || ! is_finite((float) $value))) {
                $fail("{$attribute} harus berupa angka hingga yang valid.");
            }
        };

        $validated = $request->validate([
            'analysis_name' => ['required', 'string', 'max:100'],
            'unit' => ['required', 'string', 'max:30'],
            'interval' => ['required', 'in:daily,weekly,monthly'],
            'horizon' => ['required', 'integer', 'min:1', 'max:60'],
            'methods' => ['required', 'array', 'min:1'],
            'methods.*' => ['required', 'string', 'distinct', 'in:naive,moving_average,weighted_moving_average,single_exponential_smoothing,linear_trend'],
            'history' => ['required', 'array', 'min:3', 'max:500'],
            'history.*.period' => ['required', 'string', 'max:10', 'distinct'],
            'history.*.actual' => ['required', 'numeric', 'min:0', $finiteNumber],
            'moving_average_window' => ['required', 'integer', 'min:1', 'max:500'],
            'weighted_moving_average_weights' => ['required', 'array', 'min:1', 'max:500'],
            'weighted_moving_average_weights.*' => ['required', 'numeric', 'min:0', $finiteNumber],
            'alpha' => ['required', 'numeric', 'between:0,1', $finiteNumber],
        ]);

        $interval = match ($validated['interval']) {
            'daily' => 'daily',
            'weekly' => 'weekly',
            'monthly' => 'monthly',
            default => throw new InvalidArgumentException('Interval forecast tidak didukung.'),
        };

        $inputs = [
            'analysis_name' => (string) $validated['analysis_name'],
            'unit' => (string) $validated['unit'],
            'interval' => $interval,
            'horizon' => (int) $validated['horizon'],
            'methods' => array_values(array_map(static fn (mixed $method): string => (string) $method, $validated['methods'])),
            'history' => array_values(array_map(static fn (array $row): array => [
                'period' => (string) $row['period'],
                'actual' => (float) $row['actual'],
            ], $validated['history'])),
            'moving_average_window' => (int) $validated['moving_average_window'],
            'weighted_moving_average_weights' => array_values(array_map('floatval', $validated['weighted_moving_average_weights'])),
            'alpha' => (float) $validated['alpha'],
        ];

        try {
            $results = $calculator->calculate($inputs);
        } catch (InvalidArgumentException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        $analysisRun = DB::transaction(fn () => $project->analysisRuns()->create([
            'type' => 'forecasting',
            'inputs' => $inputs,
            'results' => $results,
        ]));

        return redirect()
            ->route('analysis-runs.show', [$project, $analysisRun])
            ->with('success', 'Forecast tersimpan pada proyek ini.');
    }
}
