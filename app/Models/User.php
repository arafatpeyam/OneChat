<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'image',
        'address',
        'about',
        'city',
        'state',
        'zip',
        'birth_date',
        'gender',
        'occupation',
        'hobbies',
        'blood_group',
        'donor',
        'password',
        'role',
        'last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'birth_date' => 'date',
            'password' => 'hashed',
            'last_seen_at' => 'datetime',
        ];
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    /**
     * Friend requests sent by this user
     */
    public function sentFriendRequests()
    {
        return $this->hasMany(FriendRequest::class, 'sender_id');
    }

    /**
     * Friend requests received by this user
     */
    public function receivedFriendRequests()
    {
        return $this->hasMany(FriendRequest::class, 'receiver_id');
    }

    /**
     * Get all friends (accepted friend requests)
     */
    public function friends()
    {
        $sentFriends = $this->sentFriendRequests()
            ->where('status', 'accepted')
            ->with('receiver')
            ->get()
            ->pluck('receiver');

        $receivedFriends = $this->receivedFriendRequests()
            ->where('status', 'accepted')
            ->with('sender')
            ->get()
            ->pluck('sender');

        return $sentFriends->merge($receivedFriends)->unique('id');
    }

    /**
     * Get the IDs of all friends.
     */
    public function friendIds(): Collection
    {
        return $this->friends()->pluck('id')->unique()->values();
    }

    /**
     * Check if user is friends with another user
     */
    public function isFriendWith($userId)
    {
        return FriendRequest::where(function($query) use ($userId) {
            $query->where('sender_id', $this->id)
                  ->where('receiver_id', $userId)
                  ->where('status', 'accepted');
        })->orWhere(function($query) use ($userId) {
            $query->where('sender_id', $userId)
                  ->where('receiver_id', $this->id)
                  ->where('status', 'accepted');
        })->exists();
    }

    /**
     * Check if there's a pending request between users
     */
    public function hasPendingRequestWith($userId)
    {
        return FriendRequest::where(function($query) use ($userId) {
            $query->where('sender_id', $this->id)
                  ->where('receiver_id', $userId)
                  ->where('status', 'pending');
        })->orWhere(function($query) use ($userId) {
            $query->where('sender_id', $userId)
                  ->where('receiver_id', $this->id)
                  ->where('status', 'pending');
        })->exists();
    }

    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is manager
     */
    public function isManager()
    {
        return $this->role === 'manager';
    }

    /**
     * Check if user is admin or manager
     */
    public function isAdminOrManager()
    {
        return in_array($this->role, ['admin', 'manager']);
    }

    /**
     * Check if user is online (active within last 1 minute)
     */
    public function isOnline()
    {
        if (!$this->last_seen_at) {
            return false;
        }
        
        // Calculate minutes difference - negative means last_seen_at is in the future (shouldn't happen)
        $minutesDiff = $this->last_seen_at->diffInMinutes(now(), false);
        
        // User is online if last seen within last 1 minute (0 to 1 minute ago)
        return $minutesDiff >= 0 && $minutesDiff <= 1;
    }

    /**
     * Update last seen timestamp
     * 
     * Note: If the same user is logged in from multiple browsers/devices,
     * each browser will update this timestamp. The user will appear online
     * as long as ANY browser session is active, which is the expected behavior.
     * 
     * To test online/offline status with different users, use different user accounts.
     */
    public function updateLastSeen()
    {
        // Use direct assignment to bypass any fillable issues and ensure it always works
        $this->last_seen_at = now();
        $this->saveQuietly(); // Save without firing events for better performance
    }
}
