<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('package_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pro_package_id')->constrained('pro_packages')->cascadeOnDelete();
            $table->foreignId('client_profile_id')->constrained('client_profiles')->cascadeOnDelete();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('professional_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('amount_cents');
            $table->string('currency', 3)->default('USD');
            $table->string('status')->default('paid');
            $table->timestamp('purchased_at');
            $table->timestamps();

            $table->index(['workspace_id', 'purchased_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_purchases');
    }
};
