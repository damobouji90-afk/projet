<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\TrafficController;
use App\Http\Controllers\ParkingController;

// 🔹 AUTH
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// 🔒 PROTECTED ROUTES (Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // 👤 USER INFO
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // 📡 SENSORS
    Route::get('/sensors', [SensorController::class, 'index']);
    Route::post('/sensors', [SensorController::class, 'store']);

    // 🚦 TRAFFIC
    Route::get('/traffic', [TrafficController::class, 'index']);
    Route::post('/traffic', [TrafficController::class, 'store']);

    // 🚗 PARKING (CRUD complet)
    Route::get('/parkings', [ParkingController::class, 'index']);
    Route::post('/parkings', [ParkingController::class, 'store']);
    Route::put('/parkings/{id}', [ParkingController::class, 'update']);
    Route::delete('/parkings/{id}', [ParkingController::class, 'destroy']);

});