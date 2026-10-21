<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['workspace_id', 'key', 'name', 'unit', 'canonical_unit'])]
class MetricDefinition extends Model
{
    use HasFactory;
}
