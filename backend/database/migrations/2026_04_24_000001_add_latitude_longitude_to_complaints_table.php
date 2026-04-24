<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            if (!Schema::hasColumn('complaints', 'latitude')) {
                $table->double('latitude')->nullable()->after('location');
            }
            if (!Schema::hasColumn('complaints', 'longitude')) {
                $table->double('longitude')->nullable()->after('latitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('complaints', function (Blueprint $table) {
            if (Schema::hasColumn('complaints', 'longitude')) {
                $table->dropColumn('longitude');
            }
            if (Schema::hasColumn('complaints', 'latitude')) {
                $table->dropColumn('latitude');
            }
        });
    }
};
