<?php

namespace App\Enums;

enum WorkoutSessionStatus: string
{
    case Scheduled = 'scheduled';
    case InProgress = 'in_progress';
    case Paused = 'paused';
    case Completed = 'completed';
    case Skipped = 'skipped';
}
