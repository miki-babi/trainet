<?php

use App\Models\ClientProfile;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\NutritionPlan;
use App\Models\NutritionPlanVersion;
use App\Models\PackagePurchase;
use App\Models\ProfessionalClientAssignment;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(DemoSeeder::class);
});

test('guest sees the welcome page and persona picker moved to /personas', function () {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));

    $this->get('/personas')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('personas'));
});

test('client can browse and filter the professional marketplace', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $this->actingAs($maya);

    $this->get('/app/professionals')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/professionals/index')
            ->has('professionals', 5)
            ->has('professionals.0.state')
            ->has('specialties'),
        );

    // Trainers chip: trainer + "both" profiles
    $this->get('/app/professionals?types[]=trainers')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('professionals', 3));

    // Nutritionists chip: nutritionist + "both" profiles
    $this->get('/app/professionals?types[]=nutritionists')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('professionals', 3));

    // Both type chips = everyone
    $this->get('/app/professionals?types[]=trainers&types[]=nutritionists')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('professionals', 5));

    // Specialty chip filters within results
    $this->get('/app/professionals?specialties[]='.urlencode('Weight Loss'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('professionals', 3));
});

test('client can check out and purchase a package, which activates the relationship', function () {
    $leo = User::where('email', 'leo@trainet.test')->firstOrFail();
    $selam = User::where('email', 'selam@trainet.test')->firstOrFail();
    $package = $selam->professionalProfile->packages()->firstOrFail();
    $this->actingAs($leo);

    $this->get("/app/professionals/{$selam->professionalProfile->id}/packages/{$package->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/professionals/checkout')
            ->where('package.id', $package->id),
        );

    $this->post("/app/professionals/{$selam->professionalProfile->id}/packages/{$package->id}")
        ->assertRedirect('/app/today');

    $purchase = PackagePurchase::where('client_profile_id', $leo->clientProfile->id)
        ->where('pro_package_id', $package->id)
        ->firstOrFail();
    expect($purchase->status)->toBe('paid')
        ->and($purchase->amount_cents)->toBe($package->price)
        ->and($purchase->workspace_id)->toBe($selam->workspaceMember->workspace_id);

    $assignment = ProfessionalClientAssignment::where('client_id', $leo->clientProfile->id)
        ->where('professional_id', $selam->id)
        ->firstOrFail();
    expect($assignment->status->value)->toBe('active');

    // Second purchase while active is blocked.
    $this->post("/app/professionals/{$selam->professionalProfile->id}/packages/{$package->id}")
        ->assertUnprocessable();
});

test('package from another professional cannot be purchased on this profile', function () {
    $leo = User::where('email', 'leo@trainet.test')->firstOrFail();
    $selam = User::where('email', 'selam@trainet.test')->firstOrFail();
    $hana = User::where('email', 'hana@trainet.test')->firstOrFail();
    $hanaPackage = $hana->professionalProfile->packages()->firstOrFail();

    $this->actingAs($leo)
        ->post("/app/professionals/{$selam->professionalProfile->id}/packages/{$hanaPackage->id}")
        ->assertNotFound();
});

test('pro sees purchases on the payments page and dashboard stats', function () {
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $this->actingAs($dana);

    $this->get('/pro/payments')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pro/payments/index')
            ->has('purchases', 4)
            ->has('monthRevenue')
            ->has('totalRevenue'),
        );

    $this->get('/pro/today')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pro/today')
            ->has('stats.total_clients')
            ->has('stats.month_revenue')
            ->has('recentClients'),
        );
});

test('client can view a professional profile with packages', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $selam = User::where('email', 'selam@trainet.test')->firstOrFail();

    $this->actingAs($maya)
        ->get("/app/professionals/{$selam->professionalProfile->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/professionals/show')
            ->where('professional.name', 'Selam Tesfaye')
            ->where('professional.state', 'none')
            ->has('professional.packages', 3)
            ->has('professional.certifications', 2)
            ->has('professional.testimonials', 2)
            ->where('professional.packages.2.kind', 'program'),
        );
});

test('client with an active coach can still buy a one-time program or meal plan', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $profile = $dana->professionalProfile;
    $oneTime = $profile->packages()->where('kind', 'program')->firstOrFail();
    $coaching = $profile->packages()->where('kind', 'coaching')->firstOrFail();

    // Maya already has an active assignment with Dana — a one-time offer still goes through.
    $this->actingAs($maya)
        ->post("/app/professionals/{$profile->id}/packages/{$oneTime->id}")
        ->assertRedirect("/app/professionals/{$profile->id}");

    expect(
        PackagePurchase::where('client_profile_id', $maya->clientProfile->id)
            ->where('pro_package_id', $oneTime->id)
            ->exists(),
    )->toBeTrue();

    // …but a second coaching package is still blocked.
    $this->actingAs($maya)
        ->post("/app/professionals/{$profile->id}/packages/{$coaching->id}")
        ->assertUnprocessable();
});

test('meal plan purchase goes through intake and is delivered when the coach assigns a plan', function () {
    $kim = User::where('email', 'kim@trainet.test')->firstOrFail();
    $hana = User::where('email', 'hana@trainet.test')->firstOrFail();
    $profile = $hana->professionalProfile;
    $mealPlan = $profile->packages()->where('kind', 'meal_plan')->firstOrFail();

    // Meal plans route through the intake form, not the generic checkout.
    $this->actingAs($kim)
        ->get("/app/professionals/{$profile->id}/packages/{$mealPlan->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('client/professionals/intake')
            ->where('package.id', $mealPlan->id),
        );

    // The goal is required.
    $this->post("/app/professionals/{$profile->id}/packages/{$mealPlan->id}", ['intake' => []])
        ->assertSessionHasErrors('intake.goal');

    $this->post("/app/professionals/{$profile->id}/packages/{$mealPlan->id}", [
        'intake' => [
            'goal' => 'Lose 4kg before my wedding',
            'current_weight_kg' => 72,
            'dietary_preferences' => ['High protein', 'Halal'],
            'allergies' => 'Peanuts',
            'avoid' => 'Mushrooms',
            'notes' => 'I cook for two.',
        ],
    ])->assertRedirect("/app/professionals/{$profile->id}");

    $purchase = PackagePurchase::where('client_profile_id', $kim->clientProfile->id)
        ->where('pro_package_id', $mealPlan->id)
        ->firstOrFail();
    expect($purchase->intake['goal'])->toBe('Lose 4kg before my wedding')
        ->and($purchase->delivered_at)->toBeNull();

    // A second attempt is a no-op while the plan is being prepared.
    $this->post("/app/professionals/{$profile->id}/packages/{$mealPlan->id}", [
        'intake' => ['goal' => 'again'],
    ])->assertRedirect();
    expect(PackagePurchase::where('pro_package_id', $mealPlan->id)->count())->toBe(1);

    // Hana sees the pending request with the intake on her nutrition page.
    $this->actingAs($hana)
        ->get('/pro/nutrition')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('requests.0.id', $purchase->id)
            ->where('requests.0.intake.goal', 'Lose 4kg before my wedding'),
        );

    // Assigning a published plan delivers the purchase and notifies the client.
    $plan = NutritionPlan::create([
        'workspace_id' => $hana->workspaceMember->workspace_id,
        'created_by' => $hana->id,
        'name' => 'Kim Cut Plan',
        'status' => 'active',
    ]);
    $version = NutritionPlanVersion::create([
        'nutrition_plan_id' => $plan->id,
        'version_number' => 1,
        'created_by' => $hana->id,
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->actingAs($hana)
        ->post("/pro/nutrition-versions/{$version->id}/assign", [
            'client_id' => $kim->clientProfile->id,
            'starts_on' => today()->toDateString(),
        ])
        ->assertRedirect();

    expect($purchase->refresh()->delivered_at)->not->toBeNull();

    $conversation = Conversation::where('type', 'direct')
        ->whereHas('members', fn ($q) => $q->where('user_id', $kim->id))
        ->whereHas('members', fn ($q) => $q->where('user_id', $hana->id))
        ->firstOrFail();
    $latest = Message::where('conversation_id', $conversation->id)->latest('id')->firstOrFail();
    expect($latest->sender_id)->toBe($hana->id)
        ->and($latest->body)->toContain('meal plan is ready');

    // Delivered purchase no longer shows as a pending request.
    $this->actingAs($hana)
        ->get('/pro/nutrition')
        ->assertInertia(fn (Assert $page) => $page->has('requests', 0));
});

test('client can request a professional and cannot request twice', function () {
    $leo = User::where('email', 'leo@trainet.test')->firstOrFail();
    $selam = User::where('email', 'selam@trainet.test')->firstOrFail();
    $this->actingAs($leo);

    $this->post("/app/professionals/{$selam->professionalProfile->id}/request")
        ->assertRedirect();

    $assignment = ProfessionalClientAssignment::where('client_id', $leo->clientProfile->id)
        ->where('professional_id', $selam->id)
        ->firstOrFail();
    expect($assignment->status->value)->toBe('pending')
        ->and($assignment->workspace_id)->toBe($selam->workspaceMember->workspace_id);

    $this->post("/app/professionals/{$selam->professionalProfile->id}/request")
        ->assertUnprocessable();
});

test('pro approves a pending request and an unrelated pro cannot', function () {
    $leo = User::where('email', 'leo@trainet.test')->firstOrFail();
    $selam = User::where('email', 'selam@trainet.test')->firstOrFail();
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();

    $assignment = ProfessionalClientAssignment::create([
        'workspace_id' => $selam->workspaceMember->workspace_id,
        'client_id' => $leo->clientProfile->id,
        'professional_id' => $selam->id,
        'relationship_type' => 'trainer',
        'status' => 'pending',
        'starts_on' => today()->toDateString(),
    ]);

    // Dana's workspace doesn't own this request.
    $this->actingAs($dana)
        ->post("/pro/client-requests/{$assignment->id}/approve")
        ->assertForbidden();
    expect($assignment->refresh()->status->value)->toBe('pending');

    // Selam sees it on the clients page and approves it.
    $this->actingAs($selam)
        ->get('/pro/clients')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('pendingRequests.0.id', $assignment->id),
        );

    $this->actingAs($selam)
        ->post("/pro/client-requests/{$assignment->id}/approve")
        ->assertRedirect();
    expect($assignment->refresh()->status->value)->toBe('active');
});

test('pro can decline a pending request', function () {
    $kim = User::where('email', 'kim@trainet.test')->firstOrFail();
    $abene = User::where('email', 'abene@trainet.test')->firstOrFail();

    $assignment = ProfessionalClientAssignment::create([
        'workspace_id' => $abene->workspaceMember->workspace_id,
        'client_id' => $kim->clientProfile->id,
        'professional_id' => $abene->id,
        'relationship_type' => 'trainer',
        'status' => 'pending',
        'starts_on' => today()->toDateString(),
    ]);

    $this->actingAs($abene)
        ->post("/pro/client-requests/{$assignment->id}/decline")
        ->assertRedirect();

    expect(ProfessionalClientAssignment::find($assignment->id))->toBeNull();
});

test('client can share progress metrics into the coach conversation', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();

    $conversation = Conversation::where('type', 'direct')
        ->whereHas('members', fn ($q) => $q->where('user_id', $maya->id))
        ->whereHas('members', fn ($q) => $q->where('user_id', $dana->id))
        ->firstOrFail();

    $before = Message::where('conversation_id', $conversation->id)->count();

    $this->actingAs($maya)->post('/app/progress/share')->assertRedirect();

    $latest = Message::where('conversation_id', $conversation->id)->latest('id')->firstOrFail();
    expect(Message::where('conversation_id', $conversation->id)->count())->toBe($before + 1)
        ->and($latest->sender_id)->toBe($maya->id)
        ->and($latest->body)->toContain('Progress update');
});

test('client without a coach cannot share progress', function () {
    $solo = User::create([
        'name' => 'Solo Client',
        'email' => 'solo@trainet.test',
        'password' => 'password',
    ]);
    $solo->forceFill(['email_verified_at' => now()])->save();
    ClientProfile::create(['user_id' => $solo->id]);

    $this->actingAs($solo)->post('/app/progress/share')->assertUnprocessable();
});
