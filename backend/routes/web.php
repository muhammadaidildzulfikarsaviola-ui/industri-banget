<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProjectController;


Route::inertia('/', 'welcome')->name('home');
Route::get('/projects', [ProjectController::class, 'index'])
    ->name('projects.index');

Route::post('/projects', [ProjectController::class, 'store'])
    ->name('projects.store');