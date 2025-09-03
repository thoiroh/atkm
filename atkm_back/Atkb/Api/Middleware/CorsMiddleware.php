<?php

namespace Atkb\Api\Middleware;

use Atkb\Core\Request;
use Atkb\Core\Response;

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing for Angular frontend
 */
class CorsMiddleware
{
    /**
     * Handle CORS for incoming request
     */
    public function handle(Request $request): ?Response
    {
        // Get allowed origins from environment
        $allowedOrigins = explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:4200');
        $allowedMethods = $_ENV['CORS_ALLOWED_METHODS'] ?? 'GET,POST,PUT,DELETE,OPTIONS';
        $allowedHeaders = $_ENV['CORS_ALLOWED_HEADERS'] ?? 'Content-Type,Authorization,X-Requested-With';

        // Get the origin from request
        $origin = $request->getHeader('Origin');

        // Set CORS headers
        if ($origin && in_array($origin, $allowedOrigins)) {
            header("Access-Control-Allow-Origin: {$origin}");
        } else {
            // For development, allow all origins
            if (($_ENV['APP_ENV'] ?? 'production') === 'development') {
                header('Access-Control-Allow-Origin: *');
            }
        }

        header("Access-Control-Allow-Methods: {$allowedMethods}");
        header("Access-Control-Allow-Headers: {$allowedHeaders}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400'); // 24 hours

        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            return new Response(['message' => 'CORS preflight handled'], 200);
        }

        // Continue to next middleware/handler
        return null;
    }
}