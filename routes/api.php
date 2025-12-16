<?php

use App\Http\Controllers\BloodDonorController;
use App\Http\Controllers\CallController;
use App\Http\Controllers\MessageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(['web', 'auth'])->group(function () {
    // CSRF token refresh endpoint
    Route::get('/csrf-token', function () {
        return response()->json([
            'success' => true,
            'csrf_token' => csrf_token(),
        ]);
    });
    
    Route::post('/messages/send', [MessageController::class, 'send']);
    Route::get('/messages/{userId}', [MessageController::class, 'getMessages']);
    
    // Chat status routes
    Route::get('/chat/status/conversations', [\App\Http\Controllers\ChatController::class, 'getConversationsStatus']);
    Route::get('/chat/status/user/{userId}', [\App\Http\Controllers\ChatController::class, 'getUserStatus']);
    
    // Test endpoint to check online status
    Route::get('/test/online-status', function () {
        $user = Auth::user();
        return response()->json([
            'success' => true,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'last_seen_at' => $user->last_seen_at?->toISOString(),
            'is_online' => $user->isOnline(),
            'current_time' => now()->toISOString(),
        ]);
    });
    
    // Call routes
    Route::prefix('calls')->group(function () {
        Route::post('/initiate', [CallController::class, 'initiate']);
        Route::post('/{callId}/accept', [CallController::class, 'accept']);
        Route::post('/{callId}/end', [CallController::class, 'end']);
        Route::get('/active', [CallController::class, 'active']);
        Route::post('/{callId}/offer', [CallController::class, 'storeOffer']);
        Route::post('/{callId}/answer', [CallController::class, 'storeAnswer']);
        Route::post('/{callId}/ice-candidate', [CallController::class, 'storeIceCandidate']);
        Route::get('/{callId}/ice-candidates', [CallController::class, 'getIceCandidates']);
    });
    
    Route::get('/dashboard/stats', function () {
        $user = Auth::user();
        $totalUsers = \App\Models\User::where('id', '!=', $user->id)->count();
        $totalMessages = \App\Models\Message::where(function($query) use ($user) {
            $query->where('sender_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
        })->count();
        // Optimized conversation count - much faster than whereHas
        $totalConversations = (int) \Illuminate\Support\Facades\DB::selectOne(
            "SELECT COUNT(DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END) as count 
             FROM messages 
             WHERE sender_id = ? OR receiver_id = ?",
            [$user->id, $user->id, $user->id]
        )->count;
        $unreadMessages = \App\Models\Message::where('receiver_id', $user->id)
            ->where('read', false)
            ->count();
        
        return response()->json([
            'success' => true,
            'stats' => [
                'total_users' => $totalUsers,
                'total_messages' => $totalMessages,
                'total_conversations' => $totalConversations,
                'unread_messages' => $unreadMessages,
            ],
        ]);
    });
    
    // Blood Donation routes
    Route::prefix('blood-donors')->group(function () {
        Route::get('/', [BloodDonorController::class, 'index']);
        Route::post('/', [BloodDonorController::class, 'store']);
        Route::get('/profile', [BloodDonorController::class, 'show']);
        Route::put('/profile', [BloodDonorController::class, 'update']);
        Route::delete('/profile', [BloodDonorController::class, 'destroy']);
        Route::post('/request', [BloodDonorController::class, 'requestBlood']);
        Route::get('/requests', [BloodDonorController::class, 'getRequests']);
        Route::get('/requests/{id}', [BloodDonorController::class, 'getRequest']);
        Route::post('/requests/{id}/manage', [BloodDonorController::class, 'manageRequest']);
        Route::post('/requests/{id}/confirm', [BloodDonorController::class, 'confirmManagement']);
        Route::put('/requests/{id}', [BloodDonorController::class, 'updateRequest']);
    });
    
    // Friend Request routes
    Route::prefix('friends')->group(function () {
        Route::get('/', [\App\Http\Controllers\FriendRequestController::class, 'getFriends']);
        Route::get('/pending', [\App\Http\Controllers\FriendRequestController::class, 'getPendingRequests']);
        Route::get('/sent', [\App\Http\Controllers\FriendRequestController::class, 'getSentRequests']);
        Route::get('/status/{userId}', [\App\Http\Controllers\FriendRequestController::class, 'checkStatus']);
        Route::post('/send', [\App\Http\Controllers\FriendRequestController::class, 'send']);
        Route::post('/{id}/accept', [\App\Http\Controllers\FriendRequestController::class, 'accept']);
        Route::post('/{id}/reject', [\App\Http\Controllers\FriendRequestController::class, 'reject']);
        Route::delete('/{id}/cancel', [\App\Http\Controllers\FriendRequestController::class, 'cancel']);
        Route::delete('/{id}/remove', [\App\Http\Controllers\FriendRequestController::class, 'remove']);
        Route::get('/search', [\App\Http\Controllers\FriendRequestController::class, 'searchUsers']);
    });
});
