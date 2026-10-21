<?php

use App\Http\Controllers\Persona\PersonaController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/', [PersonaController::class, 'index'])->name('personas');
Route::post('/personas/{user}', [PersonaController::class, 'store'])->name('personas.login');

// Demo data reset — wipes and reseeds the database (non-production only).
Route::match(['get', 'post'], '/demo/reset', function () {
    abort_if(app()->isProduction(), 403);

    Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);

    auth()->logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();

    return redirect('/');
})->name('demo.reset');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/client.php';
require __DIR__.'/pro.php';
require __DIR__.'/settings.php';
