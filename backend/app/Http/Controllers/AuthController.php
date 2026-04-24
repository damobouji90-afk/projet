<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // 🔹 REGISTER (Disabled - Only adem@gmail.com and yassmine@gmail.com allowed)
    public function register(Request $request)
    {
        return response()->json(['message' => 'Registration is disabled'], 403);
    }

    // 🔹 LOGIN
    public function login(Request $request)
    {
        $allowedEmails = ['adem@gmail.com', 'yassmine@gmail.com', 'citoyen@gmail.com'];
        
        if (!in_array($request->email, $allowedEmails)) {
            return response()->json(['message' => 'Email not authorized'], 401);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid login'], 401);
        }

        $user = Auth::user();
        $role = in_array($user->email, ['adem@gmail.com', 'yassmine@gmail.com']) ? 'admin' : 'citoyen';
        $user->role = $role;
        $user->save();
        $token = $user->createToken('token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'role' => $role
        ]);
    }

    // 🔹 UPDATE PROFILE
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|min:6',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json($user);
    }
}