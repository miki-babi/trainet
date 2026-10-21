<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('locale', 10)->default('en');
            $table->string('timezone')->default('UTC');
            $table->string('unit_preference')->default('metric');
            $table->string('status')->default('active');
        });

        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('solo'); // solo|studio
            $table->foreignId('owner_id')->constrained('users');
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('workspace_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role');
            $table->string('status')->default('active');
            $table->json('permission_overrides')->nullable();
            $table->timestamps();
            $table->unique(['workspace_id', 'user_id']);
        });

        Schema::create('telegram_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('telegram_user_id')->unique();
            $table->string('username')->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->timestamp('linked_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('professional_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('professional_type');
            $table->text('bio')->nullable();
            $table->text('credentials')->nullable();
            $table->string('business_name')->nullable();
            $table->timestamps();
        });

        Schema::create('client_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('onboarding_status')->default('pending');
            $table->text('goals_summary')->nullable();
            $table->string('experience_level')->nullable();
            $table->json('equipment')->nullable();
            $table->json('training_days')->nullable();
            $table->json('dietary_preferences')->nullable();
            $table->text('allergies')->nullable();
            $table->unsignedSmallInteger('height_cm')->nullable();
            $table->unsignedSmallInteger('birth_year')->nullable();
            $table->timestamp('consent_accepted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('professional_client_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained('users');
            $table->string('relationship_type');
            $table->string('status')->default('active');
            $table->json('permissions')->nullable();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->timestamps();
            $table->index(['workspace_id', 'status']);
            $table->index(['client_id', 'status']);
        });

        Schema::create('client_invites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('creator_id')->constrained('users');
            $table->string('client_name')->nullable();
            $table->string('token_hash')->unique();
            $table->string('intended_relationship')->default('trainer');
            $table->string('status')->default('pending');
            $table->timestamp('expires_at');
            $table->timestamp('redeemed_at')->nullable();
            $table->foreignId('redeemed_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        Schema::create('client_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('color')->nullable();
            $table->timestamps();
            $table->unique(['workspace_id', 'name']);
        });

        Schema::create('client_tag_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_tag_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['client_tag_id', 'client_id']);
        });

        Schema::create('client_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('author_id')->constrained('users');
            $table->text('body');
            $table->string('visibility')->default('private');
            $table->timestamps();
            $table->index(['client_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_notes');
        Schema::dropIfExists('client_tag_assignments');
        Schema::dropIfExists('client_tags');
        Schema::dropIfExists('client_invites');
        Schema::dropIfExists('professional_client_assignments');
        Schema::dropIfExists('client_profiles');
        Schema::dropIfExists('professional_profiles');
        Schema::dropIfExists('telegram_accounts');
        Schema::dropIfExists('workspace_members');
        Schema::dropIfExists('workspaces');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['locale', 'timezone', 'unit_preference', 'status']);
        });
    }
};
