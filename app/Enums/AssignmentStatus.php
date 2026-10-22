<?php

namespace App\Enums;

enum AssignmentStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Paused = 'paused';
    case Ended = 'ended';
}
