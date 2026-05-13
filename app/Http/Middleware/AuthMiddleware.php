<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\UserRoleService;

class AuthMiddleware
{
    protected UserRoleService $userRoleService;

    public function __construct(UserRoleService $userRoleService)
    {
        $this->userRoleService = $userRoleService;
    }

    public function handle(Request $request, Closure $next)
    {
      $cookieName = env('SSO_COOKIE_NAME', 'sso_token');

        // 1️⃣ Get token sources (priority: query → cookie → session)
        $tokenFromQuery   = $request->query('key');
        $tokenFromCookie  = $request->cookie($cookieName);
        $tokenFromSession = session('emp_data.token');

        $token = $tokenFromQuery ?? $tokenFromCookie ?? $tokenFromSession;

        Log::info('AuthMiddleware token check', [
            'query'   => $tokenFromQuery,
            'cookie'  => $tokenFromCookie,
            'session' => $tokenFromSession,
            'used'    => $token,
        ]);

        // 🔹 2️⃣ No token → redirect to login
        if (!$token) {
            return $this->redirectToLogin($request);
        }

        // 🔹 3️⃣ Session exists & token matches → continue
        if (session()->has('emp_data') && session('emp_data.token') === $token) {
             $cookie = cookie($cookieName, $token, 60 * 24 * 7);
            // Remove ?key from URL if present (only once)
            if ($tokenFromQuery) {
                $url = $request->url();
                $query = $request->query();
                unset($query['key']);
                if (!empty($query)) {
                    $url .= '?' . http_build_query($query);
                }
                return redirect($url)->withCookie($cookie);
            }

            return $next($request)->withCookie($cookie);
        }

        // 🔹 4️⃣ Fetch user from authify if session missing or token mismatch
        $currentUser = DB::connection('authify')
            ->table('authify_sessions')
            ->where('token', $token)
            ->first();

       if (!$currentUser) {
            session()->forget('emp_data');
            // Clear this system's own cookie only
            $expiredCookie = cookie()->forget($cookieName);
            return $this->redirectToLogin($request)->withCookie($expiredCookie);
        }

        // 🔹 5️⃣ Get user roles via UserRoleService
        $userId      = $currentUser->emp_id;
        $userRoles   = $this->userRoleService->getRole($userId);
        $canRequest  = $this->userRoleService->getCanRequest($userId);

        Log::info('User roles fetched', [
            'emp_id'      => $userId,
            'roles'       => $userRoles,
            'can_request' => $canRequest,
        ]);

        // 🔹 6️⃣ Set session
        session(['emp_data' => [
            'token'          => $currentUser->token,
            'emp_id'         => $currentUser->emp_id,
            'emp_name'       => $currentUser->emp_name,
            'emp_firstname'  => $currentUser->emp_firstname,
            'emp_jobtitle'   => $currentUser->emp_jobtitle,
            'emp_dept'       => $currentUser->emp_dept,
            'emp_prodline'   => $currentUser->emp_prodline,
            'emp_station'    => $currentUser->emp_station,
            'emp_position'   => $currentUser->emp_position,
            'emp_user_roles' => $userRoles,
            'can_request'    => $canRequest,
            'generated_at'   => $currentUser->generated_at,
        ]]);

        session()->save();

        // 🔹 7️⃣ Set user resolver
        $request->setUserResolver(fn() => (object) session('emp_data'));

        $cookie = cookie($cookieName, $currentUser->token, 60 * 24 * 7);

        // 🔹 8️⃣ Redirect once if token came from query
        if ($tokenFromQuery) {
            $url = $request->url();
            $query = $request->query();
            unset($query['key']);
            if (!empty($query)) {
                $url .= '?' . http_build_query($query);
            }
            return redirect($url)->withCookie($cookie);
        }

        // 🔹 9️⃣ Continue request and attach cookie
        return $next($request)->withCookie($cookie);
    }

    private function redirectToLogin(Request $request)
    {
        $redirectUrl = urlencode($request->fullUrl());
        return redirect("http://192.168.2.221:8200/login?redirect={$redirectUrl}");
    }
}
