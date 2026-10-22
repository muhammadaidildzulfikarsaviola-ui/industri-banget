<?php

use App\Models\Project;
use App\Services\EoqCalculator;
use Inertia\Testing\AssertableInertia as Assert;

function createEoqProject(string $name = 'EOQ project'): Project
{
    return Project::query()->create([
        'name' => $name,
        'industry' => 'Manufacturing',
        'description' => null,
        'status' => 'active',
    ]);
}

test('the EOQ page opens for a project and shows its empty history state', function () {
    $project = createEoqProject();

    $this->get(route('projects.eoq.create', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('eoq/create')
            ->where('project.id', $project->id)
            ->has('recentRuns', 0));
});

test('a valid EOQ analysis is calculated and stored with its project', function () {
    $project = createEoqProject();

    $response = $this->post(route('projects.eoq.store', $project), [
        'annual_demand' => '12000',
        'order_cost' => '50',
        'holding_cost' => '2.5',
        'currency_code' => 'IDR',
        'comparison_quantity' => '800',
    ]);

    $this->assertDatabaseHas('analysis_runs', [
        'project_id' => $project->id,
        'type' => 'eoq',
    ]);

    $run = $project->analysisRuns()->firstOrFail();
    $response->assertRedirect(route('analysis-runs.show', [$project, $run]));
    expect((float) $run->inputs['annual_demand'])->toBe(12000.0)
        ->and($run->inputs['currency_code'])->toBe('IDR')
        ->and(abs($run->results['eoq'] - sqrt(480_000)))->toBeLessThan(1.0e-10)
        ->and((float) $run->results['comparison']['quantity'])->toBe(800.0);
});

test('invalid EOQ inputs are rejected and no analysis run is stored', function (array $overrides) {
    $project = createEoqProject();
    $inputs = [
        'annual_demand' => '12000',
        'order_cost' => '50',
        'holding_cost' => '2.5',
        'currency_code' => 'IDR',
    ];

    $this->from(route('projects.eoq.create', $project))
        ->post(route('projects.eoq.store', $project), [...$inputs, ...$overrides])
        ->assertRedirect(route('projects.eoq.create', $project))
        ->assertSessionHasErrors(array_keys($overrides));

    expect($project->analysisRuns()->count())->toBe(0);
})->with([
    'empty demand' => [['annual_demand' => '']],
    'zero demand' => [['annual_demand' => '0']],
    'negative demand' => [['annual_demand' => '-1']],
    'empty order cost' => [['order_cost' => '']],
    'non numeric cost' => [['order_cost' => 'lots']],
    'infinite cost' => [['order_cost' => '1e999']],
    'empty holding cost' => [['holding_cost' => '']],
    'zero holding cost' => [['holding_cost' => '0']],
    'invalid currency code' => [['currency_code' => 'ID']],
]);

test('finite inputs that overflow the calculation are rejected without storing a run', function () {
    $project = createEoqProject();

    $this->from(route('projects.eoq.create', $project))
        ->post(route('projects.eoq.store', $project), [
            'annual_demand' => '1e308',
            'order_cost' => '1e308',
            'holding_cost' => '1e-308',
            'currency_code' => 'IDR',
        ])
        ->assertRedirect(route('projects.eoq.create', $project))
        ->assertSessionHas('error');

    expect($project->analysisRuns()->count())->toBe(0);
});

test('a stored EOQ result can be reopened with its inputs and chart', function () {
    $project = createEoqProject();
    $run = $project->analysisRuns()->create([
        'type' => 'eoq',
        'inputs' => [
            'annual_demand' => 12_000,
            'order_cost' => 50,
            'holding_cost' => 2.5,
            'currency_code' => 'IDR',
            'comparison_quantity' => null,
        ],
        'results' => app(EoqCalculator::class)->calculate(12_000, 50, 2.5),
    ]);

    $this->get(route('analysis-runs.show', [$project, $run]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('eoq/show')
            ->where('project.id', $project->id)
            ->where('analysisRun.id', $run->id)
            ->has('analysisRun.results.chart', 49));
});

test('an analysis result cannot be opened through a different project', function () {
    $project = createEoqProject('Owning project');
    $otherProject = createEoqProject('Other project');
    $run = $project->analysisRuns()->create([
        'type' => 'eoq',
        'inputs' => [],
        'results' => [],
    ]);

    $this->get(route('analysis-runs.show', [$otherProject, $run]))
        ->assertNotFound();
});
