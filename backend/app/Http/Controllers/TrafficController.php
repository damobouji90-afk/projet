<?php

namespace App\Http\Controllers;

use App\Models\Traffic;
use Illuminate\Http\Request;

class TrafficController extends Controller
{
    // 📡 READ
    public function index(Request $request)
    {
        $query = Traffic::query();

        if ($request->has('date')) {
            $query->whereDate('date', $request->query('date'));
        }

        return $query->get();
    }

    // ➕ CREATE
    public function store(Request $request)
    {
        $request->validate([
            'location' => 'required|string|max:255',
            'level' => 'required|integer|min:1|max:10',
            'date' => 'required|date',
        ]);

        return Traffic::create($request->all());
    }

    // ✏️ UPDATE
    public function update(Request $request, $id)
    {
        $traffic = Traffic::findOrFail($id);

        $request->validate([
            'location' => 'required|string|max:255',
            'level' => 'required|integer|min:1|max:10',
            'date' => 'sometimes|required|date',
        ]);

        $traffic->update($request->all());

        return $traffic;
    }

    // 🗑️ DELETE
    public function destroy($id)
    {
        $traffic = Traffic::findOrFail($id);
        $traffic->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}