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
        Schema::table('sensors', function (Blueprint $table) {
            if (!Schema::hasColumn('sensors', 'name')) {
                $table->string('name');
            }
            if (!Schema::hasColumn('sensors', 'type')) {
                $table->string('type');
            }
            if (!Schema::hasColumn('sensors', 'location')) {
                $table->string('location');
            }
            if (!Schema::hasColumn('sensors', 'status')) {
                $table->boolean('status')->default(true);
            }
        });
    }

    public function down(): void
    {
        Schema::table('sensors', function (Blueprint $table) {
            if (Schema::hasColumn('sensors', 'name')) {
                $table->dropColumn('name');
            }
            if (Schema::hasColumn('sensors', 'type')) {
                $table->dropColumn('type');
            }
            if (Schema::hasColumn('sensors', 'location')) {
                $table->dropColumn('location');
            }
            if (Schema::hasColumn('sensors', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
