<?php

namespace App\Enums;

enum ProfessionalType: string
{
    case Trainer = 'trainer';
    case Nutritionist = 'nutritionist';
    case Both = 'both';
}
