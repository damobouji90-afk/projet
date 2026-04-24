<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'adem@gmail.com'],
            [
                'name' => 'adem',
                'password' => Hash::make('12345'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'yassmine@gmail.com'],
            [
                'name' => 'yassmine',
                'password' => Hash::make('12345'),
            ]
        );

        User::updateOrCreate(
            ['email' => 'citoyen@gmail.com'],
            [
                'name' => 'Citoyen',
                'password' => Hash::make('12345'),
            ]
        );
    }
}
