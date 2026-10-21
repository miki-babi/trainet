<?php

use App\Http\Controllers\Pro\AppointmentController;
use App\Http\Controllers\Pro\AppointmentTypeController;
use App\Http\Controllers\Pro\AvailabilityController;
use App\Http\Controllers\Pro\CalendarController;
use App\Http\Controllers\Pro\CheckInController;
use App\Http\Controllers\Pro\ContentController;
use App\Http\Controllers\Pro\ClientController;
use App\Http\Controllers\Pro\ExerciseController;
use App\Http\Controllers\Pro\FoodController;
use App\Http\Controllers\Pro\MemberController;
use App\Http\Controllers\Pro\MessageController;
use App\Http\Controllers\Pro\NutritionPlanController;
use App\Http\Controllers\Pro\ProgramController;
use App\Http\Controllers\Pro\ReportController;
use App\Http\Controllers\Pro\SettingController;
use App\Http\Controllers\Pro\TodayController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'professional'])->prefix('pro')->name('pro.')->group(function () {
    Route::get('/today', [TodayController::class, 'index'])->name('today');

    // Clients
    Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
    Route::get('/clients/{clientProfile}', [ClientController::class, 'show'])->name('clients.show');
    Route::post('/clients/{clientProfile}/notes', [ClientController::class, 'storeNote'])->name('clients.notes.store');
    Route::post('/clients/{clientProfile}/tags', [ClientController::class, 'syncTags'])->name('clients.tags.sync');
    Route::post('/clients/{clientProfile}/status', [ClientController::class, 'updateStatus'])->name('clients.status.update');
    Route::post('/invites', [ClientController::class, 'storeInvite'])->name('invites.store');

    // Content hub: programs + exercises + nutrition plans
    Route::get('/content', [ContentController::class, 'index'])->name('content.index');

    // Exercise library
    Route::get('/exercises', [ExerciseController::class, 'index'])->name('exercises.index');
    Route::get('/exercises/create', [ExerciseController::class, 'create'])->name('exercises.create');
    Route::post('/exercises', [ExerciseController::class, 'store'])->name('exercises.store');
    Route::get('/exercises/{exercise}/edit', [ExerciseController::class, 'edit'])->name('exercises.edit');
    Route::put('/exercises/{exercise}', [ExerciseController::class, 'update'])->name('exercises.update');

    // Training programs
    Route::get('/programs', [ProgramController::class, 'index'])->name('programs.index');
    Route::post('/programs', [ProgramController::class, 'store'])->name('programs.store');
    Route::get('/programs/{trainingProgram}/edit', [ProgramController::class, 'edit'])->name('programs.edit');
    Route::put('/programs/{trainingProgram}', [ProgramController::class, 'update'])->name('programs.update');
    Route::post('/programs/{trainingProgram}/days', [ProgramController::class, 'storeDay'])->name('programs.days.store');
    Route::put('/days/{trainingDay}', [ProgramController::class, 'updateDay'])->name('days.update');
    Route::delete('/days/{trainingDay}', [ProgramController::class, 'destroyDay'])->name('days.destroy');
    Route::post('/days/{trainingDay}/exercises', [ProgramController::class, 'storeDayExercise'])->name('days.exercises.store');
    Route::put('/day-exercises/{trainingDayExercise}', [ProgramController::class, 'updateDayExercise'])->name('day-exercises.update');
    Route::delete('/day-exercises/{trainingDayExercise}', [ProgramController::class, 'destroyDayExercise'])->name('day-exercises.destroy');
    Route::post('/programs/{trainingProgram}/publish', [ProgramController::class, 'publish'])->name('programs.publish');
    Route::post('/program-versions/{trainingProgramVersion}/assign', [ProgramController::class, 'assign'])->name('versions.assign');
    Route::get('/programs/{trainingProgram}/preview', [ProgramController::class, 'preview'])->name('programs.preview');

    // Nutrition content
    Route::get('/nutrition', [NutritionPlanController::class, 'index'])->name('nutrition.index');
    Route::get('/foods', [FoodController::class, 'index'])->name('foods.index');
    Route::post('/foods', [FoodController::class, 'store'])->name('foods.store');
    Route::put('/foods/{food}', [FoodController::class, 'update'])->name('foods.update');
    Route::post('/nutrition-plans', [NutritionPlanController::class, 'store'])->name('nutrition-plans.store');
    Route::get('/nutrition-plans/{nutritionPlan}/edit', [NutritionPlanController::class, 'edit'])->name('nutrition-plans.edit');
    Route::post('/plan-days/{nutritionPlanDay}/meals', [NutritionPlanController::class, 'storeMeal'])->name('plan-days.meals.store');
    Route::post('/meals/{meal}/items', [NutritionPlanController::class, 'storeMealItem'])->name('meals.items.store');
    Route::delete('/meal-items/{mealItem}', [NutritionPlanController::class, 'destroyMealItem'])->name('meal-items.destroy');
    Route::post('/nutrition-plans/{nutritionPlan}/publish', [NutritionPlanController::class, 'publish'])->name('nutrition-plans.publish');
    Route::post('/nutrition-versions/{nutritionPlanVersion}/assign', [NutritionPlanController::class, 'assign'])->name('nutrition-versions.assign');

    // Check-ins
    Route::get('/check-ins', [CheckInController::class, 'index'])->name('check-ins.index');
    Route::post('/check-in-templates', [CheckInController::class, 'storeTemplate'])->name('check-in-templates.store');
    Route::get('/check-in-templates/{checkInTemplate}/edit', [CheckInController::class, 'editTemplate'])->name('check-in-templates.edit');
    Route::put('/check-in-templates/{checkInTemplate}', [CheckInController::class, 'updateTemplate'])->name('check-in-templates.update');
    Route::post('/check-in-schedules', [CheckInController::class, 'storeSchedule'])->name('check-in-schedules.store');
    Route::get('/check-in-submissions', [CheckInController::class, 'submissions'])->name('check-in-submissions.index');
    Route::get('/check-in-submissions/{checkInSubmission}', [CheckInController::class, 'showSubmission'])->name('check-in-submissions.show');
    Route::post('/check-in-submissions/{checkInSubmission}/review', [CheckInController::class, 'storeReview'])->name('check-in-submissions.review');

    // Messages
    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::post('/messages/with/{clientProfile}', [MessageController::class, 'withClient'])->name('messages.with');
    Route::get('/messages/{conversation}', [MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{conversation}', [MessageController::class, 'store'])->name('messages.store');

    // Scheduling
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('/availability', [AvailabilityController::class, 'edit'])->name('availability.edit');
    Route::put('/availability', [AvailabilityController::class, 'update'])->name('availability.update');
    Route::get('/appointment-types', [AppointmentTypeController::class, 'index'])->name('appointment-types.index');
    Route::post('/appointment-types', [AppointmentTypeController::class, 'store'])->name('appointment-types.store');
    Route::put('/appointment-types/{appointmentType}', [AppointmentTypeController::class, 'update'])->name('appointment-types.update');
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
    Route::post('/appointments/{appointment}/confirm', [AppointmentController::class, 'confirm'])->name('appointments.confirm');
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule'])->name('appointments.reschedule');
    Route::put('/appointments/{appointment}/notes', [AppointmentController::class, 'updateNotes'])->name('appointments.notes');

    // Workspace
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');
    Route::get('/members', [MemberController::class, 'index'])->name('members.index');
});
