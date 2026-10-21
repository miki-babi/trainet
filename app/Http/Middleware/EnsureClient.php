<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureClient
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->clientProfile()->exists()) {
            abort(403, 'This area is for client accounts.');
        }

        return $next($request);
    }
}
