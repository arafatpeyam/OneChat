<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\FriendRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function send(Request $request)
    {
        try {
            $request->validate([
                'receiver_id' => 'required|exists:users,id',
                'message' => 'required|string|max:1000',
            ]);

            // Optimized: Get user once and cache it
            $sender = Auth::user();
            
            if (!$sender) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }
            
            $senderId = $sender->id;

            // Optimized: Fast friend check using direct query instead of method call
            $isFriend = FriendRequest::where(function($query) use ($senderId, $request) {
                $query->where('sender_id', $senderId)
                      ->where('receiver_id', $request->receiver_id)
                      ->where('status', 'accepted');
            })->orWhere(function($query) use ($senderId, $request) {
                $query->where('sender_id', $request->receiver_id)
                      ->where('receiver_id', $senderId)
                      ->where('status', 'accepted');
            })->exists();

            if (!$isFriend) {
                return response()->json([
                    'success' => false,
                    'error' => 'You can only send messages to your friends. Please send a friend request first.',
                ], 403);
            }

            // Optimized: Create message directly without extra queries
            $message = Message::create([
                'sender_id' => $senderId,
                'receiver_id' => $request->receiver_id,
                'message' => $request->message,
                'read' => false,
            ]);

            // Return immediately with message data
            return response()->json([
                'success' => true,
                'message' => [
                    'id' => $message->id,
                    'sender_id' => $message->sender_id,
                    'receiver_id' => $message->receiver_id,
                    'message' => $message->message,
                    'created_at' => $message->created_at->toISOString(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            // Log the error for debugging
            \Log::error('Message send error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to send message: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getMessages(Request $request, $userId)
    {
        $currentUser = Auth::user();
        
        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'error' => 'User not authenticated',
                'messages' => [],
            ], 401);
        }
        
        $currentUserId = $currentUser->id;

        // Check if users are friends
        if (!$currentUser->isFriendWith($userId)) {
            return response()->json([
                'success' => false,
                'error' => 'You can only view messages with your friends.',
                'messages' => [],
            ], 403);
        }

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

        return response()->json([
            'success' => true,
            'messages' => $messages,
        ]);
    }
}
