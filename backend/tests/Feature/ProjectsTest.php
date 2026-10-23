<?php

use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('projects page lists records from the database', function () {
    Project::query()->create([
        'name' => 'Inventory review',
        'industry' => 'Manufacturing',
        'description' => 'Review reorder policies.',
        'status' => 'active',
    ]);

    $this->get(route('projects.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/index')
            ->has('projects', 1)
            ->where('projects.0.name', 'Inventory review')
            ->where('projects.0.industry', 'Manufacturing')
            ->where('projects.0.status', 'active'));
});

test('a valid project submission is stored and redirects to the project list', function () {
    $this->post(route('projects.store'), [
        'name' => 'Line balancing',
        'industry' => 'Manufacturing',
        'description' => 'Reduce bottlenecks on line 3.',
        'status' => 'active',
    ])
        ->assertRedirect(route('projects.index'))
        ->assertSessionHas('success', 'Project berhasil dibuat.');

    $this->get(route('projects.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/index')
            ->where('flash.success', 'Project berhasil dibuat.')
            ->where('projects.0.name', 'Line balancing'));

    $this->assertDatabaseHas('projects', [
        'name' => 'Line balancing',
        'industry' => 'Manufacturing',
        'status' => 'active',
    ]);
});

test('invalid project submissions return validation errors without storing a record', function () {
    $this->from(route('projects.index'))
        ->post(route('projects.store'), [
            'name' => '',
            'status' => 'unknown',
        ])
        ->assertRedirect(route('projects.index'))
        ->assertSessionHasErrors(['name', 'status']);

    expect(Project::query()->count())->toBe(0);
});

test('a project can be opened and updated with validated fields', function () {
    $project = Project::query()->create([
        'name' => 'Initial project',
        'industry' => null,
        'description' => null,
        'status' => 'active',
    ]);

    $this->get(route('projects.show', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/show')
            ->where('project.id', $project->id)
            ->has('analysisRuns', 0));

    $this->put(route('projects.update', $project), [
        'name' => 'Updated project',
        'industry' => 'Logistics',
        'description' => 'Updated scope.',
        'status' => 'completed',
    ])->assertRedirect(route('projects.show', $project));

    $this->assertDatabaseHas('projects', [
        'id' => $project->id,
        'name' => 'Updated project',
        'industry' => 'Logistics',
        'status' => 'completed',
    ]);
});

test('project updates reject unsupported statuses', function () {
    $project = Project::query()->create([
        'name' => 'Project to preserve',
        'status' => 'active',
    ]);

    $this->from(route('projects.edit', $project))
        ->put(route('projects.update', $project), [
            'name' => 'Project to preserve',
            'status' => 'archived',
        ])
        ->assertRedirect(route('projects.edit', $project))
        ->assertSessionHasErrors('status');

    expect($project->fresh()->status)->toBe('active');
});

test('a project without analysis history can be deleted', function () {
    $project = Project::query()->create([
        'name' => 'Disposable project',
        'status' => 'active',
    ]);

    $this->delete(route('projects.destroy', $project))
        ->assertRedirect(route('projects.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});

test('a project with analysis history cannot be deleted', function () {
    $project = Project::query()->create([
        'name' => 'Audited project',
        'status' => 'active',
    ]);
    $project->analysisRuns()->create([
        'type' => 'eoq',
        'inputs' => ['annual_demand' => 10],
        'results' => ['eoq' => 2],
    ]);

    $this->delete(route('projects.destroy', $project))
        ->assertRedirect()
        ->assertSessionHas('error');

    $this->assertDatabaseHas('projects', ['id' => $project->id]);
    $this->assertDatabaseHas('analysis_runs', ['project_id' => $project->id]);
});

test('missing projects return not found', function () {
    $this->get('/projects/999999')->assertNotFound();
    $this->get('/projects/999999/edit')->assertNotFound();
});
