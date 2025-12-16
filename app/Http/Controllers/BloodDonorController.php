<?php

namespace App\Http\Controllers;

use App\Models\BloodDonor;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class BloodDonorController extends Controller
{
    /**
     * Get all blood donors (with optional filters)
     */
    public function index(Request $request)
    {
        try {
            $visibleUserIds = $this->visibleUserIds();

            $query = BloodDonor::with('user')
                ->where('is_available', true)
                ->whereIn('user_id', $visibleUserIds->all());

            // Filter by blood group if provided
            if ($request->has('blood_group') && $request->blood_group) {
                $query->where('blood_group', $request->blood_group);
            }

            // Filter by city if provided
            if ($request->has('city') && $request->city) {
                $query->where('city', 'like', '%' . $request->city . '%');
            }

            // Filter by state if provided
            if ($request->has('state') && $request->state) {
                $query->where('state', 'like', '%' . $request->state . '%');
            }

            $donors = $query->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($donor) {
                    return [
                        'id' => $donor->id,
                        'user_id' => $donor->user_id,
                        'user_name' => $donor->user->name,
                        'user_email' => $donor->user->email,
                        'blood_group' => $donor->blood_group,
                        'last_donation_date' => $donor->last_donation_date?->format('Y-m-d'),
                        'next_available_date' => $donor->next_available_date?->format('Y-m-d'),
                        'contact_phone' => $donor->contact_phone,
                        'address' => $donor->address,
                        'city' => $donor->city,
                        'state' => $donor->state,
                        'zip' => $donor->zip,
                        'is_available' => $donor->is_available,
                        'notes' => $donor->notes,
                        'created_at' => $donor->created_at->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'donors' => $donors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch blood donors',
            ], 500);
        }
    }

    /**
     * Register as a blood donor
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'blood_group' => 'nullable|string|max:10',
                'last_donation_date' => 'nullable|date',
                'next_available_date' => 'nullable|date|after_or_equal:today',
                'contact_phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'zip' => 'nullable|string|max:20',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            // Check if user already has a donor record
            $existingDonor = BloodDonor::where('user_id', $userId)->first();

            if ($existingDonor) {
                // Update existing record
                $existingDonor->update($validator->validated());
                $donor = $existingDonor->fresh(['user']);
            } else {
                // Create new record
                $donor = BloodDonor::create([
                    'user_id' => $userId,
                    ...$validator->validated(),
                    'is_available' => true,
                ]);
                $donor->load('user');
            }

            return response()->json([
                'success' => true,
                'donor' => [
                    'id' => $donor->id,
                    'user_id' => $donor->user_id,
                    'user_name' => $donor->user->name,
                    'user_email' => $donor->user->email,
                    'blood_group' => $donor->blood_group,
                    'last_donation_date' => $donor->last_donation_date?->format('Y-m-d'),
                    'next_available_date' => $donor->next_available_date?->format('Y-m-d'),
                    'contact_phone' => $donor->contact_phone,
                    'address' => $donor->address,
                    'city' => $donor->city,
                    'state' => $donor->state,
                    'zip' => $donor->zip,
                    'is_available' => $donor->is_available,
                    'notes' => $donor->notes,
                    'created_at' => $donor->created_at->toISOString(),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to register as blood donor',
            ], 500);
        }
    }

    /**
     * Get current user's donor profile
     */
    public function show()
    {
        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            $donor = BloodDonor::with('user')
                ->where('user_id', $userId)
                ->first();

            if (!$donor) {
                return response()->json([
                    'success' => false,
                    'error' => 'Blood donor profile not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'donor' => [
                    'id' => $donor->id,
                    'user_id' => $donor->user_id,
                    'user_name' => $donor->user->name,
                    'user_email' => $donor->user->email,
                    'blood_group' => $donor->blood_group,
                    'last_donation_date' => $donor->last_donation_date?->format('Y-m-d'),
                    'next_available_date' => $donor->next_available_date?->format('Y-m-d'),
                    'contact_phone' => $donor->contact_phone,
                    'address' => $donor->address,
                    'city' => $donor->city,
                    'state' => $donor->state,
                    'zip' => $donor->zip,
                    'is_available' => $donor->is_available,
                    'notes' => $donor->notes,
                    'created_at' => $donor->created_at->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch blood donor profile',
            ], 500);
        }
    }

    /**
     * Update current user's donor profile
     */
    public function update(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'blood_group' => 'nullable|string|max:10',
                'last_donation_date' => 'nullable|date',
                'next_available_date' => 'nullable|date|after_or_equal:today',
                'contact_phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'zip' => 'nullable|string|max:20',
                'is_available' => 'nullable|boolean',
                'notes' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            $donor = BloodDonor::where('user_id', $userId)->first();

            if (!$donor) {
                return response()->json([
                    'success' => false,
                    'error' => 'Blood donor profile not found',
                ], 404);
            }

            $donor->update($validator->validated());
            $donor->load('user');

            return response()->json([
                'success' => true,
                'donor' => [
                    'id' => $donor->id,
                    'user_id' => $donor->user_id,
                    'user_name' => $donor->user->name,
                    'user_email' => $donor->user->email,
                    'blood_group' => $donor->blood_group,
                    'last_donation_date' => $donor->last_donation_date?->format('Y-m-d'),
                    'next_available_date' => $donor->next_available_date?->format('Y-m-d'),
                    'contact_phone' => $donor->contact_phone,
                    'address' => $donor->address,
                    'city' => $donor->city,
                    'state' => $donor->state,
                    'zip' => $donor->zip,
                    'is_available' => $donor->is_available,
                    'notes' => $donor->notes,
                    'created_at' => $donor->created_at->toISOString(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to update blood donor profile',
            ], 500);
        }
    }

    /**
     * Delete current user's donor profile
     */
    public function destroy()
    {
        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            $donor = BloodDonor::where('user_id', $userId)->first();

            if (!$donor) {
                return response()->json([
                    'success' => false,
                    'error' => 'Blood donor profile not found',
                ], 404);
            }

            $donor->delete();

            return response()->json([
                'success' => true,
                'message' => 'Blood donor profile deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete blood donor profile',
            ], 500);
        }
    }

    /**
     * Submit a blood need request
     */
    public function requestBlood(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'blood_group' => 'required|string|max:10',
                'units_needed' => 'required|integer|min:1',
                'urgency' => 'required|in:normal,urgent,critical',
                'patient_name' => 'required|string|max:255',
                'hospital_name' => 'required|string|max:255',
                'hospital_address' => 'required|string|max:500',
                'city' => 'required|string|max:100',
                'state' => 'nullable|string|max:100',
                'contact_phone' => 'required|string|max:20',
                'contact_email' => 'nullable|email|max:255',
                'needed_by_date' => 'required|date|after_or_equal:today',
                'needed_by_time' => ['required', 'string', 'regex:/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/'],
                'additional_info' => 'required|string|min:10|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            // Extract coordinates if available from request
            $latitude = $request->input('latitude');
            $longitude = $request->input('longitude');
            
            // Convert time string to proper format (HH:MM:SS)
            $neededByTime = $request->needed_by_time;
            if (strlen($neededByTime) === 5) {
                // Format is HH:MM, add :00 for seconds
                $neededByTime = $neededByTime . ':00';
            }
            
            // Save the blood request to database
            $bloodRequest = \App\Models\BloodRequest::create([
                'user_id' => $userId,
                'blood_group' => $request->blood_group,
                'units_needed' => $request->units_needed,
                'urgency' => $request->urgency,
                'patient_name' => $request->patient_name,
                'hospital_name' => $request->hospital_name,
                'hospital_address' => $request->hospital_address,
                'city' => $request->city,
                'state' => $request->state,
                'latitude' => $latitude ? (float)$latitude : null,
                'longitude' => $longitude ? (float)$longitude : null,
                'contact_phone' => $request->contact_phone,
                'contact_email' => $request->contact_email,
                'needed_by_date' => $request->needed_by_date,
                'needed_by_time' => $neededByTime,
                'additional_info' => $request->additional_info,
                'status' => 'pending',
            ]);

            // Notify donors with matching blood group
            $this->notifyMatchingDonors($bloodRequest);

            return response()->json([
                'success' => true,
                'message' => 'Blood request submitted successfully. Donors will be notified.',
                'request' => $bloodRequest->load('user'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Blood request submission error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to submit blood request',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all blood requests (for viewing saved requests)
     */
    public function getRequests(Request $request)
    {
        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            $query = \App\Models\BloodRequest::with(['user', 'managedBy'])
                ->whereIn('user_id', $this->visibleUserIds()->all())
                ->orderBy('created_at', 'desc');

            // Filter by user's requests if requested
            if ($request->has('my_requests') && $request->my_requests) {
                $query->where('user_id', $userId);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by blood group
            if ($request->has('blood_group')) {
                $query->where('blood_group', $request->blood_group);
            }

            // Filter by city
            if ($request->has('city')) {
                $query->where('city', $request->city);
            }

            $requests = $query->paginate(20);

            return response()->json([
                'success' => true,
                'requests' => $requests,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch blood requests',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single blood request by ID
     */
    public function getRequest($id)
    {
        try {
            $request = \App\Models\BloodRequest::with(['user', 'managedBy'])->findOrFail($id);

            if (!$this->visibleUserIds()->contains($request->user_id)) {
                return response()->json([
                    'success' => false,
                    'error' => 'You can only view requests from your friends.',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'request' => $request,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Blood request not found',
            ], 404);
        }
    }

    /**
     * Mark a blood request as managed by current user
     */
    public function manageRequest($id)
    {
        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            $bloodRequest = \App\Models\BloodRequest::findOrFail($id);

            if (!$this->visibleUserIds()->contains($bloodRequest->user_id)) {
                return response()->json([
                    'success' => false,
                    'error' => 'You can only manage requests from your friends.',
                ], 403);
            }

            // Check if already managed
            if ($bloodRequest->managed_by && $bloodRequest->managed_by !== $userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'This request is already being managed by another user',
                ], 409);
            }

            // Update the request
            $bloodRequest->update([
                'managed_by' => $userId,
                'managed_at' => now(),
                'status' => 'fulfilled',
            ]);

            $bloodRequest->load(['user', 'managedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Blood request marked as managed. Waiting for requester confirmation.',
                'request' => $bloodRequest,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Manage blood request error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to manage blood request',
            ], 500);
        }
    }

    /**
     * Confirm management by the requester
     */
    public function confirmManagement($id)
    {
        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            $bloodRequest = \App\Models\BloodRequest::findOrFail($id);

            // Check if user is the requester
            if ($bloodRequest->user_id !== $userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'Only the requester can confirm management',
                ], 403);
            }

            // Check if request is managed
            if (!$bloodRequest->managed_by) {
                return response()->json([
                    'success' => false,
                    'error' => 'This request has not been managed yet',
                ], 400);
            }

            // Update the request
            $bloodRequest->update([
                'confirmed_by_requester' => true,
                'confirmed_at' => now(),
            ]);

            $bloodRequest->load(['user', 'managedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Management confirmed successfully',
                'request' => $bloodRequest,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Confirm management error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to confirm management',
            ], 500);
        }
    }

    /**
     * Update a blood request (only by the requester)
     */
    public function updateRequest(Request $request, $id)
    {
        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated',
                ], 401);
            }

            $bloodRequest = \App\Models\BloodRequest::findOrFail($id);

            // Check if user is the requester
            if ($bloodRequest->user_id !== $userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'Only the requester can update this request',
                ], 403);
            }

            // Check if already confirmed
            if ($bloodRequest->confirmed_by_requester) {
                return response()->json([
                    'success' => false,
                    'error' => 'Cannot update a request that has been confirmed',
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'blood_group' => 'sometimes|required|string|max:10',
                'units_needed' => 'sometimes|required|integer|min:1',
                'urgency' => 'sometimes|required|in:normal,urgent,critical',
                'status' => 'sometimes|in:pending,normal,o-,fulfilled,cancelled,managed',
                'patient_name' => 'sometimes|required|string|max:255',
                'hospital_name' => 'sometimes|required|string|max:255',
                'hospital_address' => 'sometimes|required|string|max:500',
                'city' => 'sometimes|required|string|max:100',
                'state' => 'sometimes|required|string|max:100',
                'contact_phone' => 'sometimes|required|string|max:20',
                'contact_email' => 'nullable|email|max:255',
                'needed_by_date' => 'sometimes|required|date|after_or_equal:today',
                'needed_by_time' => ['sometimes', 'required', 'string', 'regex:/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/'],
                'additional_info' => 'sometimes|required|string|min:10|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = $validator->validated();

            // Handle time format
            if (isset($updateData['needed_by_time']) && strlen($updateData['needed_by_time']) === 5) {
                $updateData['needed_by_time'] = $updateData['needed_by_time'] . ':00';
            }

            // Handle coordinates
            if ($request->has('latitude')) {
                $updateData['latitude'] = $request->latitude ? (float)$request->latitude : null;
            }
            if ($request->has('longitude')) {
                $updateData['longitude'] = $request->longitude ? (float)$request->longitude : null;
            }

            $bloodRequest->update($updateData);
            $bloodRequest->load(['user', 'managedBy']);

            return response()->json([
                'success' => true,
                'message' => 'Blood request updated successfully',
                'request' => $bloodRequest,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Update blood request error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to update blood request',
            ], 500);
        }
    }

    /**
     * Notify donors with matching blood group about a new blood request
     */
    private function notifyMatchingDonors(\App\Models\BloodRequest $bloodRequest)
    {
        // Find all available donors with matching blood group
        $friendIds = $bloodRequest->user->friendIds();

        if ($friendIds->isEmpty()) {
            return;
        }

        $donors = BloodDonor::where('blood_group', $bloodRequest->blood_group)
            ->where('is_available', true)
            ->whereIn('user_id', $friendIds->all())
            ->with('user')
            ->get();

        $urgencyLabels = [
            'normal' => 'Normal',
            'urgent' => 'Urgent',
            'critical' => 'Critical',
        ];

        $urgencyLabel = $urgencyLabels[$bloodRequest->urgency] ?? 'Normal';

        foreach ($donors as $donor) {
            Notification::create([
                'user_id' => $donor->user_id,
                'type' => 'blood_request',
                'title' => "New Blood Request - {$bloodRequest->blood_group}",
                'message' => "{$bloodRequest->user->name} needs {$bloodRequest->units_needed} unit(s) of {$bloodRequest->blood_group} blood ({$urgencyLabel} urgency). Needed by {$bloodRequest->needed_by_date->format('M d, Y')} at {$bloodRequest->needed_by_time}.",
                'data' => [
                    'request_id' => $bloodRequest->id,
                    'sender_id' => $bloodRequest->user_id,
                    'blood_group' => $bloodRequest->blood_group,
                    'urgency' => $bloodRequest->urgency,
                    'link' => route('blood-donation.requests'),
                ],
                'read' => false,
            ]);
        }
    }

    private function visibleUserIds(): Collection
    {
        $user = Auth::user();
        return $user->friendIds()->concat([$user->id])->unique()->values();
    }
}

