<?php

use App\Http\Controllers\Client\AppointmentController;
use App\Http\Controllers\Client\CheckInController;
use App\Http\Controllers\Client\ExerciseController;
use App\Http\Controllers\Client\HabitController;
use App\Http\Controllers\Client\HistoryController;
use App\Http\Controllers\Client\MessageController;
use App\Http\Controllers\Client\NutritionController;
use App\Http\Controllers\Client\OnboardingController;
use App\Http\Controllers\Client\ProfileController;
use App\Http\Controllers\Client\ProgressController;
use App\Http\Controllers\Client\TodayController;
use App\Http\Controllers\Client\TrainingController;
use App\Http\Controllers\Client\WorkoutSessionController;
use App\Http\Controllers\Client\WorkoutSessionExerciseController;
use App\Http\Controllers\Client\WorkoutSetController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'client'])->prefix('app')->name('client.')->group(function () {
    Route::get('/today', [TodayController::class, 'index'])->name('today');

    Route::get('/onboarding', [OnboardingController::class, 'edit'])->name('onboarding.edit');
    Route::put('/onboarding', [OnboardingController::class, 'update'])->name('onboarding.update');

    Route::get('/training', [TrainingController::class, 'index'])->name('training.index');
    Route::get('/training/days/{trainingDay}', [TrainingController::class, 'day'])->name('training.day');

    Route::get('/history', [HistoryController::class, 'index'])->name('history.index');

    Route::get('/workouts/{workoutSession}', [WorkoutSessionController::class, 'show'])->name('workouts.show');
    Route::post('/workouts/{workoutSession}/start', [WorkoutSessionController::class, 'start'])->name('workouts.start');
    Route::post('/workouts/{workoutSession}/pause', [WorkoutSessionController::class, 'pause'])->name('workouts.pause');
    Route::post('/workouts/{workoutSession}/resume', [WorkoutSessionController::class, 'resume'])->name('workouts.resume');
    Route::post('/workouts/{workoutSession}/complete', [WorkoutSessionController::class, 'complete'])->name('workouts.complete');
    Route::post('/workouts/{workoutSession}/skip', [WorkoutSessionController::class, 'skip'])->name('workouts.skip');
    Route::put('/workouts/{workoutSession}', [WorkoutSessionController::class, 'update'])->name('workouts.update');

    Route::put('/session-exercises/{workoutSessionExercise}/sets/{workoutSet}', [WorkoutSetController::class, 'update'])->name('sets.update');
    Route::post('/session-exercises/{workoutSessionExercise}/sets', [WorkoutSetController::class, 'store'])->name('sets.store');
    Route::post('/session-exercises/{workoutSessionExercise}/skip', [WorkoutSessionExerciseController::class, 'skip'])->name('session-exercises.skip');
    Route::put('/session-exercises/{workoutSessionExercise}/replace', [WorkoutSessionExerciseController::class, 'replace'])->name('session-exercises.replace');

    Route::get('/exercises', [ExerciseController::class, 'index'])->name('exercises.index');
    Route::get('/exercises/{exercise}', [ExerciseController::class, 'show'])->name('exercises.show');

    Route::get('/nutrition', [NutritionController::class, 'index'])->name('nutrition.index');
    Route::get('/nutrition/log', [NutritionController::class, 'create'])->name('nutrition.create');
    Route::post('/nutrition/log', [NutritionController::class, 'store'])->name('nutrition.store');
    Route::delete('/nutrition/items/{foodLogItem}', [NutritionController::class, 'destroyItem'])->name('nutrition.items.destroy');
    Route::post('/water', [NutritionController::class, 'storeWater'])->name('water.store');

    Route::get('/habits', [HabitController::class, 'index'])->name('habits.index');
    Route::post('/habits/{habitAssignment}/toggle', [HabitController::class, 'toggle'])->name('habits.toggle');

    Route::get('/progress', [ProgressController::class, 'index'])->name('progress.index');
    Route::post('/progress/metrics', [ProgressController::class, 'storeMetric'])->name('metrics.store');
    Route::post('/progress/photos', [ProgressController::class, 'storePhoto'])->name('photos.store');
    Route::post('/progress/quick', [ProgressController::class, 'quickLog'])->name('progress.quick');

    Route::get('/check-ins', [CheckInController::class, 'index'])->name('check-ins.index');
    Route::get('/check-ins/{checkInSubmission}/edit', [CheckInController::class, 'edit'])->name('check-ins.edit');
    Route::put('/check-ins/{checkInSubmission}', [CheckInController::class, 'update'])->name('check-ins.update');
    Route::get('/check-ins/{checkInSubmission}', [CheckInController::class, 'show'])->name('check-ins.show');

    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::get('/messages/{conversation}', [MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{conversation}', [MessageController::class, 'store'])->name('messages.store');

    Route::get('/appointments', [AppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/appointments/book', [AppointmentController::class, 'create'])->name('appointments.create');
    Route::post('/appointments', [AppointmentController::class, 'store'])->name('appointments.store');
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule'])->name('appointments.reschedule');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
});
