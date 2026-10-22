<?php

use App\Models\Project;
use Inertia\Testing\AssertableInertia as Assert;

test('dashboard shows recent projects from the database', function () {
    Project::query()->create([
        'name' => 'Current inventory study',
        'industry' => 'Manufacturing',
        'status' => 'active',
    ]);

    $response = $this->get(route('home'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('recentProjects', 1)
            ->where('recentProjects.0.name', 'Current inventory study')
            ->where('recentProjects.0.status', 'active'));
});
