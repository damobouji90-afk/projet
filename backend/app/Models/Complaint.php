<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    protected $fillable = [
        'image',
        'description',
        'location',
        'latitude',
        'longitude',
        'date',
        'status',
        'category',
        'problem_type',
        'type_probleme',
        'priority',
        'resolution',
        'user_id',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}