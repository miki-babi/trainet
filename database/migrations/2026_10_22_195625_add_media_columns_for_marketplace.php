<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('email');
        });

        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->string('cover_image')->nullable()->after('coaching_mode');
        });

        Schema::table('meals', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('time_hint');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('avatar');
        });

        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->dropColumn('cover_image');
        });

        Schema::table('meals', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });
    }
};
