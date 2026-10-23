<?php

use App\Enums\OnboardingStatus;
use App\Models\User;
use Database\Seeders\ReferenceSeeder;
use Illuminate\Support\Facades\Artisan;

beforeEach(function () {
    $this->seed(ReferenceSeeder::class);
});

test('registering as a client creates a client profile and lands on onboarding', function () {
    $response = $this->post('/register', [
        'name' => 'New Client',
        'email' => 'client@example.com',
        'password' => 'password123!',
        'password_confirmation' => 'password123!',
        'account_type' => 'client',
    ]);

    $user = User::where('email', 'client@example.com')->firstOrFail();

    expect($user->clientProfile)->not->toBeNull()
        ->and($user->clientProfile->onboarding_status)->toBe(OnboardingStatus::Pending)
        ->and($user->professionalProfile)->toBeNull();

    $response->assertRedirect('/app/onboarding');
});

test('registering as a professional creates a pending profile and solo workspace', function () {
    $response = $this->post('/register', [
        'name' => 'New Coach',
        'email' => 'coach@example.com',
        'password' => 'password123!',
        'password_confirmation' => 'password123!',
        'account_type' => 'professional',
        'professional_type' => 'trainer',
        'business_name' => 'Coach Co',
    ]);

    $user = User::where('email', 'coach@example.com')->firstOrFail();

    expect($user->professionalProfile)->not->toBeNull()
        ->and($user->professionalProfile->approval_status)->toBe('pending')
        ->and($user->professionalProfile->business_name)->toBe('Coach Co')
        ->and($user->workspaceMember)->not->toBeNull()
        ->and($user->workspaceMember->workspace->name)->toBe('Coach Co')
        ->and($user->clientProfile)->toBeNull();

    $response->assertRedirect('/pro/today');
});

test('professional registration requires pro fields', function () {
    $this->post('/register', [
        'name' => 'Coach',
        'email' => 'coach@example.com',
        'password' => 'password123!',
        'password_confirmation' => 'password123!',
        'account_type' => 'professional',
    ])->assertSessionHasErrors(['professional_type', 'business_name']);
});

test('account_type is required', function () {
    $this->post('/register', [
        'name' => 'Someone',
        'email' => 'x@example.com',
        'password' => 'password123!',
        'password_confirmation' => 'password123!',
    ])->assertSessionHasErrors('account_type');
});

test('demo routes respond based on the TRAINET_DEMO flag', function () {
    // Demo enabled (default outside production): personas page works.
    config(['trainet.demo' => true]);
    $this->get('/personas')->assertOk();

    // Demo disabled: persona routes are gone.
    config(['trainet.demo' => false]);
    $this->app['router']->getRoutes()->refreshNameLookups();
    Artisan::call('route:clear');
    $this->get('/personas')->assertNotFound();
});
