<?php

namespace App\Http\Controllers;

use App\Models\Traffic;
use Illuminate\Http\Request;

class TrafficController extends Controller
{
    // 📡 READ
    public function index()
    {
        return Traffic::all();
    }

    // ➕ CREATE
    public function store(Request $request)
    {
        return Traffic::create($request->all());
    }

    // ✏️ UPDATE
    public function update(Request $request, $id)
    {
        $traffic = Traffic::findOrFail($id);
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