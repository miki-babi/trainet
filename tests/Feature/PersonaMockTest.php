<?php

use App\Models\Appointment;
use App\Models\AppointmentType;
use App\Models\AvailabilityRule;
use App\Models\CheckInSubmission;
use App\Models\ClientProfile;
use App\Models\Conversation;
use App\Models\Food;
use App\Models\FoodLog;
use App\Models\FoodLogItem;
use App\Models\Message;
use App\Models\NutritionAssignment;
use App\Models\NutritionPlan;
use App\Models\NutritionTarget;
use App\Models\TrainingProgram;
use App\Models\User;
use App\Models\WorkoutSession;
use Database\Seeders\DemoSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DemoSeeder::class);
});

test('persona picker lists all personas', function () {
    $this->get(route('personas'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('personas')
            ->has('personas', 8),
        );
});

test('client persona logs in and lands on client today', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();

    $this->post(route('personas.login', $maya))
        ->assertRedirect('/app/today');

    $this->get('/app/today')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/today')
            ->has('week', 7)
            ->has('habits')
            ->where('clientName', 'Maya Lindqvist'),
        );
});

test('professional persona logs in and lands on pro today', function () {
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();

    $this->post(route('personas.login', $dana))
        ->assertRedirect('/pro/today');

    $this->get('/pro/today')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pro/today')
            ->has('stats')
            ->has('attention')
            ->has('appointments'),
        );
});

test('client cannot access professional area', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();

    $this->actingAs($maya)->get('/pro/today')->assertForbidden();
});

test('professional cannot access client area', function () {
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();

    $this->actingAs($dana)->get('/app/today')->assertForbidden();
});

test('client can start a scheduled workout and log a set', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $this->actingAs($maya);

    $session = WorkoutSession::where('client_id', $maya->clientProfile->id)
        ->where('status', 'scheduled')
        ->whereDate('scheduled_for', '>=', today())
        ->orderBy('scheduled_for')
        ->firstOrFail();

    $this->post("/app/workouts/{$session->id}/start")->assertRedirect();
    expect($session->refresh()->status->value)->toBe('in_progress')
        ->and($session->exercises)->not->toBeEmpty();

    $set = $session->exercises->first()->sets->first();
    $this->put("/app/session-exercises/{$session->exercises->first()->id}/sets/{$set->id}", [
        'actual_reps' => 8,
        'actual_load' => 70,
        'status' => 'done',
    ])->assertRedirect();
    expect($set->refresh()->actual_reps)->toBe(8);

    $this->post("/app/workouts/{$session->id}/complete")->assertRedirect();
    expect($session->refresh()->status->value)->toBe('completed');
});

test('pro exercise library and program builder render', function () {
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $this->actingAs($dana);

    $this->get('/pro/exercises')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pro/exercises/index')->has('exercises'));

    $this->get('/pro/programs')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pro/programs/index'));

    $program = TrainingProgram::firstOrFail();
    $this->get("/pro/programs/{$program->id}/edit")->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pro/programs/edit')->has('version')->has('exerciseLibrary'));
});

test('client logs food and sees it in the diary', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $this->actingAs($maya);

    $food = Food::firstOrFail();
    $prior = FoodLogItem::query()
        ->whereHas('log', fn ($q) => $q->where('client_id', $maya->clientProfile->id)->whereDate('logged_on', today()))
        ->sum('calories');

    $this->post('/app/nutrition/log', [
        'meal_name' => 'Lunch',
        'logged_on' => today()->toDateString(),
        'items' => [['food_id' => $food->id, 'grams' => 200]],
    ])->assertRedirect();

    $this->get('/app/nutrition')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/nutrition/index')
            ->where('totals.calories', (int) $prior + (int) round($food->calories * 2)));
});

test('client logs a meal with just a photo', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    Storage::fake('public');
    $this->actingAs($maya);

    $this->post('/app/nutrition/log', [
        'meal_name' => 'Dinner',
        'logged_on' => today()->toDateString(),
        'photo' => UploadedFile::fake()->image('meal.jpg'),
    ])->assertRedirect();

    $log = FoodLog::latest('id')->firstOrFail();
    expect($log->photo_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists($log->photo_path))->toBeTrue();
});

test('client can delete a logged meal with a photo', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    Storage::fake('public');
    $this->actingAs($maya);

    $photoPath = UploadedFile::fake()->image('meal.jpg')->store('meal-photos', 'public');
    $log = FoodLog::create([
        'client_id' => $maya->clientProfile->id,
        'logged_on' => today(),
        'meal_name' => 'Dinner',
        'photo_path' => $photoPath,
    ]);
    $item = FoodLogItem::create([
        'food_log_id' => $log->id,
        'food_id' => Food::firstOrFail()->id,
        'grams' => 150,
        'calories' => 200,
        'protein_g' => 20,
        'carbs_g' => 10,
        'fat_g' => 5,
        'logged_at' => now(),
    ]);

    $this->delete("/app/nutrition/logs/{$log->id}")->assertRedirect();

    expect(FoodLog::find($log->id))->toBeNull()
        ->and(FoodLogItem::find($item->id))->toBeNull()
        ->and(Storage::disk('public')->exists($photoPath))->toBeFalse();
});

test('client cannot delete another client\'s logged meal', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $other = ClientProfile::where('id', '!=', $maya->clientProfile->id)->firstOrFail();

    $log = FoodLog::create([
        'client_id' => $other->id,
        'logged_on' => today(),
        'meal_name' => 'Lunch',
    ]);

    $this->actingAs($maya)->delete("/app/nutrition/logs/{$log->id}")->assertForbidden();
    expect(FoodLog::find($log->id))->not->toBeNull();
});

test('client submits a pending check-in', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $this->actingAs($maya);

    $submission = CheckInSubmission::where('client_id', $maya->clientProfile->id)
        ->where('status', 'pending')
        ->firstOrFail();

    $submission->load('schedule.template.questions');
    $answers = [];
    foreach ($submission->schedule->template->questions as $q) {
        $answers[$q->id] = $q->type->value === 'text' ? 'Feeling good' : 4;
    }

    $this->put("/app/check-ins/{$submission->id}", ['answers' => $answers])->assertRedirect();
    expect($submission->refresh()->status->value)->toBe('submitted')
        ->and($submission->answers)->not->toBeEmpty();
});

test('client books an appointment and pro can confirm it', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $type = AppointmentType::firstOrFail();

    // Book at a slot inside Dana's availability
    $day = today()->addDays(2);
    $rule = AvailabilityRule::where('user_id', $dana->id)
        ->where('weekday', (int) $day->format('N'))
        ->first();
    if (! $rule) {
        $day = today()->addDays(10);
        $rule = AvailabilityRule::where('user_id', $dana->id)
            ->where('weekday', (int) $day->format('N'))
            ->firstOrFail();
    }

    $this->actingAs($maya)->post('/app/appointments', [
        'appointment_type_id' => $type->id,
        'professional_id' => $dana->id,
        'starts_at' => $day->toDateString().' '.$rule->start_time,
    ])->assertRedirect();

    $appt = Appointment::latest('id')->firstOrFail();
    expect($appt->status->value)->toBe('pending');

    $this->actingAs($dana)->post("/pro/appointments/{$appt->id}/confirm")->assertRedirect();
    expect($appt->refresh()->status->value)->toBe('confirmed');
});

test('client and pro exchange messages', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $conversation = Conversation::firstOrFail();

    $this->actingAs($maya)->post("/app/messages/{$conversation->id}", ['body' => 'Hi coach'])
        ->assertRedirect();

    $this->actingAs($dana)->get("/pro/messages/{$conversation->id}")->assertOk();
    $this->actingAs($dana)->post("/pro/messages/{$conversation->id}", ['body' => 'Hi Maya'])
        ->assertRedirect();

    expect(Message::where('conversation_id', $conversation->id)->latest('id')->first()->body)
        ->toBe('Hi Maya');
});

test('pro publishes and assigns a nutrition plan', function () {
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $this->actingAs($dana);

    // Create a fresh plan through the builder endpoint — yields draft v1
    $this->post('/pro/nutrition-plans', ['name' => 'Test Cut Plan'])->assertRedirect();
    $plan = NutritionPlan::latest('id')->firstOrFail();
    $draft = $plan->versions()->where('status', 'draft')->firstOrFail();

    $this->post("/pro/nutrition-plans/{$plan->id}/publish")->assertRedirect();
    expect($draft->refresh()->status->value)->toBe('published');

    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $this->post("/pro/nutrition-versions/{$draft->id}/assign", [
        'client_id' => $maya->clientProfile->id,
        'starts_on' => today()->toDateString(),
        'calories' => 1900,
        'protein_g' => 140,
    ])->assertRedirect();

    expect(NutritionAssignment::where('client_id', $maya->clientProfile->id)->where('status', 'active')->exists())->toBeTrue()
        ->and(NutritionTarget::where('client_id', $maya->clientProfile->id)->where('calories', 1900)->exists())->toBeTrue();
});

test('pro reviews a submitted check-in', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();

    $submission = CheckInSubmission::where('client_id', $maya->clientProfile->id)
        ->where('status', 'submitted')
        ->first();

    if (! $submission) {
        $submission = CheckInSubmission::where('client_id', $maya->clientProfile->id)
            ->where('status', 'pending')
            ->firstOrFail();
        $submission->update(['status' => 'submitted', 'submitted_at' => now()]);
    }

    $this->actingAs($dana)->post("/pro/check-in-submissions/{$submission->id}/review", [
        'comment' => 'Strong week.',
        'private_note' => 'Watch energy ratings.',
    ])->assertRedirect();

    expect($submission->refresh()->status->value)->toBe('reviewed')
        ->and($submission->review)->not->toBeNull();
});

test('pro client directory and profile render', function () {
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $this->actingAs($dana);

    $this->get('/pro/clients')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pro/clients/index')
            ->has('clients', 5),
        );

    $maya = ClientProfile::firstOrFail();

    $this->get("/pro/clients/{$maya->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pro/clients/show'));
});
