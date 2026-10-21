<?php

namespace App\Enums;

enum AssignmentStatus: string
{
    case Active = 'active';
    case Paused = 'paused';
    case Ended = 'ended';
}
