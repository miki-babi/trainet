<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exercise_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('muscle_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('equipment', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_category_id')->nullable()->constrained();
            $table->foreignId('workspace_id')->nullable()->constrained();
            $table->string('name');
            $table->string('difficulty')->default('beginner');
            $table->string('movement_pattern')->nullable();
            $table->text('instructions')->nullable();
            $table->text('common_mistakes')->nullable();
            $table->text('safety_notes')->nullable();
            $table->boolean('is_custom')->default(false);
            $table->timestamps();
            $table->index(['workspace_id', 'name']);
        });

        Schema::create('exercise_muscle_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->foreignId('muscle_group_id')->constrained()->cascadeOnDelete();
            $table->unique(['exercise_id', 'muscle_group_id'], 'exercise_muscle_unique');
        });

        Schema::create('exercise_equipment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
            $table->unique(['exercise_id', 'equipment_id'], 'exercise_equipment_unique');
        });

        Schema::create('exercise_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('image');
            $table->string('path');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('exercise_alternatives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
            $table->foreignId('alternative_exercise_id')->constrained('exercises')->cascadeOnDelete();
            $table->unique(['exercise_id', 'alternative_exercise_id'], 'exercise_alternatives_unique');
        });

        Schema::create('training_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('visibility')->default('workspace');
            $table->string('status')->default('draft');
            $table->timestamps();
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('training_program_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_program_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->foreignId('created_by')->constrained('users');
            $table->string('change_summary')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->unique(['training_program_id', 'version_number'], 'program_version_unique');
        });

        Schema::create('training_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_program_version_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('order');
            $table->string('title');
            $table->boolean('is_rest_day')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['training_program_version_id', 'order'], 'training_days_order_idx');
        });

        Schema::create('training_day_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('training_day_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained();
            $table->unsignedSmallInteger('order');
            $table->string('group_label')->nullable();
            $table->unsignedSmallInteger('sets')->nullable();
            $table->string('reps')->nullable();
            $table->decimal('target_load', 8, 2)->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('distance_meters')->nullable();
            $table->decimal('rpe', 3, 1)->nullable();
            $table->decimal('rir', 3, 1)->nullable();
            $table->string('tempo')->nullable();
            $table->unsignedSmallInteger('rest_seconds')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['training_day_id', 'order'], 'day_exercises_order_idx');
        });

        Schema::create('program_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('training_program_version_id')->constrained();
            $table->foreignId('assigned_by')->constrained('users');
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->json('schedule_days')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->index(['client_id', 'status']);
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('workout_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_assignment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('training_day_id')->nullable()->constrained()->nullOnDelete();
            $table->date('scheduled_for')->nullable();
            $table->string('status')->default('scheduled');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->decimal('overall_rpe', 3, 1)->nullable();
            $table->text('client_feedback')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'scheduled_for']);
            $table->index(['client_id', 'status']);
        });

        Schema::create('workout_session_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained();
            $table->unsignedSmallInteger('order');
            $table->string('group_label')->nullable();
            $table->unsignedSmallInteger('target_sets')->nullable();
            $table->string('target_reps')->nullable();
            $table->decimal('target_load', 8, 2)->nullable();
            $table->unsignedInteger('target_duration_seconds')->nullable();
            $table->decimal('target_rpe', 3, 1)->nullable();
            $table->unsignedSmallInteger('rest_seconds')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->index(['workout_session_id', 'order'], 'session_exercises_order_idx');
        });

        Schema::create('workout_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workout_session_exercise_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('set_order');
            $table->unsignedSmallInteger('planned_reps')->nullable();
            $table->decimal('planned_load', 8, 2)->nullable();
            $table->unsignedSmallInteger('actual_reps')->nullable();
            $table->decimal('actual_load', 8, 2)->nullable();
            $table->unsignedInteger('actual_duration_seconds')->nullable();
            $table->unsignedInteger('actual_distance_meters')->nullable();
            $table->decimal('actual_rpe', 3, 1)->nullable();
            $table->decimal('actual_rir', 3, 1)->nullable();
            $table->string('status')->default('pending');
            $table->string('notes')->nullable();
            $table->timestamps();
            $table->unique(['workout_session_exercise_id', 'set_order'], 'session_exercise_set_unique');
        });

        Schema::create('personal_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('exercise_id')->constrained();
            $table->string('type');
            $table->decimal('value', 10, 2);
            $table->foreignId('workout_set_id')->nullable()->constrained('workout_sets')->nullOnDelete();
            $table->timestamp('achieved_at');
            $table->timestamps();
            $table->unique(['client_id', 'exercise_id', 'type'], 'personal_records_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_records');
        Schema::dropIfExists('workout_sets');
        Schema::dropIfExists('workout_session_exercises');
        Schema::dropIfExists('workout_sessions');
        Schema::dropIfExists('program_assignments');
        Schema::dropIfExists('training_day_exercises');
        Schema::dropIfExists('training_days');
        Schema::dropIfExists('training_program_versions');
        Schema::dropIfExists('training_programs');
        Schema::dropIfExists('exercise_alternatives');
        Schema::dropIfExists('exercise_media');
        Schema::dropIfExists('exercise_equipment');
        Schema::dropIfExists('exercise_muscle_group');
        Schema::dropIfExists('exercises');
        Schema::dropIfExists('equipment');
        Schema::dropIfExists('muscle_groups');
        Schema::dropIfExists('exercise_categories');
    }
};
