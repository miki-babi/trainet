<?php

namespace App\Enums;

enum WorkspaceMemberRole: string
{
    case Owner = 'owner';
    case Trainer = 'trainer';
    case Nutritionist = 'nutritionist';
    case Assistant = 'assistant';
}
