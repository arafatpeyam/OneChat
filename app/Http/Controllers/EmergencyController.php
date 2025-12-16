<?php

namespace App\Http\Controllers;

use App\Models\EmergencyRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EmergencyController extends Controller
{
    /**
     * Display emergency panel
     */
    public function index(): Response
    {
        $user = Auth::user();
        $friendIds = $user->friendIds();
        
        // Get user's active emergency requests
        $activeEmergencies = EmergencyRequest::where('user_id', $user->id)
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

        // Get nearby active emergencies (within 10km radius)
        $nearbyEmergencies = collect();
        if ($friendIds->isNotEmpty()) {
            $nearbyEmergencies = EmergencyRequest::where('status', 'active')
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

        return Inertia::render('Dashboard', [
            'activeEmergencies' => $activeEmergencies,
            'nearbyEmergencies' => $nearbyEmergencies,
        ]);
    }

    /**
     * Store a new emergency request
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:fire,harassment,medical,accident,crime,natural_disaster,other',
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:2000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'address' => 'nullable|string|max:500',
            'priority' => 'nullable|integer|in:1,2,3,4',
        ]);

        $user = Auth::user();

        // Determine priority based on type if not provided
        if (!isset($validated['priority'])) {
            $priorityMap = [
                'fire' => 4,
                'medical' => 4,
                'accident' => 4,
                'crime' => 4,
                'harassment' => 3,
                'natural_disaster' => 4,
                'other' => 2,
            ];
            $validated['priority'] = $priorityMap[$validated['type']] ?? 2;
        }

        $emergency = EmergencyRequest::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'address' => $validated['address'] ?? null,
            'priority' => $validated['priority'],
            'status' => 'active',
        ]);

        // Create notification for nearby users (within 10km)
        // This would ideally use a background job, but for now we'll do it synchronously
        $this->notifyNearbyUsers($emergency);

        Log::info('Emergency request created', [
            'emergency_id' => $emergency->id,
            'user_id' => $user->id,
            'type' => $emergency->type,
            'priority' => $emergency->priority,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Emergency request sent successfully',
            'emergency' => [
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
            ],
        ]);
    }

    /**
     * Update emergency request status
     */
    public function update(Request $request, EmergencyRequest $emergencyRequest)
    {
        $user = Auth::user();
        
        // Only the owner can update the emergency status
        if ($emergencyRequest->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Only the emergency requester can update the status.',
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,resolved,cancelled',
        ]);

        $emergencyRequest->update([
            'status' => $validated['status'],
            'resolved_at' => $validated['status'] === 'resolved' ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Emergency request updated successfully',
            'emergency' => [
                'id' => $emergencyRequest->id,
                'status' => $emergencyRequest->status,
                'resolved_at' => $emergencyRequest->resolved_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Get emergency request details
     */
    public function show(EmergencyRequest $emergencyRequest)
    {
        // Check if user has access (friends only)
        $user = Auth::user();
        $friendIds = $user->friendIds();
        
        if ($emergencyRequest->user_id !== $user->id && !$friendIds->contains($emergencyRequest->user_id)) {
            abort(403, 'You can only view emergencies from your friends.');
        }

        $emergency = [
            'id' => $emergencyRequest->id,
            'type' => $emergencyRequest->type,
            'title' => $emergencyRequest->title,
            'description' => $emergencyRequest->description,
            'latitude' => $emergencyRequest->latitude,
            'longitude' => $emergencyRequest->longitude,
            'address' => $emergencyRequest->address,
            'status' => $emergencyRequest->status,
            'priority' => $emergencyRequest->priority,
            'user' => [
                'id' => $emergencyRequest->user->id,
                'name' => $emergencyRequest->user->name,
                'phone' => $emergencyRequest->user->phone,
                'email' => $emergencyRequest->user->email,
            ],
            'google_maps_url' => $emergencyRequest->google_maps_url,
            'formatted_location' => $emergencyRequest->formatted_location,
            'created_at' => $emergencyRequest->created_at->toISOString(),
        ];

        return Inertia::render('Emergency/Show', [
            'emergency' => $emergency,
            'canResolve' => $emergencyRequest->user_id === $user->id, // Only owner can resolve
        ]);
    }

    /**
     * Notify nearby users about emergency
     */
    private function notifyNearbyUsers(EmergencyRequest $emergency)
    {
        if (!$emergency->latitude || !$emergency->longitude) {
            return;
        }

        $friendIds = $emergency->user->friendIds();

        if ($friendIds->isEmpty()) {
            return;
        }

        $users = \App\Models\User::whereIn('id', $friendIds->all())->get();

        $typeLabels = [
            'fire' => 'Fire Emergency',
            'harassment' => 'Harassment',
            'medical' => 'Medical Emergency',
            'accident' => 'Accident',
            'crime' => 'Crime',
            'natural_disaster' => 'Natural Disaster',
            'other' => 'Emergency',
        ];

        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'type' => 'emergency',
                'title' => $typeLabels[$emergency->type] ?? 'Emergency Alert',
                'message' => "{$emergency->user->name} needs help: {$emergency->title}",
                'data' => [
                    'emergency_id' => $emergency->id,
                    'sender_id' => $emergency->user_id,
                    'link' => route('emergency.show', $emergency->id),
                ],
                'read' => false,
            ]);
        }
    }
}
