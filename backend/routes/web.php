<?php

use App\Http\Controllers\AnalysisRunController;
use App\Http\Controllers\EoqController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::get('/projects', [ProjectController::class, 'index'])
    ->name('projects.index');

Route::post('/projects', [ProjectController::class, 'store'])
    ->name('projects.store');

Route::get('/projects/{project}', [ProjectController::class, 'show'])
    ->name('projects.show');
Route::get('/projects/{project}/edit', [ProjectController::class, 'edit'])
    ->name('projects.edit');
Route::put('/projects/{project}', [ProjectController::class, 'update'])
    ->name('projects.update');
Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])
    ->name('projects.destroy');

Route::get('/projects/{project}/eoq', [EoqController::class, 'create'])
    ->name('projects.eoq.create');
Route::post('/projects/{project}/eoq', [EoqController::class, 'store'])
    ->name('projects.eoq.store');
Route::get('/projects/{project}/analyses/{analysisRun}', [AnalysisRunController::class, 'show'])
    ->scopeBindings()
    ->name('analysis-runs.show');
