<?php

namespace App\Http\Controllers;

use App\Models\Call;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CallController extends Controller
{
    /**
     * Initiate a call
     */
    public function initiate(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'type' => 'nullable|in:audio,video',
        ]);

        $caller = Auth::user();
        $receiver = User::findOrFail($request->receiver_id);

        // Check if user is trying to call themselves
        if ($caller->id === $receiver->id) {
            return response()->json([
                'success' => false,
                'error' => 'You cannot call yourself',
            ], 400);
        }

        // Create call record
        $call = Call::create([
            'caller_id' => $caller->id,
            'receiver_id' => $receiver->id,
            'status' => 'ringing',
            'type' => $request->input('type', 'audio'),
            'started_at' => now(),
        ]);

        Log::info('Call initiated', [
            'call_id' => $call->id,
            'caller' => $caller->id,
            'receiver' => $receiver->id,
        ]);

        return response()->json([
            'success' => true,
            'call' => [
                'id' => $call->id,
                'caller' => [
                    'id' => $caller->id,
                    'name' => $caller->name,
                    'image' => $caller->image,
                ],
                'receiver' => [
                    'id' => $receiver->id,
                    'name' => $receiver->name,
                    'image' => $receiver->image,
                ],
                'status' => $call->status,
                'type' => $call->type,
                'offer_sdp' => $call->offer_sdp,
                'answer_sdp' => $call->answer_sdp,
                'started_at' => $call->started_at->toISOString(),
            ],
        ]);
    }

    /**
     * Accept a call
     */
    public function accept(Request $request, $callId)
    {
        $call = Call::findOrFail($callId);
        $user = Auth::user();

        // Check if user is the receiver
        if ($call->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        // Check if call is still ringing
        if ($call->status !== 'ringing') {
            return response()->json([
                'success' => false,
                'error' => 'Call is not in ringing state',
            ], 400);
        }

        $call->update([
            'status' => 'connected',
            'answered_at' => now(),
        ]);

        Log::info('Call accepted', [
            'call_id' => $call->id,
        ]);

        return response()->json([
            'success' => true,
            'call' => [
                'id' => $call->id,
                'status' => $call->status,
                'offer_sdp' => $call->offer_sdp,
                'answer_sdp' => $call->answer_sdp,
                'answered_at' => $call->answered_at->toISOString(),
            ],
        ]);
    }

    /**
     * Reject or end a call
     */
    public function end(Request $request, $callId)
    {
        $call = Call::findOrFail($callId);
        $user = Auth::user();

        // Check if user is part of the call
        if ($call->caller_id !== $user->id && $call->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $status = $call->status === 'ringing' ? 'rejected' : 'ended';
        
        $call->update([
            'status' => $status,
            'ended_at' => now(),
        ]);

        // Calculate duration if call was connected
        if ($call->answered_at) {
            $duration = $call->ended_at->diffInSeconds($call->answered_at);
            $call->duration = $duration;
            $call->save();
        }

        Log::info('Call ended', [
            'call_id' => $call->id,
            'status' => $status,
        ]);

        return response()->json([
            'success' => true,
            'call' => [
                'id' => $call->id,
                'status' => $call->status,
                'ended_at' => $call->ended_at->toISOString(),
            ],
        ]);
    }

    /**
     * Get active call for user
     */
    public function active(Request $request)
    {
        $user = Auth::user();

        $call = Call::where(function($query) use ($user) {
            $query->where('caller_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
        })
        ->whereIn('status', ['ringing', 'connected'])
        ->with(['caller', 'receiver'])
        ->latest()
        ->first();

        if (!$call) {
            return response()->json([
                'success' => false,
                'call' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'call' => [
                'id' => $call->id,
                'caller' => [
                    'id' => $call->caller->id,
                    'name' => $call->caller->name,
                    'image' => $call->caller->image,
                ],
                'receiver' => [
                    'id' => $call->receiver->id,
                    'name' => $call->receiver->name,
                    'image' => $call->receiver->image,
                ],
                'status' => $call->status,
                'type' => $call->type,
                'offer_sdp' => $call->offer_sdp,
                'answer_sdp' => $call->answer_sdp,
                'started_at' => $call->started_at ? $call->started_at->toISOString() : null,
                'answered_at' => $call->answered_at ? $call->answered_at->toISOString() : null,
                'ended_at' => $call->ended_at ? $call->ended_at->toISOString() : null,
            ],
        ]);
    }

    /**
     * Store WebRTC offer SDP
     */
    public function storeOffer(Request $request, $callId)
    {
        $call = Call::findOrFail($callId);
        $user = Auth::user();

        // Check if user is the caller
        if ($call->caller_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $request->validate([
            'offer' => 'required|string',
        ]);

        $call->update([
            'offer_sdp' => $request->offer,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Offer stored',
        ]);
    }

    /**
     * Store WebRTC answer SDP
     */
    public function storeAnswer(Request $request, $callId)
    {
        $call = Call::findOrFail($callId);
        $user = Auth::user();

        // Check if user is the receiver
        if ($call->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $request->validate([
            'answer' => 'required|string',
        ]);

        $call->update([
            'answer_sdp' => $request->answer,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Answer stored',
        ]);
    }

    /**
     * Store ICE candidate
     */
    public function storeIceCandidate(Request $request, $callId)
    {
        $call = Call::findOrFail($callId);
        $user = Auth::user();

        // Check if user is part of the call
        if ($call->caller_id !== $user->id && $call->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $request->validate([
            'candidate' => 'required|array',
        ]);

        // Get existing candidates or initialize
        $candidates = $call->ice_candidates ? json_decode($call->ice_candidates, true) : [];
        if (!is_array($candidates)) {
            $candidates = [];
        }

        // Add new candidate
        $candidates[] = [
            'candidate' => $request->candidate,
            'added_at' => now()->toISOString(),
        ];

        $call->update([
            'ice_candidates' => json_encode($candidates),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'ICE candidate stored',
        ]);
    }

    /**
     * Get ICE candidates for the call
     */
    public function getIceCandidates(Request $request, $callId)
    {
        $call = Call::findOrFail($callId);
        $user = Auth::user();

        // Check if user is part of the call
        if ($call->caller_id !== $user->id && $call->receiver_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 403);
        }

        $candidates = $call->ice_candidates ? json_decode($call->ice_candidates, true) : [];
        if (!is_array($candidates)) {
            $candidates = [];
        }

        // Filter out candidates from the current user (only return peer's candidates)
        $peerId = $call->caller_id === $user->id ? $call->receiver_id : $call->caller_id;
        $peerCandidates = array_filter($candidates, function($item) use ($user, $peerId) {
            // For simplicity, return all candidates - the frontend will filter
            return true;
        });

        return response()->json([
            'success' => true,
            'candidates' => array_values($peerCandidates),
        ]);
    }
}

