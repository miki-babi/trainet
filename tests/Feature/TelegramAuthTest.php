<?php

use App\Models\AuditEvent;
use App\Models\TelegramAccount;
use App\Models\User;

const BOT_TOKEN = 'test-bot-token-12345';

/**
 * Build a correctly-signed initData string, as the Telegram client would.
 *
 * @param  array<string, string>  $fields
 */
function signInitData(array $fields): string
{
    $pairs = $fields;
    unset($pairs['hash']);
    ksort($pairs);

    $dataCheckString = collect($pairs)
        ->map(fn ($value, $key) => $key.'='.$value)
        ->implode("\n");

    $secret = hash_hmac('sha256', BOT_TOKEN, 'WebAppData', true);
    $fields['hash'] = hash_hmac('sha256', $dataCheckString, $secret);

    ksort($fields);

    return collect($fields)
        ->map(fn ($value, $key) => $key.'='.$value)
        ->implode('&');
}

function validInitData(int $userId = 555123): string
{
    return signInitData([
        'auth_date' => (string) time(),
        'query_id' => 'AAElBOs-AAAAACUE6z4AAAAu',
        'user' => json_encode([
            'id' => $userId,
            'first_name' => 'Tessa',
            'last_name' => 'Gram',
            'username' => 'tessagram',
            'language_code' => 'en',
        ]),
    ]);
}

beforeEach(function () {
    config(['services.telegram.bot_token' => BOT_TOKEN]);
});

test('endpoint is unavailable without a configured bot token', function () {
    config(['services.telegram.bot_token' => null]);

    $this->postJson('/telegram/webapp-auth', ['initData' => validInitData()])
        ->assertNotFound();
});

test('valid initData creates a client account and signs the user in', function () {
    $this->postJson('/telegram/webapp-auth', ['initData' => validInitData()])
        ->assertOk()
        ->assertJson(['ok' => true]);

    $user = User::where('email', 'tg555123@telegram.local')->firstOrFail();

    expect($user->clientProfile)->not->toBeNull()
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->is_admin)->toBeFalse();

    $this->assertDatabaseHas('telegram_accounts', [
        'user_id' => $user->id,
        'telegram_user_id' => '555123',
        'username' => 'tessagram',
    ]);

    $this->assertAuthenticatedAs($user);

    expect(AuditEvent::where('action', 'telegram_auth')->count())->toBe(1);
});

test('returning telegram user signs in to their existing account', function () {
    $this->postJson('/telegram/webapp-auth', ['initData' => validInitData()])->assertOk();
    auth()->logout();

    $this->postJson('/telegram/webapp-auth', ['initData' => validInitData()])->assertOk();

    expect(User::count())->toBe(1)
        ->and(TelegramAccount::count())->toBe(1);

    $this->assertAuthenticated();
});

test('tampered initData is rejected', function () {
    $initData = validInitData().'&extra=injected';

    $this->postJson('/telegram/webapp-auth', ['initData' => $initData])
        ->assertForbidden();

    expect(User::count())->toBe(0);
});

test('stale initData is rejected', function () {
    $initData = signInitData([
        'auth_date' => (string) (time() - 90000),
        'user' => json_encode(['id' => 555123, 'first_name' => 'Old']),
    ]);

    $this->postJson('/telegram/webapp-auth', ['initData' => $initData])
        ->assertForbidden();
});

test('signed-in user gets their telegram identity linked', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/telegram/webapp-auth', ['initData' => validInitData()])
        ->assertOk();

    $this->assertDatabaseHas('telegram_accounts', [
        'user_id' => $user->id,
        'telegram_user_id' => '555123',
    ]);

    // No new client account was created.
    expect(User::count())->toBe(1);
});
