<?php

use App\Http\Controllers\Auth\TelegramAuthController;
use App\Http\Controllers\Persona\PersonaController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Telegram Mini App — validated initData sign-in/account linking.
Route::post('/telegram/webapp-auth', TelegramAuthController::class)
    ->middleware('throttle:10,1')
    ->name('telegram.webapp-auth');

if (config('trainet.demo')) {
    Route::get('/personas', [PersonaController::class, 'index'])->name('personas');
    Route::post('/personas/{user}', [PersonaController::class, 'store'])->name('personas.login');

    // Demo data reset — wipes and reseeds the database.
    Route::match(['get', 'post'], '/demo/reset', function () {
        abort_unless(config('trainet.demo'), 404);

        Artisan::call('migrate:fresh', ['--seed' => true, '--force' => true]);

        auth()->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect('/');
    })->name('demo.reset');

    Route::get('/optimize', function () {
        Artisan::call('optimize');

        return Artisan::output();
    })->name('optimize');

    Route::get('/optimize-clear', function () {
        Artisan::call('optimize:clear');

        return Artisan::output();
    })->name('optimize.clear');

    Route::get('/storage-link', function () {
        Artisan::call('storage:link');

        return Artisan::output();
    })->name('storage.link');
}

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/client.php';
require __DIR__.'/pro.php';
require __DIR__.'/admin.php';
require __DIR__.'/settings.php';
