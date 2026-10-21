<?php

namespace App\Enums;

enum OnboardingStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Complete = 'complete';
}
