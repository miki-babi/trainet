<?php

namespace App\Support\Telegram;

/**
 * Validates Telegram Mini App initData per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
class InitDataValidator
{
    /**
     * Validate a raw initData string against the bot token.
     *
     * @return array<string, mixed>|null Parsed fields (with `user` decoded) or null when invalid.
     */
    public function validate(string $initData, string $botToken, int $maxAge = 86400): ?array
    {
        if ($initData === '' || $botToken === '') {
            return null;
        }

        parse_str($initData, $fields);

        $hash = $fields['hash'] ?? null;
        unset($fields['hash']);

        if (! is_string($hash) || $fields === []) {
            return null;
        }

        ksort($fields);

        $dataCheckString = collect($fields)
            ->map(fn ($value, $key) => $key.'='.$value)
            ->implode("\n");

        $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
        $expected = hash_hmac('sha256', $dataCheckString, $secretKey);

        if (! hash_equals($expected, $hash)) {
            return null;
        }

        $authDate = (int) ($fields['auth_date'] ?? 0);

        if ($authDate <= 0 || (time() - $authDate) > $maxAge) {
            return null;
        }

        if (isset($fields['user']) && is_string($fields['user'])) {
            $fields['user'] = json_decode($fields['user'], true) ?: null;
        }

        return $fields;
    }
}
