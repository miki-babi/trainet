<?php

namespace App\Enums;

enum MetricVisibility: string
{
    case ClientAndCoach = 'client_and_coach';
    case CoachOnly = 'coach_only';
    case Private = 'private';
}
