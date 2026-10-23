<?php

namespace App\Http\Controllers\Auth;

use App\Enums\OnboardingStatus;
use App\Http\Controllers\Controller;
use App\Models\AuditEvent;
use App\Models\TelegramAccount;
use App\Models\User;
use App\Support\Telegram\InitDataValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TelegramAuthController extends Controller
{
    public function __construct(
        private readonly InitDataValidator $validator,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $botToken = (string) config('services.telegram.bot_token', '');

        abort_if($botToken === '', 404);

        $request->validate(['initData' => ['required', 'string']]);

        $fields = $this->validator->validate(
            $request->string('initData')->toString(),
            $botToken,
            (int) config('services.telegram.auth_max_age', 86400),
        );

        abort_if($fields === null || empty($fields['user']['id']), 403);

        $telegramUser = $fields['user'];
        $telegramId = (string) $telegramUser['id'];

        $user = DB::transaction(function () use ($request, $telegramUser, $telegramId) {
            $account = TelegramAccount::where('telegram_user_id', $telegramId)->first();

            if ($account) {
                $account->forceFill([
                    'username' => $telegramUser['username'] ?? $account->username,
                    'first_name' => $telegramUser['first_name'] ?? null,
                    'last_name' => $telegramUser['last_name'] ?? null,
                    'verified_at' => now(),
                ])->save();

                return $account->user;
            }

            $user = $request->user() ?? $this->createClientFromTelegram($telegramUser, $telegramId);

            $user->telegramAccounts()->create([
                'telegram_user_id' => $telegramId,
                'username' => $telegramUser['username'] ?? null,
                'first_name' => $telegramUser['first_name'] ?? null,
                'last_name' => $telegramUser['last_name'] ?? null,
                'linked_at' => now(),
                'verified_at' => now(),
            ]);

            return $user;
        });

        $isNewLogin = ! $request->user();

        if ($isNewLogin) {
            Auth::login($user, true);
            $request->session()->regenerate();
        }

        AuditEvent::record($user, 'telegram_auth', $user, null, [
            'telegram_user_id' => $telegramId,
            'new_login' => $isNewLogin,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Telegram identity is the verification — synthetic email + random
     * password satisfy the schema until the user adds real credentials.
     *
     * @param  array<string, mixed>  $telegramUser
     */
    private function createClientFromTelegram(array $telegramUser, string $telegramId): User
    {
        $user = User::create([
            'name' => trim(($telegramUser['first_name'] ?? '').' '.($telegramUser['last_name'] ?? ''))
                ?: ($telegramUser['username'] ?? 'Telegram user'),
            'email' => "tg{$telegramId}@telegram.local",
            'password' => Str::password(32),
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        $user->clientProfile()->create([
            'onboarding_status' => OnboardingStatus::Pending,
        ]);

        return $user;
    }
}
