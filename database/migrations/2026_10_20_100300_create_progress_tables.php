<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->string('title');
            $table->string('metric')->nullable();
            $table->decimal('start_value', 10, 2)->nullable();
            $table->decimal('target_value', 10, 2)->nullable();
            $table->string('unit')->nullable();
            $table->date('due_on')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->index(['client_id', 'status']);
        });

        Schema::create('goal_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goal_id')->constrained()->cascadeOnDelete();
            $table->decimal('value', 10, 2)->nullable();
            $table->timestamp('noted_at');
            $table->string('note')->nullable();
            $table->timestamps();
        });

        Schema::create('metric_definitions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained();
            $table->string('key');
            $table->string('name');
            $table->string('unit')->default('kg');
            $table->string('canonical_unit')->nullable();
            $table->timestamps();
            $table->unique(['workspace_id', 'key']);
        });

        Schema::create('client_metric_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('metric_definition_id')->constrained()->cascadeOnDelete();
            $table->decimal('value', 10, 2);
            $table->string('unit');
            $table->date('observed_on');
            $table->string('source')->default('manual');
            $table->string('visibility')->default('client_and_coach');
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'observed_on']);
        });

        Schema::create('progress_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->string('path');
            $table->date('taken_on');
            $table->string('label')->nullable();
            $table->string('visibility')->default('client_and_coach');
            $table->timestamps();
            $table->index(['client_id', 'taken_on']);
        });

        Schema::create('check_in_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('check_in_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('check_in_template_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('order');
            $table->string('prompt');
            $table->string('type');
            $table->boolean('required')->default(true);
            $table->json('config')->nullable();
            $table->timestamps();
        });

        Schema::create('check_in_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('check_in_template_id')->constrained()->cascadeOnDelete();
            $table->string('frequency')->default('weekly');
            $table->unsignedTinyInteger('weekday')->default(1); // 1=Mon
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->index(['client_id', 'status']);
        });

        Schema::create('check_in_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('check_in_schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->date('due_on');
            $table->timestamp('submitted_at')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->index(['client_id', 'due_on']);
            $table->index(['status', 'due_on']);
        });

        Schema::create('check_in_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('check_in_submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('check_in_question_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('value_rating')->nullable();
            $table->text('value_text')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();
            $table->unique(['check_in_submission_id', 'check_in_question_id'], 'checkin_answer_unique');
        });

        Schema::create('check_in_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('check_in_submission_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users');
            $table->text('comment')->nullable();
            $table->text('private_note')->nullable();
            $table->timestamp('reviewed_at');
            $table->timestamps();
        });

        Schema::create('plan_change_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->string('type');
            $table->string('summary');
            $table->json('details')->nullable();
            $table->timestamp('created_at');
            $table->index(['client_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_change_events');
        Schema::dropIfExists('check_in_reviews');
        Schema::dropIfExists('check_in_answers');
        Schema::dropIfExists('check_in_submissions');
        Schema::dropIfExists('check_in_schedules');
        Schema::dropIfExists('check_in_questions');
        Schema::dropIfExists('check_in_templates');
        Schema::dropIfExists('progress_photos');
        Schema::dropIfExists('client_metric_entries');
        Schema::dropIfExists('metric_definitions');
        Schema::dropIfExists('goal_updates');
        Schema::dropIfExists('goals');
    }
};
