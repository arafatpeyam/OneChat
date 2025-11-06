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
        
        // Get all users except current user with their last message
        $conversations = User::where('id', '!=', $currentUserId)
            ->with(['sentMessages' => function ($query) use ($currentUserId) {
                $query->where('receiver_id', $currentUserId)
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }, 'receivedMessages' => function ($query) use ($currentUserId) {
                $query->where('sender_id', $currentUserId)
                    ->orderBy('created_at', 'desc')
                    ->limit(1);
            }])
            ->get()
            ->map(function ($user) use ($currentUserId) {
                // Get last message between current user and this user
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

                // Count unread messages
                $unreadCount = Message::where('sender_id', $user->id)
                    ->where('receiver_id', $currentUserId)
                    ->where('read', false)
                    ->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
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
        ]);
    }

    public function show($userId)
    {
        $currentUserId = Auth::id();
        
        // Verify user exists and is not current user
        $otherUser = User::where('id', $userId)
            ->where('id', '!=', $currentUserId)
            ->firstOrFail();

        // Get messages
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

        // Get conversations list (same as index)
        $conversations = User::where('id', '!=', $currentUserId)
            ->get()
            ->map(function ($user) use ($currentUserId) {
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
            ],
            'messages' => $messages,
        ]);
    }
}

