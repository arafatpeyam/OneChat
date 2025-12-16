<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request): RedirectResponse|Response
    {
        $user = $request->user();
        
        if ($user->hasVerifiedEmail()) {
            $redirectRoute = $user->role === 'admin' 
                ? route('dashboard', absolute: false)
                : route('chat.index', absolute: false);
            return redirect()->intended($redirectRoute);
        }

        return Inertia::render('Auth/VerifyEmail', ['status' => session('status')]);
    }
}
