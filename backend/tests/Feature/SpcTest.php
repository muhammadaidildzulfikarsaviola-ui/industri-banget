<?php

use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

function createSpcProject(string $name = 'SPC project'): Project
{
    return Project::query()->create([
        'name' => $name,
        'industry' => 'Manufacturing',
        'description' => null,
        'status' => 'active',
    ]);
}

test('SPC page and saved snapshots are scoped to their project', function () {
    $project = createSpcProject();
    $otherProject = createSpcProject('Other SPC project');

    $this->get(route('projects.spc.create', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('spc/create')->where('project.id', $project->id)->has('recentRuns', 0));

    $this->post(route('projects.spc.store', $project), [
        'analysis_name' => 'Line A dimensions',
        'characteristic' => 'Diameter',
        'unit' => 'mm',
        'chart_type' => 'imr',
        'observations' => [10, 12, 11, 13],
        'labels' => ['Lot A', 'Lot B', 'Lot C', 'Lot D'],
    ])->assertRedirect();

    $run = $project->analysisRuns()->where('type', 'spc')->firstOrFail();
    expect($run->inputs['analysis_name'])->toBe('Line A dimensions')
        ->and($run->results['charts'][0]['points'][0]['label'])->toBe('Lot A')
        ->and($run->results['chart_type'])->toBe('imr');

    $this->get(route('analysis-runs.show', [$project, $run]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('spc/show')->where('analysisRun.id', $run->id));
    $this->get(route('analysis-runs.show', [$otherProject, $run]))->assertNotFound();
});

test('SPC rejects invalid counts, np sample sizes, and unequal X-bar R subgroups', function () {
    $project = createSpcProject('SPC validation project');

    $this->from(route('projects.spc.create', $project))->post(route('projects.spc.store', $project), [
        'analysis_name' => 'Invalid p', 'characteristic' => 'Defects', 'unit' => 'proportion', 'chart_type' => 'p',
        'observations' => [['defects' => 11, 'sample_size' => 10], ['defects' => 1, 'sample_size' => 10]],
    ])->assertSessionHas('error');

    $this->from(route('projects.spc.create', $project))->post(route('projects.spc.store', $project), [
        'analysis_name' => 'Invalid np', 'characteristic' => 'Defects', 'unit' => 'unit', 'chart_type' => 'np',
        'observations' => [['defects' => 1, 'sample_size' => 10], ['defects' => 2, 'sample_size' => 11]],
    ])->assertSessionHas('error');

    $this->from(route('projects.spc.create', $project))->post(route('projects.spc.store', $project), [
        'analysis_name' => 'Invalid Xbar R', 'characteristic' => 'Length', 'unit' => 'mm', 'chart_type' => 'xbar_r',
        'subgroups' => [[10, 11], [10, 11, 12]],
    ])->assertSessionHas('error');

    expect($project->analysisRuns()->count())->toBe(0);
});

test('each supported SPC chart can persist its own result snapshot', function (string $chart, array $data) {
    $project = createSpcProject('SPC '.$chart);
    $payload = ['analysis_name' => 'Test '.$chart, 'characteristic' => 'Quality', 'unit' => 'unit', 'chart_type' => $chart] + $data;

    $this->post(route('projects.spc.store', $project), $payload)->assertRedirect();
    expect($project->analysisRuns()->where('type', 'spc')->count())->toBe(1)
        ->and($project->analysisRuns()->where('type', 'spc')->first()->results['chart_type'])->toBe($chart);
})->with([
    'imr' => ['imr', ['observations' => [10, 11, 12]]],
    'xbar_r' => ['xbar_r', ['subgroups' => [[10, 11], [11, 12]]]],
    'p' => ['p', ['observations' => [['defects' => 1, 'sample_size' => 10], ['defects' => 2, 'sample_size' => 20]]]],
    'np' => ['np', ['observations' => [['defects' => 1, 'sample_size' => 10], ['defects' => 2, 'sample_size' => 10]]]],
    'c' => ['c', ['observations' => [1, 2, 3]]],
    'u' => ['u', ['observations' => [['defects' => 1, 'opportunities' => 10], ['defects' => 2, 'opportunities' => 20]]]],
]);
