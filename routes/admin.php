<?php

use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ModerationController;
use App\Http\Controllers\Admin\ProfessionalController;
use App\Http\Controllers\Admin\PurchaseController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/professionals', [ProfessionalController::class, 'index'])->name('professionals.index');
    Route::get('/professionals/{professionalProfile}', [ProfessionalController::class, 'show'])->name('professionals.show');
    Route::post('/professionals/{professionalProfile}/approve', [ProfessionalController::class, 'approve'])->name('professionals.approve');
    Route::post('/professionals/{professionalProfile}/reject', [ProfessionalController::class, 'reject'])->name('professionals.reject');

    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
    Route::post('/users/{user}/suspend', [UserController::class, 'suspend'])->name('users.suspend');
    Route::post('/users/{user}/activate', [UserController::class, 'activate'])->name('users.activate');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::post('/purchases/{purchase}/refund', [PurchaseController::class, 'refund'])->name('purchases.refund');

    Route::get('/moderation', [ModerationController::class, 'index'])->name('moderation.index');
    Route::post('/packages/{proPackage}/toggle', [ModerationController::class, 'togglePackage'])->name('packages.toggle');

    Route::get('/audit', [AuditLogController::class, 'index'])->name('audit.index');
});
