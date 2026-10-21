<?php

namespace App\Enums;

enum WorkStatus: string
{
    case Pending = 'pending';
    case Done = 'done';
    case Skipped = 'skipped';
}
