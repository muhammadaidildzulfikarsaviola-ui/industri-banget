<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ProjectController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('projects/index', [
            'projects' => Project::withCount('analysisRuns')->latest()->get(),
        ]);
    }

    public function show(Project $project): InertiaResponse
    {
        return Inertia::render('projects/show', [
            'project' => $project,
            'analysisRuns' => $project->analysisRuns()->latest()->get(),
            'hasMrpMasterData' => $project->mrpItems()->exists(),
        ]);
    }

    public function edit(Project $project): InertiaResponse
    {
        return Inertia::render('projects/edit', [
            'project' => $project,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,completed,on_hold'],
        ]);

        Project::create($validated);

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project berhasil dibuat.');
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,completed,on_hold'],
        ]);

        $project->update($validated);

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Perubahan proyek berhasil disimpan.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        if ($project->analysisRuns()->exists()) {
            return back()->with('error', 'Proyek memiliki riwayat analisis dan tidak dapat dihapus.');
        }

        if ($project->mrpItems()->exists()) {
            return back()->with('error', 'Hapus master item MRP dari proyek sebelum menghapus proyek.');
        }

        $project->delete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Proyek berhasil dihapus.');
    }
}
