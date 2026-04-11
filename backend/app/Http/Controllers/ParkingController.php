<?php

namespace App\Http\Controllers;

use App\Models\Parking;
use Illuminate\Http\Request;

class ParkingController extends Controller
{
    
    public function index()
    {
        return Parking::all();
    }

 
    public function store(Request $request)
    {
        return Parking::create($request->all());
    }

   
    public function update(Request $request, $id)
    {
        $parking = Parking::findOrFail($id);
        $parking->update($request->all());

        return $parking;
    }

  
    public function destroy($id)
    {
        $parking = Parking::findOrFail($id);
        $parking->delete();

        return response()->json(['message' => 'Parking deleted successfully']);
    }
}