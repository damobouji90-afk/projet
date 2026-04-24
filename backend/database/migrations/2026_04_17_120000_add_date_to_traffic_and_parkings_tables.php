<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('traffic', function (Blueprint $table) {
            $table->date('date')->default(DB::raw('CURRENT_DATE'))->after('level');
        });

        Schema::table('parkings', function (Blueprint $table) {
            $table->date('date')->default(DB::raw('CURRENT_DATE'))->after('available_places');
        });
    }

    public function down(): void
    {
        Schema::table('traffic', function (Blueprint $table) {
            $table->dropColumn('date');
        });

        Schema::table('parkings', function (Blueprint $table) {
            $table->dropColumn('date');
        });
    }
};
