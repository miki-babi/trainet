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
        Schema::table('package_purchases', function (Blueprint $table) {
            $table->json('intake')->nullable()->after('status');
            $table->timestamp('delivered_at')->nullable()->after('intake');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('package_purchases', function (Blueprint $table) {
            $table->dropColumn(['intake', 'delivered_at']);
        });
    }
};
