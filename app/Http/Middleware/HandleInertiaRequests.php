<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        // Update last seen for authenticated users
        if ($user) {
            $user->updateLastSeen();
        }
        
        // Get notifications for authenticated users
        $notifications = [];
        $unreadNotificationCount = 0;
        
        if ($user) {
            $notifications = \App\Models\Notification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'data' => $notification->data,
                        'read' => $notification->read,
                        'read_at' => $notification->read_at?->toISOString(),
                        'created_at' => $notification->created_at->toISOString(),
                        'time_ago' => $notification->created_at->diffForHumans(),
                    ];
                });
            
            $unreadNotificationCount = \App\Models\Notification::where('user_id', $user->id)
                ->where('read', false)
                ->count();
        }
        
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'user',
                    'image' => $user->image,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'about' => $user->about,
                    'city' => $user->city,
                    'state' => $user->state,
                    'zip' => $user->zip,
                    'birth_date' => $user->birth_date?->toISOString(),
                    'gender' => $user->gender,
                    'occupation' => $user->occupation,
                    'hobbies' => $user->hobbies,
                    'blood_group' => $user->blood_group,
                    'donor' => $user->donor,
                    'last_seen_at' => $user->last_seen_at?->toISOString(),
                    'is_online' => $user->isOnline(),
                ] : null,
            ],
            'csrf_token' => csrf_token(),
            'notifications' => $notifications,
            'unread_notification_count' => $unreadNotificationCount,
        ];
    }
}
