<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints', function (Blueprint $table) {
            $table->id();
            $table->string('image');
            $table->text('description');
            $table->string('location');
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->date('date');
            $table->enum('status', ['pending', 'in_progress', 'resolved'])->default('pending');
            $table->enum('category', ['éclairage', 'infrastructure', 'trafic', 'parking', 'sensors', 'déchets']);
            $table->string('problem_type')->nullable();
            $table->string('type_probleme')->nullable();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->text('resolution')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};