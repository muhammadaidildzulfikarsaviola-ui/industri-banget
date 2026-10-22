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
        abort_unless($analysisRun->type === 'eoq', 404);

        return Inertia::render('eoq/show', [
            'project' => $project,
            'analysisRun' => $analysisRun,
        ]);
    }
}
