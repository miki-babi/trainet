<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->json('certifications')->nullable()->after('credentials');
            $table->json('testimonials')->nullable()->after('certifications');
        });

        Schema::table('pro_packages', function (Blueprint $table) {
            $table->string('kind')->default('coaching')->after('billing_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->dropColumn(['certifications', 'testimonials']);
        });

        Schema::table('pro_packages', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
    }
};
