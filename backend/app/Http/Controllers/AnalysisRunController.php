<?php

namespace App\Http\Controllers;

use App\Models\AnalysisRun;
use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AnalysisRunController extends Controller
{
    public function show(Project $project, AnalysisRun $analysisRun): InertiaResponse
    {
        $page = match ($analysisRun->type) {
            'eoq' => 'eoq/show',
            'forecasting' => 'forecasting/show',
            'mrp' => 'mrp/show',
            'spc' => 'spc/show',
            default => abort(404),
        };

        return Inertia::render($page, [
            'project' => $project,
            'analysisRun' => $analysisRun,
        ]);
    }
}
