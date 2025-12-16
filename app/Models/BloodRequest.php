<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BloodRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'blood_group',
        'units_needed',
        'urgency',
        'patient_name',
        'hospital_name',
        'hospital_address',
        'city',
        'state',
        'latitude',
        'longitude',
        'contact_phone',
        'contact_email',
        'needed_by_date',
        'needed_by_time',
        'additional_info',
        'status',
        'managed_by',
        'managed_at',
        'confirmed_by_requester',
        'confirmed_at',
    ];

    protected $casts = [
        'needed_by_date' => 'date',
        'needed_by_time' => 'string',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'units_needed' => 'integer',
        'confirmed_by_requester' => 'boolean',
        'managed_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created the blood request
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who managed the blood request
     */
    public function managedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'managed_by');
    }

    /**
     * Scope for pending requests
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for urgent requests
     */
    public function scopeUrgent($query)
    {
        return $query->where('urgency', 'urgent')->orWhere('urgency', 'critical');
    }

    /**
     * Scope for specific blood group
     */
    public function scopeBloodGroup($query, $bloodGroup)
    {
        return $query->where('blood_group', $bloodGroup);
    }

    /**
     * Scope for location
     */
    public function scopeInCity($query, $city)
    {
        return $query->where('city', $city);
    }

    /**
     * Get full address
     */
    public function getFullAddressAttribute(): string
    {
        return "{$this->hospital_address}, {$this->city}, {$this->state}, Bangladesh";
    }

    /**
     * Get Google Maps link
     */
    public function getMapLinkAttribute(): ?string
    {
        if ($this->latitude && $this->longitude) {
            return "https://www.google.com/maps?q={$this->latitude},{$this->longitude}&z=17";
        }
        return "https://www.google.com/maps/search/?api=1&query=" . urlencode($this->full_address);
    }
}

