<?php

namespace App\Http\Controllers\Pro;

use App\Http\Controllers\Controller;
use App\Models\AvailabilityRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AvailabilityController extends Controller
{
    public function edit(Request $request): Response
    {
        $rules = AvailabilityRule::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('weekday')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('pro/scheduling/availability', [
            'rules' => $rules,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'rules' => ['array'],
            'rules.*.weekday' => ['required', 'integer', 'min:1', 'max:7'],
            'rules.*.start_time' => ['required', 'date_format:H:i'],
            'rules.*.end_time' => ['required', 'date_format:H:i', 'after:rules.*.start_time'],
        ]);

        DB::transaction(function () use ($request, $validated) {
            AvailabilityRule::where('user_id', $request->user()->id)->delete();
            foreach ($validated['rules'] ?? [] as $rule) {
                AvailabilityRule::create([
                    'workspace_id' => $request->user()->workspaceMember->workspace_id,
                    'user_id' => $request->user()->id,
                    'weekday' => $rule['weekday'],
                    'start_time' => $rule['start_time'],
                    'end_time' => $rule['end_time'],
                ]);
            }
        });

        return back();
    }
}
