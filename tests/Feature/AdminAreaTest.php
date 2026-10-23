<?php

use App\Models\AuditEvent;
use App\Models\PackagePurchase;
use App\Models\ProPackage;
use App\Models\User;
use Database\Seeders\DemoSeeder;

beforeEach(function () {
    $this->seed(DemoSeeder::class);
    $this->admin = User::where('email', 'admin@trainet.test')->firstOrFail();
});

test('non-admin users cannot access the admin area', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();

    $this->actingAs($maya)->get('/admin')->assertForbidden();
});

test('guests are redirected away from the admin area', function () {
    $this->get('/admin')->assertRedirect();
});

test('admin can view the dashboard with platform stats', function () {
    $this->actingAs($this->admin)->get('/admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('stats.users')
            ->has('pendingProfessionals')
            ->has('recentUsers')
            ->has('recentPurchases'));
});

test('admin can approve and reject professionals', function () {
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $profile = $dana->professionalProfile;
    $profile->update(['approval_status' => 'pending', 'approved_at' => null]);

    $this->actingAs($this->admin)
        ->post("/admin/professionals/{$profile->id}/approve")
        ->assertRedirect();

    expect($profile->fresh()->approval_status)->toBe('approved')
        ->and($profile->fresh()->approved_by)->toBe($this->admin->id);

    $this->actingAs($this->admin)
        ->post("/admin/professionals/{$profile->id}/reject", ['reason' => 'incomplete credentials'])
        ->assertRedirect();

    expect($profile->fresh()->approval_status)->toBe('rejected')
        ->and($profile->fresh()->rejection_reason)->toBe('incomplete credentials');

    expect(AuditEvent::where('action', 'professional.approved')->count())->toBe(1)
        ->and(AuditEvent::where('action', 'professional.rejected')->count())->toBe(1);
});

test('pending professionals are hidden from the marketplace until approved', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();
    $dana = User::where('email', 'dana@trainet.test')->firstOrFail();
    $dana->professionalProfile->update(['approval_status' => 'pending']);

    $this->actingAs($maya)->get('/app/professionals')
        ->assertInertia(fn ($page) => $page->has('professionals', 4));

    $this->actingAs($maya)->get("/app/professionals/{$dana->professionalProfile->id}")->assertNotFound();
});

test('admin can suspend and reactivate users, and suspended users are logged out', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();

    $this->actingAs($this->admin)
        ->post("/admin/users/{$maya->id}/suspend")
        ->assertRedirect();

    expect($maya->fresh()->status)->toBe('suspended');

    // Suspended user is force-logged-out on next request.
    $this->actingAs($maya->fresh())->get('/app/today')
        ->assertRedirect(route('login'));
    $this->assertGuest();

    $this->actingAs($this->admin)
        ->post("/admin/users/{$maya->id}/activate")
        ->assertRedirect();

    expect($maya->fresh()->status)->toBe('active');
    expect(AuditEvent::where('action', 'user.suspended')->count())->toBe(1);
});

test('admins cannot suspend or delete admin accounts or themselves', function () {
    $other = User::factory()->create(['is_admin' => true]);
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();

    $this->actingAs($this->admin)
        ->post("/admin/users/{$this->admin->id}/suspend")
        ->assertStatus(422);

    $this->actingAs($this->admin)
        ->post("/admin/users/{$other->id}/suspend")
        ->assertStatus(422);

    $this->actingAs($this->admin)
        ->delete("/admin/users/{$maya->id}")
        ->assertRedirect(route('admin.users.index'));

    expect($maya->fresh()->status)->toBe('deleted');
});

test('admin can refund a purchase and the action is audited', function () {
    $purchase = PackagePurchase::firstOrFail();

    $this->actingAs($this->admin)
        ->post("/admin/purchases/{$purchase->id}/refund")
        ->assertRedirect();

    expect($purchase->fresh()->status)->toBe('refunded');
    expect(AuditEvent::where('action', 'purchase.refunded')->count())->toBe(1);
});

test('admin can hide and unhide marketplace offers', function () {
    $package = ProPackage::firstOrFail();

    $this->actingAs($this->admin)
        ->post("/admin/packages/{$package->id}/toggle")
        ->assertRedirect();

    expect($package->fresh()->is_hidden)->toBeTrue();

    $this->actingAs($this->admin)
        ->post("/admin/packages/{$package->id}/toggle")
        ->assertRedirect();

    expect($package->fresh()->is_hidden)->toBeFalse();
});

test('trainet:admin command grants and revokes admin access', function () {
    $maya = User::where('email', 'maya@trainet.test')->firstOrFail();

    $this->artisan('trainet:admin', ['email' => 'maya@trainet.test'])
        ->assertSuccessful();
    expect($maya->fresh()->is_admin)->toBeTrue();

    $this->artisan('trainet:admin', ['email' => 'maya@trainet.test', '--revoke' => true])
        ->assertSuccessful();
    expect($maya->fresh()->is_admin)->toBeFalse();

    $this->artisan('trainet:admin', ['email' => 'ghost@trainet.test'])
        ->assertFailed();
});
