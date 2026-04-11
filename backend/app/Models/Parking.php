<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parking extends Model
{
    
    protected $fillable = [
        'name',
        'available_places'
    ];
}