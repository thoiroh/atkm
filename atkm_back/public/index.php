<?php

/**
 * ATK Backend API Entry Point
 * Main entry point for all API requests
 */

// Enable CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Set content type to JSON
header('Content-Type: application/json; charset=UTF-8');

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && substr($line, 0, 1) !== '#') {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

try {
    // Initialize router
    $router = new \Atkb\Core\Router();
    
    // Initialize request
    $request = new \Atkb\Core\Request();
    
    // Add CORS middleware
    $router->addMiddleware(new \Atkb\Api\Middleware\CorsMiddleware());
    
    // Define routes
    $router->get('/health', [\Atkb\Api\Controllers\HealthController::class, 'check']);
    $router->get('/api/v3/ticker/price', [\Atkb\Api\Controllers\BinanceController::class, 'getTickerPrice']);
    $router->get('/api/v3/account', [\Atkb\Api\Controllers\BinanceController::class, 'getAccount']);
    
    // Handle request
    $response = $router->handle($request);
    $response->send();
    
} catch (Exception $e) {
    // Global error handler
    $errorResponse = new \Atkb\Core\Response([
        'success' => false,
        'error' => [
            'code' => $e->getCode() ?: 500,
            'message' => $e->getMessage(),
            'timestamp' => date('c')
        ]
    ], $e->getCode() ?: 500);
    
    $errorResponse->send();
}