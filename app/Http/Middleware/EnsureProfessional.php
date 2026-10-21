<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfessional
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->workspaceMember()->exists()) {
            abort(403, 'This area is for workspace professionals.');
        }

        return $next($request);
    }
}
