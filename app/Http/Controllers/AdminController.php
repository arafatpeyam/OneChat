<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Models\EmergencyRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Admin Dashboard
     */
    public function dashboard(): Response
    {
        $stats = [
            'total_users' => User::where('role', 'user')->count(),
            'total_managers' => User::where('role', 'manager')->count(),
            'total_admins' => User::where('role', 'admin')->count(),
            'total_notifications' => Notification::count(),
            'total_emergencies' => EmergencyRequest::count(),
            'active_emergencies' => EmergencyRequest::where('status', 'active')->count(),
        ];

        $maintenanceMode = SystemSetting::isMaintenanceMode();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'maintenanceMode' => $maintenanceMode,
        ]);
    }

    /**
     * Get all managers
     */
    public function getManagers()
    {
        $managers = User::where('role', 'manager')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($manager) {
                return [
                    'id' => $manager->id,
                    'name' => $manager->name,
                    'email' => $manager->email,
                    'phone' => $manager->phone,
                    'created_at' => $manager->created_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'managers' => $managers,
        ]);
    }

    /**
     * Get all users (including managers, excluding admins)
     */
    public function getUsers()
    {
        $users = User::whereIn('role', ['user', 'manager'])
            ->orderBy('role', 'asc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'created_at' => $user->created_at->toISOString(),
                    'last_seen_at' => $user->last_seen_at?->toISOString(),
                    'is_online' => $user->isOnline(),
                ];
            });

        return response()->json([
            'success' => true,
            'users' => $users,
        ]);
    }

    /**
     * Add a new manager
     */
    public function addManager(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $manager = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Manager added successfully',
            'manager' => [
                'id' => $manager->id,
                'name' => $manager->name,
                'email' => $manager->email,
                'phone' => $manager->phone,
                'created_at' => $manager->created_at->toISOString(),
            ],
        ]);
    }

    /**
     * Remove a manager (convert to user)
     */
    public function removeManager(Request $request, $id)
    {
        $manager = User::where('id', $id)->where('role', 'manager')->first();

        if (!$manager) {
            return response()->json([
                'success' => false,
                'message' => 'Manager not found',
            ], 404);
        }

        $manager->update(['role' => 'user']);

        return response()->json([
            'success' => true,
            'message' => 'Manager removed successfully',
        ]);
    }

    /**
     * Remove a user (can remove users and managers, but not admins)
     * This permanently deletes the user and all related data.
     * The user will need to register again to use the site.
     */
    public function removeUser(Request $request, $id)
    {
        $user = User::whereIn('role', ['user', 'manager'])->where('id', $id)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }

        // Don't allow deleting admin
        if ($user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete admin user',
            ], 403);
        }

        // Delete related data
        DB::transaction(function () use ($user) {
            // Delete messages
            \App\Models\Message::where('sender_id', $user->id)->orWhere('receiver_id', $user->id)->delete();
            
            // Delete friend requests
            \App\Models\FriendRequest::where('sender_id', $user->id)->orWhere('receiver_id', $user->id)->delete();
            
            // Delete notifications
            \App\Models\Notification::where('user_id', $user->id)->delete();
            
            // Delete calls
            \App\Models\Call::where('caller_id', $user->id)->orWhere('receiver_id', $user->id)->delete();
            
            // Delete blood donor record
            \App\Models\BloodDonor::where('user_id', $user->id)->delete();
            
            // Delete blood requests
            \App\Models\BloodRequest::where('user_id', $user->id)->delete();
            
            // Delete emergency requests
            \App\Models\EmergencyRequest::where('user_id', $user->id)->delete();
            
            // Finally, delete the user
            $user->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'User removed successfully from the site. They will need to register again to use the site.',
        ]);
    }

    /**
     * Send notification to all users
     */
    public function sendNotificationToAll(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|string|in:info,alert,emergency',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $users = User::where('role', 'user')->get();
        $type = $request->type ?? 'info';

        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $request->title,
                'message' => $request->message,
                'data' => [
                    'sender_id' => Auth::id(),
                    'admin_notification' => true,
                ],
                'read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Notification sent to {$users->count()} users",
        ]);
    }

    /**
     * Send emergency notification to all users (including managers)
     */
    public function sendEmergencyToAll(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|string|in:fire,harassment,medical,accident,crime,natural_disaster,other',
            'priority' => 'required|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Send to all users and managers (not admins)
        $users = User::whereIn('role', ['user', 'manager'])->get();
        $admin = Auth::user();

        $typeLabels = [
            'fire' => 'Fire Emergency',
            'harassment' => 'Harassment',
            'medical' => 'Medical Emergency',
            'accident' => 'Accident',
            'crime' => 'Crime',
            'natural_disaster' => 'Natural Disaster',
            'other' => 'Emergency',
        ];

        $priorityLabels = [
            1 => 'Low',
            2 => 'Medium',
            3 => 'High',
            4 => 'Critical',
            5 => 'Critical',
        ];

        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'emergency',
                'title' => $typeLabels[$request->type] ?? 'Emergency Alert',
                'message' => "Admin Alert: {$request->title} - {$request->description}",
                'data' => [
                    'sender_id' => $admin->id,
                    'admin_emergency' => true,
                    'emergency_type' => $request->type,
                    'priority' => $request->priority,
                    'priority_label' => $priorityLabels[$request->priority] ?? 'Medium',
                ],
                'read' => false,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Emergency notification sent to {$users->count()} users",
        ]);
    }

    /**
     * Toggle maintenance mode
     */
    public function toggleMaintenanceMode(Request $request)
    {
        $enabled = SystemSetting::toggleMaintenanceMode();

        return response()->json([
            'success' => true,
            'maintenance_mode' => $enabled,
            'message' => $enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
        ]);
    }

    /**
     * Get maintenance mode status
     */
    public function getMaintenanceMode()
    {
        return response()->json([
            'success' => true,
            'maintenance_mode' => SystemSetting::isMaintenanceMode(),
        ]);
    }
}
