<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        
        // Debug: Log incoming data
        Log::info('Profile update request', [
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'donor' => $request->input('donor'),
            'has_image' => $request->hasFile('image'),
            'all_input' => $request->except(['_method', '_token']),
        ]);
        
        $validated = $request->validated();

        // Handle image upload
        if ($request->hasFile('image')) {
            try {
                // Delete old image if exists
                if ($user->image && Storage::disk('public')->exists($user->image)) {
                    Storage::disk('public')->delete($user->image);
                }

                // Store new image
                $imagePath = $request->file('image')->store('profile-images', 'public');
                
                // Verify the file was stored
                if (!Storage::disk('public')->exists($imagePath)) {
                    Log::error('Image upload failed: File not stored', ['path' => $imagePath]);
                    return Redirect::back()->withErrors(['image' => 'Failed to save image. Please try again.']);
                }
                
                $validated['image'] = $imagePath;
                Log::info('Image uploaded successfully', ['path' => $imagePath]);
            } catch (\Exception $e) {
                Log::error('Image upload error', [
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return Redirect::back()->withErrors(['image' => 'Failed to upload image: ' . $e->getMessage()]);
            }
        } else {
            // Keep existing image if no new one is uploaded - don't modify the image field
            unset($validated['image']);
        }

        // Convert empty strings to null for nullable fields
        $cleanedData = [];
        foreach ($validated as $key => $value) {
            if ($value === '' || $value === null) {
                $cleanedData[$key] = null;
            } else {
                $cleanedData[$key] = $value;
            }
        }

        // Fill user with cleaned data
        $user->fill($cleanedData);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // Refresh the user model to get the updated image path
        $user->refresh();

        // Return redirect with success message
        // The HandleInertiaRequests middleware will automatically include the updated user in the response
        return Redirect::route('profile.edit')
            ->with('status', 'profile-updated')
            ->with('success', 'Profile updated successfully');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
