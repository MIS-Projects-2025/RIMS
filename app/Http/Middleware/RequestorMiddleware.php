<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequestorMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $empData = session('emp_data');

        // Check if user is logged in
        if (!$empData) {
            abort(403, 'Unauthorized: Please log in to access this page.');
        }

        // Check if user has permission to request
        $canRequest = $empData['can_request'] ?? false; // can be boolean or array depending on your setup

        if (!$canRequest) {
            abort(403, 'Unauthorized: You do not have permission to perform this action.');
        }

        return $next($request);
    }
}