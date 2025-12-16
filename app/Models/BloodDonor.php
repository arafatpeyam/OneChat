<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BloodDonor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'blood_group',
        'last_donation_date',
        'next_available_date',
        'contact_phone',
        'address',
        'city',
        'state',
        'zip',
        'is_available',
        'notes',
    ];

    protected $casts = [
        'last_donation_date' => 'date',
        'next_available_date' => 'date',
        'is_available' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the blood donor record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

