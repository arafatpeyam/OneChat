<?php

use App\Http\Controllers\CallController;
use App\Http\Controllers\MessageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(['web', 'auth'])->group(function () {
    Route::post('/messages/send', [MessageController::class, 'send']);
    Route::get('/messages/{userId}', [MessageController::class, 'getMessages']);
    
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
        $totalConversations = \App\Models\User::where('id', '!=', $user->id)
            ->whereHas('sentMessages', function($query) use ($user) {
                $query->where('receiver_id', $user->id);
            })
            ->orWhereHas('receivedMessages', function($query) use ($user) {
                $query->where('sender_id', $user->id);
            })
            ->count();
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
});

