<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\EmergencyController;
use App\Http\Controllers\AdminController;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
    
    // Only admins can access dashboard - redirect regular users to messages
    if (!$user || $user->role !== 'admin') {
        return redirect()->route('chat.index');
    }
    
    $userId = $user->id;
    
    // Optimized: Get all stats in a single optimized query using raw SQL for maximum performance
    $stats = DB::selectOne("
        SELECT 
            (SELECT COUNT(*) FROM users WHERE id != ?) as total_users,
            (SELECT COUNT(*) FROM messages WHERE sender_id = ? OR receiver_id = ?) as total_messages,
            (SELECT COUNT(DISTINCT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END) 
             FROM messages WHERE sender_id = ? OR receiver_id = ?) as total_conversations,
            (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND `read` = 0) as unread_messages
    ", [$userId, $userId, $userId, $userId, $userId, $userId, $userId]);
    
    // Get notifications
    $notifications = \App\Models\Notification::where('user_id', $userId)
        ->orderBy('created_at', 'desc')
        ->limit(20)
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

    $unreadNotificationCount = \App\Models\Notification::where('user_id', $userId)
        ->where('read', false)
        ->count();
    
    return Inertia::render('Dashboard', [
        'stats' => [
            'total_users' => (int) $stats->total_users,
            'total_messages' => (int) $stats->total_messages,
            'total_conversations' => (int) $stats->total_conversations,
            'unread_messages' => (int) $stats->unread_messages,
        ],
        'notifications' => $notifications,
        'unread_notification_count' => $unreadNotificationCount,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/users', [UserController::class, 'users'])->name('users');
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::get('/chat/{userId}', [ChatController::class, 'show'])->name('chat.show');
    Route::get('/blood-donation', function () {
        return Inertia::render('BloodDonation/Index');
    })->name('blood-donation.index');
    Route::get('/blood-donation/requests', function () {
        return Inertia::render('BloodDonation/Requests');
    })->name('blood-donation.requests');
    Route::get('/blood-donation/find-donors', function () {
        return Inertia::render('BloodDonation/FindDonors');
    })->name('blood-donation.find-donors');
    Route::get('/friends', function () {
        return Inertia::render('Friends/Index');
    })->name('friends.index');
    
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/{notification}', [NotificationController::class, 'show'])->name('notifications.show');
    Route::get('/notifications/api', [NotificationController::class, 'getNotifications'])->name('notifications.get');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    
    // Emergency routes
    Route::get('/emergency', function () {
        $user = Auth::user();
        $userId = $user->id;
        
        // Get user's active emergency requests
        $activeEmergencies = \App\Models\EmergencyRequest::where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($emergency) {
                return [
                    'id' => $emergency->id,
                    'type' => $emergency->type,
                    'title' => $emergency->title,
                    'description' => $emergency->description,
                    'latitude' => $emergency->latitude,
                    'longitude' => $emergency->longitude,
                    'address' => $emergency->address,
                    'status' => $emergency->status,
                    'priority' => $emergency->priority,
                    'google_maps_url' => $emergency->google_maps_url,
                    'formatted_location' => $emergency->formatted_location,
                    'created_at' => $emergency->created_at->toISOString(),
                    'time_ago' => $emergency->created_at->diffForHumans(),
                ];
            });

        // Get nearby active emergencies from friends only
        $friendIds = $user->friendIds();
        $nearbyEmergencies = collect();
        
        if ($friendIds->isNotEmpty()) {
            $nearbyEmergencies = \App\Models\EmergencyRequest::with('user')
                ->where('status', 'active')
                ->whereIn('user_id', $friendIds->all())
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->get()
                ->map(function ($emergency) {
                    return [
                        'id' => $emergency->id,
                        'type' => $emergency->type,
                        'title' => $emergency->title,
                        'description' => $emergency->description,
                        'latitude' => $emergency->latitude,
                        'longitude' => $emergency->longitude,
                        'address' => $emergency->address,
                        'priority' => $emergency->priority,
                        'user' => [
                            'id' => $emergency->user->id,
                            'name' => $emergency->user->name,
                            'phone' => $emergency->user->phone,
                        ],
                        'google_maps_url' => $emergency->google_maps_url,
                        'formatted_location' => $emergency->formatted_location,
                        'created_at' => $emergency->created_at->toISOString(),
                        'time_ago' => $emergency->created_at->diffForHumans(),
                    ];
                });
        }
        
        return Inertia::render('Emergency/Index', [
            'activeEmergencies' => $activeEmergencies,
            'nearbyEmergencies' => $nearbyEmergencies,
        ]);
    })->name('emergency.index');
    Route::post('/emergency', [EmergencyController::class, 'store'])->name('emergency.store');
    Route::get('/emergency/{emergencyRequest}', [EmergencyController::class, 'show'])->name('emergency.show');
    Route::patch('/emergency/{emergencyRequest}', [EmergencyController::class, 'update'])->name('emergency.update');
});

// Admin routes
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    Route::get('/managers', function () {
        return Inertia::render('Admin/Managers');
    })->name('managers');
    Route::get('/managers/api', [AdminController::class, 'getManagers'])->name('managers.get');
    Route::get('/users', function () {
        return Inertia::render('Admin/Users');
    })->name('users');
    Route::get('/users/api', [AdminController::class, 'getUsers'])->name('users.get');
    Route::get('/notifications', function () {
        return Inertia::render('Admin/Notifications');
    })->name('notifications');
    Route::get('/emergency', function () {
        return Inertia::render('Admin/Emergency');
    })->name('emergency');
    Route::get('/settings', function () {
        return Inertia::render('Admin/Settings');
    })->name('settings');
    Route::post('/managers', [AdminController::class, 'addManager'])->name('managers.add');
    Route::delete('/managers/{id}', [AdminController::class, 'removeManager'])->name('managers.remove');
    Route::delete('/users/{id}', [AdminController::class, 'removeUser'])->name('users.remove');
    Route::post('/notifications/send-all', [AdminController::class, 'sendNotificationToAll'])->name('notifications.send-all');
    Route::post('/emergency/send-all', [AdminController::class, 'sendEmergencyToAll'])->name('emergency.send-all');
    Route::post('/maintenance/toggle', [AdminController::class, 'toggleMaintenanceMode'])->name('maintenance.toggle');
    Route::get('/maintenance/status', [AdminController::class, 'getMaintenanceMode'])->name('maintenance.status');
});

require __DIR__.'/auth.php';
