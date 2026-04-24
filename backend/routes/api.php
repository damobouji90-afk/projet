<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\TrafficController;
use App\Http\Controllers\ParkingController;
use App\Http\Controllers\ComplaintController;

// ?? AUTH
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// ? SENSORS - PUBLIC (Accessible sans authentification)
Route::get('/sensors', [SensorController::class, 'index']);
Route::post('/sensors', [SensorController::class, 'store']);
Route::put('/sensors/{id}', [SensorController::class, 'update']);
Route::delete('/sensors/{id}', [SensorController::class, 'destroy']);
// ?? COMPLAINTS - PUBLIC SUBMISSION (Citoyens peuvent soumettre)
Route::middleware('auth:sanctum')->post('/complaints', [ComplaintController::class, 'store']);

// ?? COMPLAINTS - PUBLIC LISTING (Tout le monde peut consulter les signalements)
Route::get('/complaints', [ComplaintController::class, 'index']);

// ?? PROTECTED ROUTES (Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // ?? USER INFO (Accessible to all authenticated users)
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user', [AuthController::class, 'update']);

    // ?? COMPLAINTS (Store for citoyens, full CRUD for admin)
    Route::post('/complaints', [ComplaintController::class, 'store']);

    // ?? ADMIN ONLY ROUTES
    Route::middleware('role:admin')->group(function () {
        // ?? TRAFFIC
        Route::get('/traffic', [TrafficController::class, 'index']);
        Route::post('/traffic', [TrafficController::class, 'store']);
        Route::put('/traffic/{id}', [TrafficController::class, 'update']);
        Route::delete('/traffic/{id}', [TrafficController::class, 'destroy']);

        // ?? PARKING (CRUD complet)
        Route::get('/parkings', [ParkingController::class, 'index']);
        Route::post('/parkings', [ParkingController::class, 'store']);
        Route::put('/parkings/{id}', [ParkingController::class, 'update']);
        Route::delete('/parkings/{id}', [ParkingController::class, 'destroy']);

        // ?? COMPLAINTS (Update/Delete)
        Route::put('/complaints/{id}', [ComplaintController::class, 'update']);
        Route::delete('/complaints/{id}', [ComplaintController::class, 'destroy']);
    });
});
