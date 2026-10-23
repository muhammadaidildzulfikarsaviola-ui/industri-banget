<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\SpcCalculator;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use InvalidArgumentException;

class SpcController extends Controller
{
    public function create(Project $project): InertiaResponse
    {
        return Inertia::render('spc/create', [
            'project' => $project,
            'recentRuns' => $project->analysisRuns()->where('type', 'spc')->latest()->limit(5)->get(),
        ]);
    }

    public function store(Request $request, Project $project, SpcCalculator $calculator): RedirectResponse
    {
        $finite = static function (string $attribute, mixed $value, Closure $fail): void {
            if ($value !== null && (! is_numeric($value) || ! is_finite((float) $value))) {
                $fail("{$attribute} harus berupa angka hingga yang valid.");
            }
        };

        $chartType = $request->input('chart_type');
        $rules = [
            'analysis_name' => ['required', 'string', 'max:100'],
            'characteristic' => ['required', 'string', 'max:100'],
            'unit' => ['required', 'string', 'max:30'],
            'chart_type' => ['required', 'in:imr,xbar_r,p,np,c,u'],
            'labels' => ['nullable', 'array', 'max:1000'],
            'labels.*' => ['nullable', 'string', 'max:40'],
        ];
        if ($chartType === 'xbar_r') {
            $rules += ['subgroups' => ['required', 'array', 'min:2', 'max:100'], 'subgroups.*' => ['required', 'array', 'min:2', 'max:10'], 'subgroups.*.*' => ['required', 'numeric', 'min:0', 'max:999999999', $finite]];
        } elseif ($chartType === 'imr' || $chartType === 'c') {
            $rules += ['observations' => ['required', 'array', 'min:2', 'max:1000'], 'observations.*' => ['required', 'numeric', 'min:0', 'max:999999999', $finite]];
            if ($chartType === 'c') {
                $rules['observations.*'][] = 'integer';
            }
        } else {
            $rules += [
                'observations' => ['required', 'array', 'min:2', 'max:1000'],
                'observations.*.defects' => ['required', 'integer', 'min:0', 'max:999999999'],
                'observations.*.sample_size' => ['required_if:chart_type,p,np', 'integer', 'min:1', 'max:999999999'],
                'observations.*.opportunities' => ['required_if:chart_type,u', 'integer', 'min:1', 'max:999999999'],
            ];
        }
        $validated = $request->validate($rules);
        $inputs = [
            'analysis_name' => trim($validated['analysis_name']),
            'characteristic' => trim($validated['characteristic']),
            'unit' => trim($validated['unit']),
            'chart_type' => $validated['chart_type'],
        ];
        if ($inputs['chart_type'] === 'xbar_r') {
            $inputs['subgroups'] = array_map(static fn (array $group): array => array_map('floatval', $group), $validated['subgroups']);
        } elseif ($inputs['chart_type'] === 'imr' || $inputs['chart_type'] === 'c') {
            $inputs['observations'] = array_map('floatval', $validated['observations']);
        } else {
            $sizeKey = $inputs['chart_type'] === 'u' ? 'opportunities' : 'sample_size';
            $inputs['observations'] = array_map(static fn (array $row): array => [
                'defects' => (int) $row['defects'],
                $sizeKey => (int) $row[$sizeKey],
            ], $validated['observations']);
        }
        if (isset($validated['labels'])) {
            $inputs['labels'] = array_values($validated['labels']);
        }

        try {
            $results = $calculator->calculate($inputs);
        } catch (InvalidArgumentException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        $analysisRun = DB::transaction(fn () => $project->analysisRuns()->create([
            'type' => 'spc',
            'inputs' => $inputs,
            'results' => $results,
        ]));

        return redirect()->route('analysis-runs.show', [$project, $analysisRun])->with('success', 'Control chart tersimpan pada proyek ini.');
    }
}
