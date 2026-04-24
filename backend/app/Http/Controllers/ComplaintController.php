<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use Illuminate\Http\Request;

class ComplaintController extends Controller
{
    public function index()
    {
        return Complaint::with('user')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'description' => 'nullable|string',
            'location' => 'required|string',
            'type_probleme' => 'required|string',
            'category' => 'required|in:éclairage,infrastructure,trafic,parking,sensors,déchets',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'citizen_first_name' => 'nullable|string',
            'citizen_photo' => 'nullable|string',
        ]);

        if (empty($validated['description'])) {
            $validated['description'] = $validated['type_probleme'] ?? $validated['problem_type'] ?? 'Signalement sans description';
        }

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $name = time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads'), $name);
            $validated['image'] = $name;
        }

        $user = auth()->user();
        if ($request->filled('citizen_first_name')) {
            $user->first_name = $request->input('citizen_first_name');
        }
        if ($request->filled('citizen_photo')) {
            $user->photo = $request->input('citizen_photo');
        }
        $user->save();

        $validated['user_id'] = $user->id;
        $validated['date'] = now()->toDateString();
        $validated['status'] = 'pending';
        $validated['priority'] = 'medium';
        $validated['problem_type'] = $validated['type_probleme'];

        return Complaint::create($validated);
    }

    public function update(Request $request, $id)
    {
        $complaint = Complaint::findOrFail($id);

        if ($request->isJson()) {
            $request->merge($request->json()->all());
        } else {
            $raw = $request->getContent();
            if (!empty($raw)) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $request->merge($decoded);
                }
            }
        }

        $validated = $request->validate([
            'image' => 'sometimes|required|string',
            'description' => 'sometimes|required|string',
            'location' => 'sometimes|required|string',
            'category' => 'sometimes|required|in:éclairage,infrastructure,trafic,parking,sensors,déchets',
            'problem_type' => 'sometimes|string',
            'priority' => 'sometimes|required|in:low,medium,high',
            'status' => 'sometimes|required|in:pending,in_progress,resolved',
            'resolution' => 'nullable|string',
        ]);

        $complaint->update($validated);

        return $complaint;
    }

    public function destroy($id)
    {
        $complaint = Complaint::findOrFail($id);
        $complaint->delete();

        return response()->json(['message' => 'Complaint deleted successfully']);
    }
}