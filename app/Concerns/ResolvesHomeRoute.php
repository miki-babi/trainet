<?php

namespace App\Concerns;

use App\Enums\OnboardingStatus;
use App\Models\User;

trait ResolvesHomeRoute
{
    /**
     * Resolve the post-auth landing path for the given user.
     */
    private function homeRoute(?User $user): string
    {
        if (! $user) {
            return '/';
        }

        if ($user->isAdmin()) {
            return '/admin';
        }

        if ($user->isProfessional()) {
            return '/pro/today';
        }

        if ($user->isClient()) {
            return $user->clientProfile->onboarding_status === OnboardingStatus::Complete
                ? '/app/today'
                : '/app/onboarding';
        }

        return '/dashboard';
    }
}
