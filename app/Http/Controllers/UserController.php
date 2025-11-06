<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;

class UserController extends Controller
{
    public function users(){
        $currentUserId = Auth::id();
        
        $users = User::select('id', 'name', 'email', 'created_at')
            ->where('id', '!=', $currentUserId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'joined' => $user->created_at->format('Y-m-d'),
                ];
            });

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }
}
