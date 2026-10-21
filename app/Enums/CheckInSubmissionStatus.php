<?php

namespace App\Enums;

enum CheckInSubmissionStatus: string
{
    case Pending = 'pending';
    case Submitted = 'submitted';
    case Reviewed = 'reviewed';
    case Missed = 'missed';
}
