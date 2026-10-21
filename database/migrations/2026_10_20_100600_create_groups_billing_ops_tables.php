<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coaching_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('group_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coaching_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->date('joined_on');
            $table->string('status')->default('active');
            $table->timestamps();
            $table->unique(['coaching_group_id', 'client_id']);
        });

        Schema::create('group_program_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coaching_group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('training_program_version_id')->constrained();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type')->default('custom');
            $table->json('rules')->nullable();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
        });

        Schema::create('challenge_participation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenge_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->decimal('score', 10, 2)->default(0);
            $table->timestamp('joined_at');
            $table->timestamps();
            $table->unique(['challenge_id', 'client_id']);
        });

        Schema::create('billing_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('provider_customer_id');
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'provider_customer_id']);
        });

        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->unsignedInteger('price_cents');
            $table->string('currency', 3)->default('USD');
            $table->string('interval')->default('month');
            $table->json('features')->nullable();
            $table->timestamps();
        });

        Schema::create('workspace_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->constrained();
            $table->foreignId('billing_customer_id')->nullable()->constrained();
            $table->string('status')->default('active');
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workspace_subscription_id')->nullable()->constrained();
            $table->string('number')->nullable();
            $table->unsignedInteger('amount_cents');
            $table->string('currency', 3)->default('USD');
            $table->string('status')->default('draft');
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('provider_payment_id')->nullable();
            $table->unsignedInteger('amount_cents');
            $table->string('status')->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_transaction_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount_cents');
            $table->string('reason')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('provider');
            $table->string('event_id');
            $table->string('type');
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'event_id']);
        });

        Schema::create('audit_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users');
            $table->string('action');
            $table->string('resource_type')->nullable();
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->string('reason')->nullable();
            $table->string('correlation_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at');
            $table->index(['resource_type', 'resource_id']);
        });

        Schema::create('user_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->boolean('granted')->default(false);
            $table->timestamp('granted_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'type']);
        });

        Schema::create('data_export_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('requested_at');
            $table->timestamp('completed_at')->nullable();
            $table->string('path')->nullable();
            $table->timestamps();
        });

        Schema::create('deletion_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('requested_at');
            $table->timestamp('scheduled_for')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->boolean('enabled')->default(false);
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        Schema::create('support_cases', function (Blueprint $table) {
            $table->id();
            $table->string('subject');
            $table->foreignId('requester_id')->nullable()->constrained('users');
            $table->foreignId('assignee_id')->nullable()->constrained('users');
            $table->string('status')->default('open');
            $table->string('priority')->default('normal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_cases');
        Schema::dropIfExists('platform_settings');
        Schema::dropIfExists('feature_flags');
        Schema::dropIfExists('deletion_requests');
        Schema::dropIfExists('data_export_requests');
        Schema::dropIfExists('user_consents');
        Schema::dropIfExists('audit_events');
        Schema::dropIfExists('payment_webhook_events');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('workspace_subscriptions');
        Schema::dropIfExists('subscription_plans');
        Schema::dropIfExists('billing_customers');
        Schema::dropIfExists('challenge_participation');
        Schema::dropIfExists('challenges');
        Schema::dropIfExists('group_program_assignments');
        Schema::dropIfExists('group_memberships');
        Schema::dropIfExists('coaching_groups');
    }
};
