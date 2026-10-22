<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->json('specialties')->nullable()->after('business_name');
            $table->decimal('rating', 3, 1)->nullable()->after('specialties');
            $table->unsignedSmallInteger('reviews_count')->default(0)->after('rating');
            $table->string('price_label')->nullable()->after('reviews_count');
            $table->string('coaching_mode')->default('both')->after('price_label');
        });
    }

    public function down(): void
    {
        Schema::table('professional_profiles', function (Blueprint $table) {
            $table->dropColumn(['specialties', 'rating', 'reviews_count', 'price_label', 'coaching_mode']);
        });
    }
};
