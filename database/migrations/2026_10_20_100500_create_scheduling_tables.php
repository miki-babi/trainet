<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->unsignedSmallInteger('buffer_minutes')->default(0);
            $table->string('color')->nullable();
            $table->string('location_note')->nullable();
            $table->timestamps();
        });

        Schema::create('availability_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedTinyInteger('weekday'); // 0=Sun
            $table->time('start_time');
            $table->time('end_time');
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'weekday']);
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained('users');
            $table->foreignId('appointment_type_id')->constrained();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('status')->default('pending');
            $table->string('location_note')->nullable();
            $table->text('client_note')->nullable();
            $table->text('session_notes')->nullable();
            $table->timestamps();
            $table->index(['workspace_id', 'starts_at']);
            $table->index(['client_id', 'starts_at']);
        });

        Schema::create('appointment_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->string('type');
            $table->timestamp('old_starts_at')->nullable();
            $table->timestamp('new_starts_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_events');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('availability_rules');
        Schema::dropIfExists('appointment_types');
    }
};
