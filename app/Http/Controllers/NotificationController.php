<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\FriendRequest;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display notifications page
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Get all notifications from database
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($notification) {
                $data = $notification->data;
                
                // Add sender name if sender_id exists
                if (isset($data['sender_id']) && $data['sender_id']) {
                    $sender = \App\Models\User::find($data['sender_id']);
                    if ($sender) {
                        $data['sender_name'] = $sender->name;
                    }
                }
                
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'data' => $data,
                    'read' => $notification->read,
                    'read_at' => $notification->read_at?->toISOString(),
                    'created_at' => $notification->created_at->toISOString(),
                    'time_ago' => $notification->created_at->diffForHumans(),
                ];
            });

        // Get real-time counts
        $unreadCount = Notification::where('user_id', $user->id)
            ->where('read', false)
            ->count();

        // Get counts by type
        $typeCounts = [
            'all' => $notifications->count(),
            'unread' => $unreadCount,
            'friend_request' => $notifications->where('type', 'friend_request')->count(),
            'message' => $notifications->where('type', 'message')->count(),
            'blood_request' => $notifications->where('type', 'blood_request')->count(),
            'emergency' => $notifications->where('type', 'emergency')->count(),
        ];

        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
            'typeCounts' => $typeCounts,
        ]);
    }

    /**
     * Get notifications as JSON (for API calls)
     */
    public function getNotifications(Request $request)
    {
        $user = Auth::user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($notification) {
                $data = $notification->data;
                
                // Add sender name if sender_id exists
                if (isset($data['sender_id']) && $data['sender_id']) {
                    $sender = \App\Models\User::find($data['sender_id']);
                    if ($sender) {
                        $data['sender_name'] = $sender->name;
                    }
                }
                
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'data' => $data,
                    'read' => $notification->read,
                    'read_at' => $notification->read_at?->toISOString(),
                    'created_at' => $notification->created_at->toISOString(),
                    'time_ago' => $notification->created_at->diffForHumans(),
                ];
            });

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        
        Notification::where('user_id', $user->id)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Show notification details
     */
    public function show(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            abort(403, 'You can only view your own notifications.');
        }

        $data = $notification->data;
        
        // Add sender name if sender_id exists
        if (isset($data['sender_id']) && $data['sender_id']) {
            $sender = \App\Models\User::find($data['sender_id']);
            if ($sender) {
                $data['sender_name'] = $sender->name;
            }
        }

        $notificationData = [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'message' => $notification->message,
            'data' => $data,
            'read' => $notification->read,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at->toISOString(),
            'time_ago' => $notification->created_at->diffForHumans(),
        ];

        return Inertia::render('Notifications/Show', [
            'notification' => $notificationData,
        ]);
    }

    /**
     * Delete a notification
     */
    public function destroy(Notification $notification)
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }
}
