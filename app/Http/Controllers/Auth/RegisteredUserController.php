<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\BloodDonor;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone' => 'required|string|max:20',
            'city' => 'required|string|max:100',
            'birth_date' => 'required|date',
            'gender' => 'required|string|in:male,female,other',
            'blood_group' => 'required|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'donor' => 'required|string|in:yes,no',
        ]);

        // Age verification for donors
        if ($validated['donor'] === 'yes') {
            if (empty($validated['birth_date'])) {
                return redirect()->back()->withErrors([
                    'birth_date' => 'Date of birth is required to verify donor eligibility.',
                ])->withInput();
            }
            
            $birthDate = \Carbon\Carbon::parse($validated['birth_date']);
            $age = $birthDate->age;
            
            if ($age < 18) {
                return redirect()->back()->withErrors([
                    'donor' => 'You must be at least 18 years old to be a donor.',
                ])->withInput();
            }
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'],
            'city' => $validated['city'],
            'birth_date' => $validated['birth_date'],
            'gender' => $validated['gender'],
            'blood_group' => $validated['blood_group'],
            'donor' => $validated['donor'],
        ]);

        // If user is a donor, automatically create a BloodDonor record
        if ($validated['donor'] === 'yes') {
            BloodDonor::create([
                'user_id' => $user->id,
                'blood_group' => $validated['blood_group'],
                'city' => $validated['city'],
                'contact_phone' => $validated['phone'],
                'is_available' => true,
            ]);
        }

        event(new Registered($user));

        Auth::login($user);

        // Redirect based on user role
        $redirectRoute = $user->role === 'admin' 
            ? route('dashboard', absolute: false)
            : route('chat.index', absolute: false);

        return redirect($redirectRoute);
    }
}
