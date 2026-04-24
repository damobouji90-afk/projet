<?php

namespace App\Http\Controllers;

use App\Models\Parking;
use Illuminate\Http\Request;

class ParkingController extends Controller
{
    public function index(Request $request)
    {
        $query = Parking::query();

        if ($request->has('date')) {
            $query->whereDate('date', $request->query('date'));
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'capacity' => 'required|integer|min:1',
            'available_places' => 'required|integer|min:0|lte:capacity',
            'date' => 'required|date',
        ]);

        return Parking::create($validated);
    }

    public function update(Request $request, $id)
    {
        $parking = Parking::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'location' => 'sometimes|required|string|max:255',
            'capacity' => 'sometimes|required|integer|min:1',
            'available_places' => 'sometimes|required|integer|min:0|lte:capacity',
            'date' => 'sometimes|required|date',
        ]);

        $parking->update($validated);

        return $parking;
    }

    public function destroy($id)
    {
        $parking = Parking::findOrFail($id);
        $parking->delete();

        return response()->json(['message' => 'Parking deleted successfully']);
    }
}