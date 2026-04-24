<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parking extends Model
{
    protected $fillable = [
        'name',
        'location',
        'capacity',
        'available_places',
        'date',
    ];

    protected $casts = [
        'capacity' => 'integer',
        'available_places' => 'integer',
        'date' => 'date',
    ];

    protected $appends = [
        'reserved',
    ];

    public function getReservedAttribute(): int
    {
        return max($this->capacity - $this->available_places, 0);
    }
}