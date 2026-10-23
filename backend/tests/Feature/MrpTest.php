<?php

use App\Models\MrpItem;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

function createMrpProject(string $name = 'MRP project'): Project
{
    return Project::query()->create([
        'name' => $name,
        'industry' => 'Manufacturing',
        'description' => null,
        'status' => 'active',
    ]);
}

function createMrpItem(Project $project, string $code, array $overrides = []): MrpItem
{
    return $project->mrpItems()->create(array_replace([
        'code' => $code,
        'name' => $code.' item',
        'unit' => 'unit',
        'lead_time_periods' => 0,
        'initial_on_hand' => 0,
        'lot_sizing_policy' => 'lot_for_lot',
        'fixed_order_quantity' => null,
    ], $overrides));
}

test('MRP page only lists the selected project master data and saved plans', function () {
    $project = createMrpProject();
    $otherProject = createMrpProject('Other MRP project');
    createMrpItem($project, 'A');
    createMrpItem($otherProject, 'B');

    $this->get(route('projects.mrp.create', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mrp/create')
            ->where('project.id', $project->id)
            ->has('items', 1)
            ->where('items.0.code', 'A')
            ->has('bomLines', 0)
            ->has('recentRuns', 0));
});

test('item codes are unique within a project, and a BOM rejects cycles and cross-project items', function () {
    $project = createMrpProject();
    $otherProject = createMrpProject('Other project');
    $parent = createMrpItem($project, 'PARENT');
    $component = createMrpItem($project, 'COMP');
    $foreignItem = createMrpItem($otherProject, 'FOREIGN');

    $this->from(route('projects.mrp.create', $project))
        ->post(route('projects.mrp.items.store', $project), [
            'code' => 'parent', 'name' => 'Duplicate', 'unit' => 'unit', 'lead_time_periods' => 0,
            'initial_on_hand' => 0, 'lot_sizing_policy' => 'lot_for_lot', 'fixed_order_quantity' => null,
        ])
        ->assertSessionHasErrors('code');

    $this->post(route('projects.mrp.bom.store', $project), [
        'parent_item_id' => $parent->id, 'component_item_id' => $component->id, 'quantity_per' => 2,
    ])->assertSessionHasNoErrors();

    $this->from(route('projects.mrp.create', $project))
        ->post(route('projects.mrp.bom.store', $project), [
            'parent_item_id' => $component->id, 'component_item_id' => $parent->id, 'quantity_per' => 1,
        ])
        ->assertSessionHasErrors('component_item_id');

    $this->from(route('projects.mrp.create', $project))
        ->post(route('projects.mrp.bom.store', $project), [
            'parent_item_id' => $parent->id, 'component_item_id' => $foreignItem->id, 'quantity_per' => 1,
        ])
        ->assertSessionHasErrors('component_item_id');

    expect($project->mrpBomLines()->count())->toBe(1)
        ->and($otherProject->mrpItems()->where('code', 'parent')->exists())->toBeFalse();
});

test('composite foreign keys reject a cross-project BOM even outside the controller', function () {
    $project = createMrpProject();
    $otherProject = createMrpProject('Other project');
    $parent = createMrpItem($project, 'PARENT');
    $foreignComponent = createMrpItem($otherProject, 'FOREIGN');

    expect(fn () => DB::table('mrp_bom_lines')->insert([
        'project_id' => $project->id,
        'parent_item_id' => $parent->id,
        'component_item_id' => $foreignComponent->id,
        'quantity_per' => 1,
        'created_at' => now(),
        'updated_at' => now(),
    ]))->toThrow(QueryException::class);
});

test('MRP snapshots are saved, reopened unchanged, and scoped to the parent project', function () {
    $project = createMrpProject();
    $otherProject = createMrpProject('Other project');
    $parent = createMrpItem($project, 'A', ['lead_time_periods' => 1]);
    $component = createMrpItem($project, 'B');
    $project->mrpBomLines()->create([
        'parent_item_id' => $parent->id,
        'component_item_id' => $component->id,
        'quantity_per' => 2,
    ]);

    $this->post(route('projects.mrp.store', $project), [
        'plan_name' => 'Production plan',
        'period_count' => 3,
        'mps' => [['item_id' => $parent->id, 'period' => 'P2', 'quantity' => 5]],
        'scheduled_receipts' => [['item_id' => $parent->id, 'period' => 'P2', 'quantity' => 2]],
    ])->assertSessionHasNoErrors();

    $run = $project->analysisRuns()->where('type', 'mrp')->firstOrFail();
    $this->assertDatabaseHas('analysis_runs', ['id' => $run->id, 'project_id' => $project->id, 'type' => 'mrp']);
    expect($run->inputs['item_snapshots'][0]['code'])->toBe('A')
        ->and($run->inputs['bom_snapshots'])->toHaveCount(1)
        ->and($run->results['records'][0]['periods'][0]['planned_order_releases'])->toEqual(3.0)
        ->and($run->results['records'][1]['periods'][0]['gross_requirements'])->toEqual(6.0);

    $this->get(route('analysis-runs.show', [$project, $run]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('mrp/show')
            ->where('analysisRun.inputs.plan_name', 'Production plan')
            ->where('analysisRun.results.records.1.item.code', 'B'));

    $this->get(route('analysis-runs.show', [$otherProject, $run]))->assertNotFound();
});

test('MRP input cannot reference an item outside its project', function () {
    $project = createMrpProject();
    $otherProject = createMrpProject('Other project');
    $foreignItem = createMrpItem($otherProject, 'FOREIGN');

    $this->from(route('projects.mrp.create', $project))
        ->post(route('projects.mrp.store', $project), [
            'plan_name' => 'Invalid plan',
            'period_count' => 2,
            'mps' => [['item_id' => $foreignItem->id, 'period' => 'P1', 'quantity' => 1]],
            'scheduled_receipts' => [],
        ])
        ->assertRedirect(route('projects.mrp.create', $project))
        ->assertSessionHasErrors('mps.0.item_id');

    expect($project->analysisRuns()->count())->toBe(0);
});

test('items with BOM edges cannot be deleted and projects with MRP masters cannot be removed', function () {
    $project = createMrpProject();
    $parent = createMrpItem($project, 'PARENT');
    $component = createMrpItem($project, 'COMP');
    $project->mrpBomLines()->create([
        'parent_item_id' => $parent->id,
        'component_item_id' => $component->id,
        'quantity_per' => 1,
    ]);

    $this->delete(route('projects.mrp.items.destroy', [$project, $parent]))
        ->assertSessionHas('error');
    $this->delete(route('projects.destroy', $project))
        ->assertSessionHas('error');

    expect(Project::query()->whereKey($project->id)->exists())->toBeTrue();
});
