<?php

namespace App\Http\Controllers;

use App\Models\FriendRequest;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FriendRequestController extends Controller
{
    /**
     * Send a friend request
     */
    public function send(Request $request)
    {
        $user = Auth::user();
        
        // Prevent admins from sending friend requests
        if ($user->isAdmin()) {
            return response()->json([
                'success' => false,
                'error' => 'Admins cannot send friend requests. Use the admin panel to manage users.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required|exists:users,id|different:' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => $validator->errors()->first(),
            ], 422);
        }

        $receiverId = $request->receiver_id;
        $senderId = $user->id;

        // Check if already friends
        if (Auth::user()->isFriendWith($receiverId)) {
            return response()->json([
                'success' => false,
                'error' => 'You are already friends with this user',
            ], 400);
        }

        // Check if there's already a pending request
        if (Auth::user()->hasPendingRequestWith($receiverId)) {
            return response()->json([
                'success' => false,
                'error' => 'A friend request already exists between you and this user',
            ], 400);
        }

        // Check if there's an existing request (in either direction)
        $existingRequest = FriendRequest::where(function($query) use ($senderId, $receiverId) {
            $query->where('sender_id', $senderId)
                  ->where('receiver_id', $receiverId);
        })->orWhere(function($query) use ($senderId, $receiverId) {
            $query->where('sender_id', $receiverId)
                  ->where('receiver_id', $senderId);
        })->first();

        if ($existingRequest) {
            if ($existingRequest->status === 'blocked') {
                return response()->json([
                    'success' => false,
                    'error' => 'Cannot send friend request to this user',
                ], 403);
            }
            
            return response()->json([
                'success' => false,
                'error' => 'A friend request already exists',
            ], 400);
        }

        // Create new friend request
        $friendRequest = FriendRequest::create([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'status' => 'pending',
        ]);

        // Create notification for the receiver
        $sender = Auth::user();
        Notification::create([
            'user_id' => $receiverId,
            'type' => 'friend_request',
            'title' => 'New Friend Request',
            'message' => "{$sender->name} sent you a friend request",
            'data' => [
                'friend_request_id' => $friendRequest->id,
                'sender_id' => $senderId,
                'link' => route('friends.index', ['tab' => 'requests']),
            ],
            'read' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Friend request sent successfully',
            'friend_request' => $friendRequest->load(['sender', 'receiver']),
        ]);
    }

    /**
     * Accept a friend request
     */
    public function accept($id)
    {
        $friendRequest = FriendRequest::findOrFail($id);

        // Check if the current user is the receiver
        if ($friendRequest->receiver_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        // Check if already accepted
        if ($friendRequest->status === 'accepted') {
            return response()->json([
                'success' => false,
                'error' => 'Friend request already accepted',
            ], 400);
        }

        $friendRequest->update([
            'status' => 'accepted',
            'accepted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Friend request accepted',
            'friend_request' => $friendRequest->load(['sender', 'receiver']),
        ]);
    }

    /**
     * Reject a friend request
     */
    public function reject($id)
    {
        $friendRequest = FriendRequest::findOrFail($id);

        // Check if the current user is the receiver
        if ($friendRequest->receiver_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $friendRequest->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Friend request rejected',
        ]);
    }

    /**
     * Cancel a sent friend request
     */
    public function cancel($id)
    {
        $friendRequest = FriendRequest::findOrFail($id);

        // Check if the current user is the sender
        if ($friendRequest->sender_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        // Only allow canceling pending requests
        if ($friendRequest->status !== 'pending') {
            return response()->json([
                'success' => false,
                'error' => 'Can only cancel pending friend requests',
            ], 400);
        }

        $friendRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Friend request cancelled',
        ]);
    }

    /**
     * Remove a friend (unfriend)
     */
    public function remove($id)
    {
        $friendRequest = FriendRequest::findOrFail($id);
        $userId = Auth::id();

        // Check if the current user is part of this friendship
        if ($friendRequest->sender_id !== $userId && $friendRequest->receiver_id !== $userId) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        // Check if they are actually friends
        if ($friendRequest->status !== 'accepted') {
            return response()->json([
                'success' => false,
                'error' => 'You are not friends with this user',
            ], 400);
        }

        $friendRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Friend removed successfully',
        ]);
    }

    /**
     * Get all friends
     */
    public function getFriends()
    {
        $user = Auth::user();
        
        $sentFriends = FriendRequest::where('sender_id', $user->id)
            ->where('status', 'accepted')
            ->with('receiver:id,name,email,image,blood_group,city,state,last_seen_at')
            ->get()
            ->map(function($request) {
                $friend = $request->receiver->toArray();
                $friend['friend_request_id'] = $request->id;
                $friend['is_online'] = $request->receiver->isOnline();
                $friend['last_seen_at'] = $request->receiver->last_seen_at?->toISOString();
                return $friend;
            });

        $receivedFriends = FriendRequest::where('receiver_id', $user->id)
            ->where('status', 'accepted')
            ->with('sender:id,name,email,image,blood_group,city,state,last_seen_at')
            ->get()
            ->map(function($request) {
                $friend = $request->sender->toArray();
                $friend['friend_request_id'] = $request->id;
                $friend['is_online'] = $request->sender->isOnline();
                $friend['last_seen_at'] = $request->sender->last_seen_at?->toISOString();
                return $friend;
            });

        $friends = $sentFriends->merge($receivedFriends)->unique('id')->values();

        return response()->json([
            'success' => true,
            'friends' => $friends,
        ]);
    }

    /**
     * Get pending friend requests (received)
     */
    public function getPendingRequests()
    {
        $pendingRequests = FriendRequest::where('receiver_id', Auth::id())
            ->where('status', 'pending')
            ->with('sender:id,name,email,image,blood_group,city,state,last_seen_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($request) {
                $sender = $request->sender;
                return [
                    'id' => $request->id,
                    'sender' => [
                        'id' => $sender->id,
                        'name' => $sender->name,
                        'email' => $sender->email,
                        'image' => $sender->image,
                        'blood_group' => $sender->blood_group,
                        'city' => $sender->city,
                        'state' => $sender->state,
                        'last_seen_at' => $sender->last_seen_at?->toISOString(),
                        'is_online' => $sender->isOnline(),
                    ],
                    'created_at' => $request->created_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'pending_requests' => $pendingRequests,
        ]);
    }

    /**
     * Get sent friend requests
     */
    public function getSentRequests()
    {
        $sentRequests = FriendRequest::where('sender_id', Auth::id())
            ->where('status', 'pending')
            ->with('receiver:id,name,email,image,blood_group,city,state,last_seen_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($request) {
                $receiver = $request->receiver;
                return [
                    'id' => $request->id,
                    'receiver' => [
                        'id' => $receiver->id,
                        'name' => $receiver->name,
                        'email' => $receiver->email,
                        'image' => $receiver->image,
                        'blood_group' => $receiver->blood_group,
                        'city' => $receiver->city,
                        'state' => $receiver->state,
                        'last_seen_at' => $receiver->last_seen_at?->toISOString(),
                        'is_online' => $receiver->isOnline(),
                    ],
                    'created_at' => $request->created_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'sent_requests' => $sentRequests,
        ]);
    }

    /**
     * Check friend request status with a specific user
     */
    public function checkStatus($userId)
    {
        $currentUserId = Auth::id();
        
        // Check if already friends
        if (Auth::user()->isFriendWith($userId)) {
            return response()->json([
                'success' => true,
                'status' => 'friends',
            ]);
        }
        
        // Check for pending request sent by current user
        $sentRequest = FriendRequest::where('sender_id', $currentUserId)
            ->where('receiver_id', $userId)
            ->where('status', 'pending')
            ->first();
            
        if ($sentRequest) {
            return response()->json([
                'success' => true,
                'status' => 'sent',
                'request_id' => $sentRequest->id,
            ]);
        }
        
        // Check for pending request received by current user
        $receivedRequest = FriendRequest::where('sender_id', $userId)
            ->where('receiver_id', $currentUserId)
            ->where('status', 'pending')
            ->first();
            
        if ($receivedRequest) {
            return response()->json([
                'success' => true,
                'status' => 'received',
                'request_id' => $receivedRequest->id,
            ]);
        }
        
        return response()->json([
            'success' => true,
            'status' => 'none',
        ]);
    }

    /**
     * Search users (excluding current user and friends)
     */
    public function searchUsers(Request $request)
    {
        $query = $request->get('query', '');
        $userId = Auth::id();

        // Get friend IDs (both sent and received)
        $friendIds = FriendRequest::where(function($q) use ($userId) {
            $q->where('sender_id', $userId)
              ->where('status', 'accepted');
        })->orWhere(function($q) use ($userId) {
            $q->where('receiver_id', $userId)
              ->where('status', 'accepted');
        })->get()->map(function($fr) use ($userId) {
            return $fr->sender_id === $userId ? $fr->receiver_id : $fr->sender_id;
        })->toArray();

        // Get pending request user IDs
        $pendingRequests = FriendRequest::where(function($q) use ($userId) {
            $q->where('sender_id', $userId)
              ->orWhere('receiver_id', $userId);
        })->where('status', 'pending')->get();

        $pendingMap = [];
        foreach ($pendingRequests as $request) {
            $otherId = $request->sender_id === $userId ? $request->receiver_id : $request->sender_id;
            $pendingMap[$otherId] = [
                'id' => $request->id,
                'sent_by_current_user' => $request->sender_id === $userId,
            ];
        }

        // Build query - exclude only current user
        $usersQuery = User::where('id', '!=', $userId);

        // If query is provided, filter by name or email
        if (!empty($query)) {
            $usersQuery->where(function($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            });
        }

        $users = $usersQuery->select('id', 'name', 'email', 'image', 'blood_group', 'city', 'state', 'last_seen_at')
            ->orderBy('name', 'asc')
            ->get();

        // Add friendship status and online status to each user
        $users = $users->map(function($user) use ($friendIds, $pendingMap) {
            $pendingInfo = $pendingMap[$user->id] ?? null;
            $user->is_friend = in_array($user->id, $friendIds);
            $user->has_pending_request = $pendingInfo !== null;
            $user->pending_request_id = $pendingInfo['id'] ?? null;
            $user->pending_request_sent_by_me = $pendingInfo['sent_by_current_user'] ?? false;
            $user->is_online = $user->isOnline();
            $user->last_seen_at = $user->last_seen_at?->toISOString();
            return $user;
        });

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }
}

