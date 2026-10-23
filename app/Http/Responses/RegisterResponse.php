<?php

namespace App\Http\Responses;

use App\Concerns\ResolvesHomeRoute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    use ResolvesHomeRoute;

    public function toResponse($request)
    {
        /** @var Request $request */
        return $request->wantsJson()
            ? new JsonResponse('', 201)
            : redirect()->to($this->homeRoute($request->user()));
    }
}
