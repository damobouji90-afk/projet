<?php

namespace App\Http\Controllers;

use App\Models\Sensor;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    public function index()
    {
        return Sensor::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:trafic,parking,pollution',
            'location' => 'required|string|max:255',
            'status' => 'boolean',
        ]);

        return Sensor::create($request->all());
    }

    public function update(Request $request, $id)
    {
        $sensor = Sensor::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:trafic,parking,pollution',
            'location' => 'required|string|max:255',
            'status' => 'boolean',
        ]);

        $sensor->update($request->all());

        return $sensor;
    }

    public function destroy($id)
    {
        $sensor = Sensor::findOrFail($id);
        $sensor->delete();

        return response()->json(['message' => 'Sensor deleted successfully']);
    }
}