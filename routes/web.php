<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatController;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = Auth::user();
    $totalUsers = User::where('id', '!=', $user->id)->count();
    $totalMessages = Message::where(function($query) use ($user) {
        $query->where('sender_id', $user->id)
              ->orWhere('receiver_id', $user->id);
    })->count();
    $totalConversations = User::where('id', '!=', $user->id)
        ->whereHas('sentMessages', function($query) use ($user) {
            $query->where('receiver_id', $user->id);
        })
        ->orWhereHas('receivedMessages', function($query) use ($user) {
            $query->where('sender_id', $user->id);
        })
        ->count();
    $unreadMessages = Message::where('receiver_id', $user->id)
        ->where('read', false)
        ->count();
    
    return Inertia::render('Dashboard', [
        'stats' => [
            'total_users' => $totalUsers,
            'total_messages' => $totalMessages,
            'total_conversations' => $totalConversations,
            'unread_messages' => $unreadMessages,
        ],
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/users', [UserController::class, 'users'])->name('users');
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat/{userId}', [ChatController::class, 'show'])->name('chat.show');
});

require __DIR__.'/auth.php';
