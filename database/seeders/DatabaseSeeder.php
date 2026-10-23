<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (config('trainet.demo')) {
            // Demo mode: DemoSeeder seeds the shared catalog plus demo
            // personas, plans, and sample tracking data.
            $this->call(DemoSeeder::class);

            return;
        }

        // Production: only the shared catalog data real users need.
        $this->call(ReferenceSeeder::class);
    }
}
