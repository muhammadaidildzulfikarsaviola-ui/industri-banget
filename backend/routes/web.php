<?php

use App\Http\Controllers\AnalysisRunController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\EoqController;
use App\Http\Controllers\ForecastingController;
use App\Http\Controllers\MrpController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SpcController;
use App\Models\Project;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])
        ->name('login');
    Route::post('/login', [LoginController::class, 'store'])
        ->middleware('throttle:5,1')
        ->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::get('/', fn () => Inertia\Inertia::render('welcome', [
        'recentProjects' => Project::query()
            ->latest('updated_at')
            ->limit(5)
            ->get(['id', 'name', 'industry', 'status', 'updated_at']),
    ]))->name('home');

    Route::post('/logout', [LoginController::class, 'destroy'])
        ->name('logout');

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
    Route::get('/projects/{project}/forecasting', [ForecastingController::class, 'create'])
        ->name('projects.forecasting.create');
    Route::post('/projects/{project}/forecasting', [ForecastingController::class, 'store'])
        ->name('projects.forecasting.store');
    Route::get('/projects/{project}/mrp', [MrpController::class, 'create'])
        ->name('projects.mrp.create');
    Route::post('/projects/{project}/mrp/items', [MrpController::class, 'storeItem'])
        ->name('projects.mrp.items.store');
    Route::put('/projects/{project}/mrp/items/{item}', [MrpController::class, 'updateItem'])
        ->name('projects.mrp.items.update');
    Route::delete('/projects/{project}/mrp/items/{item}', [MrpController::class, 'destroyItem'])
        ->name('projects.mrp.items.destroy');
    Route::post('/projects/{project}/mrp/bom', [MrpController::class, 'storeBomLine'])
        ->name('projects.mrp.bom.store');
    Route::put('/projects/{project}/mrp/bom/{bomLine}', [MrpController::class, 'updateBomLine'])
        ->name('projects.mrp.bom.update');
    Route::delete('/projects/{project}/mrp/bom/{bomLine}', [MrpController::class, 'destroyBomLine'])
        ->name('projects.mrp.bom.destroy');
    Route::post('/projects/{project}/mrp', [MrpController::class, 'store'])
        ->name('projects.mrp.store');
    Route::get('/projects/{project}/spc', [SpcController::class, 'create'])
        ->name('projects.spc.create');
    Route::post('/projects/{project}/spc', [SpcController::class, 'store'])
        ->name('projects.spc.store');
    Route::get('/projects/{project}/analyses/{analysisRun}', [AnalysisRunController::class, 'show'])
        ->scopeBindings()
        ->name('analysis-runs.show');
});
