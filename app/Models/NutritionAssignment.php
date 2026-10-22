<?php

namespace App\Models;

use App\Enums\AssignmentStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'client_id', 'nutrition_plan_version_id', 'assigned_by', 'starts_on', 'ends_on', 'status'])]
class NutritionAssignment extends Model
{
    use HasFactory;

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function planVersion(): BelongsTo
    {
        return $this->belongsTo(NutritionPlanVersion::class, 'nutrition_plan_version_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    protected function casts(): array
    {
        return [
            'status' => AssignmentStatus::class,
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }
}
