<?php

use App\Http\Controllers\RequestController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\RequestorMiddleware;

$app_name = $app_name ?? config('app.name');

Route::prefix($app_name)
    ->group(function () {

        // Only users who can request can access form & store
        Route::middleware([RequestorMiddleware::class])->group(function () {
            Route::get('/request', [RequestController::class, 'index'])->name('request.form');
            Route::post('/store', [RequestController::class, 'store'])->name('request.store');
        });

        // Other routes accessible without request permission
        Route::get('/requestTypes', [RequestController::class, 'getRequestTypes'])->name('request-types.list');
        Route::get('/staff/{empId}', [RequestController::class, 'getStaffList'])->name('staff.list');
        Route::get('/locations', [RequestController::class, 'getLocations'])->name('locations.list');
        Route::get('/request/table', [RequestController::class, 'getRequestsTable'])->name('request.table');
        Route::get('/requests/show/{id}', [RequestController::class, 'show'])->name('request.show');
        Route::post('/request/action', [RequestController::class, 'RequestAction'])->name('request.action');
        Route::post('/request/update-status', [RequestController::class, 'updateItemStatus'])
            ->name('request.update-status');
    });