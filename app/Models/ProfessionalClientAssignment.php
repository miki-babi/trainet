<?php

namespace App\Models;

use App\Enums\AssignmentStatus;
use App\Enums\RelationshipType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'client_id', 'professional_id', 'relationship_type', 'status', 'permissions', 'starts_on', 'ends_on'])]
class ProfessionalClientAssignment extends Model
{
    use HasFactory;

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(ClientProfile::class, 'client_id');
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    protected function casts(): array
    {
        return [
            'relationship_type' => RelationshipType::class,
            'status' => AssignmentStatus::class,
            'permissions' => 'array',
            'starts_on' => 'date',
            'ends_on' => 'date',
        ];
    }
}
