<?php

namespace App\Http\Responses;

use App\Concerns\ResolvesHomeRoute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    use ResolvesHomeRoute;

    public function toResponse($request)
    {
        /** @var Request $request */
        return $request->wantsJson()
            ? new JsonResponse('', 204)
            : redirect()->intended($this->homeRoute($request->user()));
    }
}
