<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'csrf_token' => csrf_token(),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     * Optimized for speed - minimal operations.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        // Regenerate session for security
        $request->session()->regenerate();

        // Redirect based on user role
        $user = Auth::user();
        $redirectRoute = $user->role === 'admin' 
            ? route('dashboard', absolute: false)
            : route('chat.index', absolute: false);

        // Use intended redirect for faster response
        return redirect()->intended($redirectRoute);
    }

    /**
     * Destroy an authenticated session.
     * Optimized for speed - minimal session operations.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Logout and invalidate in one go for better performance
        Auth::guard('web')->logout();
        
        // Invalidate session (this also clears all session data)
        $request->session()->invalidate();
        
        // Regenerate token for security
        $request->session()->regenerateToken();

        // Use simple redirect without extra processing
        return redirect('/');
    }
}
