<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ApiController extends Controller
{
    public function index()
    {
        return response()->json([
            'message' => 'Welcome to One Chat API',
            'version' => '1.0.0'
        ]);
    }
}

