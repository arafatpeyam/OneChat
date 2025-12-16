<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ChatController extends Controller
{
    public function index()
    {
        $currentUserId = Auth::id();
        $currentUser = Auth::user();
        
        // Get friends
        $friends = $currentUser->friends();
        
        // Early return if no friends
        if ($friends->isEmpty()) {
            return Inertia::render('Chat/Index', [
                'conversations' => [],
            ]);
        }
        
        $friendIds = $friends->pluck('id')->toArray();
        
        // Optimized: Get unread counts in a single bulk query
        $unreadCounts = Message::whereIn('sender_id', $friendIds)
            ->where('receiver_id', $currentUserId)
            ->where('read', false)
            ->selectRaw('sender_id, COUNT(*) as count')
            ->groupBy('sender_id')
            ->pluck('count', 'sender_id');
        
        // Get last messages efficiently - one query per friend but optimized
        $conversations = $friends->map(function ($user) use ($currentUserId, $unreadCounts) {
            // Optimized: Single query for last message
            $lastMessage = Message::where(function ($query) use ($currentUserId, $user) {
                $query->where('sender_id', $currentUserId)
                    ->where('receiver_id', $user->id);
            })
            ->orWhere(function ($query) use ($currentUserId, $user) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', $currentUserId);
            })
            ->orderBy('created_at', 'desc')
            ->first();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'last_seen_at' => $user->last_seen_at?->toISOString(),
                'is_online' => $user->isOnline(),
                'last_message' => $lastMessage ? [
                    'message' => $lastMessage->message,
                    'created_at' => $lastMessage->created_at->toISOString(),
                    'sender_id' => $lastMessage->sender_id,
                ] : null,
                'unread_count' => $unreadCounts->get($user->id, 0),
            ];
        })
        ->sortByDesc(function ($conversation) {
            return $conversation['last_message'] 
                ? strtotime($conversation['last_message']['created_at'])
                : 0;
        })
        ->values();

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
        ]);
    }

    public function show($userId)
    {
        $currentUserId = Auth::id();
        $currentUser = Auth::user();
        
        // Verify user exists and is not current user
        $otherUser = User::where('id', $userId)
            ->where('id', '!=', $currentUserId)
            ->firstOrFail();

        // Check if users are friends
        $isFriend = $currentUser->isFriendWith($userId);

        // Get messages only if friends
        $messages = [];
        if ($isFriend) {
            $messages = Message::where(function ($query) use ($currentUserId, $userId) {
                $query->where('sender_id', $currentUserId)
                    ->where('receiver_id', $userId);
            })
            ->orWhere(function ($query) use ($currentUserId, $userId) {
                $query->where('sender_id', $userId)
                    ->where('receiver_id', $currentUserId);
            })
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'message' => $message->message,
                    'created_at' => $message->created_at->toISOString(),
                ];
            });

            // Mark messages as read
            Message::where('sender_id', $userId)
                ->where('receiver_id', $currentUserId)
                ->where('read', false)
                ->update(['read' => true]);
        }

        // Get conversations list (only friends)
        $friends = $currentUser->friends();
        $conversations = $friends->map(function ($user) use ($currentUserId) {
            $lastMessage = Message::where(function ($query) use ($currentUserId, $user) {
                $query->where('sender_id', $currentUserId)
                    ->where('receiver_id', $user->id);
            })
            ->orWhere(function ($query) use ($currentUserId, $user) {
                $query->where('sender_id', $user->id)
                    ->where('receiver_id', $currentUserId);
            })
            ->orderBy('created_at', 'desc')
            ->first();

            $unreadCount = Message::where('sender_id', $user->id)
                ->where('receiver_id', $currentUserId)
                ->where('read', false)
                ->count();

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'last_seen_at' => $user->last_seen_at?->toISOString(),
                'is_online' => $user->isOnline(),
                'last_message' => $lastMessage ? [
                    'message' => $lastMessage->message,
                    'created_at' => $lastMessage->created_at->toISOString(),
                    'sender_id' => $lastMessage->sender_id,
                ] : null,
                'unread_count' => $unreadCount,
            ];
        })
        ->sortByDesc(function ($conversation) {
            return $conversation['last_message'] 
                ? strtotime($conversation['last_message']['created_at'])
                : 0;
        })
        ->values();

        return Inertia::render('Chat/Index', [
            'conversations' => $conversations,
            'selectedUser' => [
                'id' => $otherUser->id,
                'name' => $otherUser->name,
                'email' => $otherUser->email,
                'last_seen_at' => $otherUser->last_seen_at?->toISOString(),
                'is_online' => $otherUser->isOnline(),
            ],
            'messages' => $messages,
            'isFriend' => $isFriend,
        ]);
    }

    /**
     * Get online status for conversations (used for real-time updates)
     */
    public function getConversationsStatus()
    {
        $currentUserId = Auth::id();
        $currentUser = Auth::user();
        
        // Get friends
        $friends = $currentUser->friends();
        
        if ($friends->isEmpty()) {
            return response()->json([
                'success' => true,
                'conversations' => [],
            ]);
        }
        
        // Get conversations with online status
        $conversations = $friends->map(function ($user) {
            return [
                'id' => $user->id,
                'last_seen_at' => $user->last_seen_at?->toISOString(),
                'is_online' => $user->isOnline(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Get online status for a specific user
     */
    public function getUserStatus($userId)
    {
        $user = User::findOrFail($userId);
        
        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'last_seen_at' => $user->last_seen_at?->toISOString(),
                'is_online' => $user->isOnline(),
            ],
        ]);
    }
}

