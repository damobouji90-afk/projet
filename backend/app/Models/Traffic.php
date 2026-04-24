<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Traffic extends Model
{
    protected $fillable = [
        'location',
        'level',
        'date',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
