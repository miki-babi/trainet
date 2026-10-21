<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('food_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('foods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_category_id')->nullable()->constrained();
            $table->foreignId('workspace_id')->nullable()->constrained();
            $table->string('name');
            $table->decimal('calories', 8, 2)->default(0); // per 100 g
            $table->decimal('protein_g', 8, 2)->default(0);
            $table->decimal('carbs_g', 8, 2)->default(0);
            $table->decimal('fat_g', 8, 2)->default(0);
            $table->decimal('fiber_g', 8, 2)->nullable();
            $table->decimal('sodium_mg', 8, 2)->nullable();
            $table->string('serving_description')->nullable();
            $table->boolean('is_custom')->default(false);
            $table->timestamps();
            $table->index(['workspace_id', 'name']);
        });

        Schema::create('food_portions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_id')->constrained('foods')->cascadeOnDelete();
            $table->string('label');
            $table->decimal('grams', 8, 2);
            $table->timestamps();
            $table->index('food_id');
        });

        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('instructions')->nullable();
            $table->unsignedSmallInteger('servings')->default(1);
            $table->timestamps();
        });

        Schema::create('recipe_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('food_id')->constrained('foods');
            $table->decimal('quantity', 8, 2)->default(1);
            $table->foreignId('food_portion_id')->nullable()->constrained();
            $table->timestamps();
        });

        Schema::create('nutrition_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
            $table->index(['workspace_id', 'status']);
        });

        Schema::create('nutrition_plan_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nutrition_plan_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->foreignId('created_by')->constrained('users');
            $table->string('change_summary')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->unique(['nutrition_plan_id', 'version_number'], 'nutrition_version_unique');
        });

        Schema::create('nutrition_plan_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nutrition_plan_version_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('order');
            $table->string('title')->nullable();
            $table->timestamps();
        });

        Schema::create('meals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nutrition_plan_day_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('time_hint')->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('meal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('food_id')->nullable()->constrained('foods');
            $table->foreignId('recipe_id')->nullable()->constrained();
            $table->decimal('quantity', 8, 2)->default(1);
            $table->foreignId('food_portion_id')->nullable()->constrained();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('nutrition_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('nutrition_plan_version_id')->constrained();
            $table->foreignId('assigned_by')->constrained('users');
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->index(['client_id', 'status']);
        });

        Schema::create('nutrition_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->string('source')->default('plan');
            $table->decimal('calories', 8, 2)->nullable();
            $table->decimal('protein_g', 8, 2)->nullable();
            $table->decimal('carbs_g', 8, 2)->nullable();
            $table->decimal('fat_g', 8, 2)->nullable();
            $table->unsignedInteger('water_ml')->nullable();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'starts_on']);
        });

        Schema::create('food_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->date('logged_on');
            $table->string('meal_name')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['client_id', 'logged_on']);
        });

        Schema::create('food_log_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_log_id')->constrained()->cascadeOnDelete();
            $table->foreignId('food_id')->nullable()->constrained('foods');
            $table->string('custom_name')->nullable();
            $table->decimal('quantity', 8, 2)->default(1);
            $table->foreignId('food_portion_id')->nullable()->constrained();
            $table->decimal('grams', 8, 2)->nullable();
            $table->decimal('calories', 8, 2)->default(0);
            $table->decimal('protein_g', 8, 2)->default(0);
            $table->decimal('carbs_g', 8, 2)->default(0);
            $table->decimal('fat_g', 8, 2)->default(0);
            $table->timestamp('logged_at')->nullable();
            $table->timestamps();
        });

        Schema::create('habits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->timestamps();
        });

        Schema::create('habit_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habit_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->string('frequency')->default('daily');
            $table->json('schedule')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->index(['client_id', 'status']);
        });

        Schema::create('habit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habit_assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->date('logged_on');
            $table->boolean('completed')->default(false);
            $table->string('value')->nullable();
            $table->timestamps();
            $table->unique(['habit_assignment_id', 'logged_on'], 'habit_log_unique');
        });

        Schema::create('water_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->date('logged_on');
            $table->unsignedInteger('amount_ml')->default(0);
            $table->timestamps();
            $table->unique(['client_id', 'logged_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('water_logs');
        Schema::dropIfExists('habit_logs');
        Schema::dropIfExists('habit_assignments');
        Schema::dropIfExists('habits');
        Schema::dropIfExists('food_log_items');
        Schema::dropIfExists('food_logs');
        Schema::dropIfExists('nutrition_targets');
        Schema::dropIfExists('nutrition_assignments');
        Schema::dropIfExists('meal_items');
        Schema::dropIfExists('meals');
        Schema::dropIfExists('nutrition_plan_days');
        Schema::dropIfExists('nutrition_plan_versions');
        Schema::dropIfExists('nutrition_plans');
        Schema::dropIfExists('recipe_items');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('food_portions');
        Schema::dropIfExists('foods');
        Schema::dropIfExists('food_categories');
    }
};
