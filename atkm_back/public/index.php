<?php

/**
 * ATK Backend API Entry Point - Extended for Transaction History
 * Main entry point for all API requests including comprehensive trading history
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

  // ================================================================================================
  // EXISTING ROUTES
  // ================================================================================================

  // Health check
  $router->get('/health', [\Atkb\Api\Controllers\HealthController::class, 'check']);

  // Basic Binance endpoints
  $router->get('/api/v3/ticker/price', [\Atkb\Api\Controllers\BinanceController::class, 'getTickerPrice']);
  $router->get('/api/v3/account', [\Atkb\Api\Controllers\BinanceController::class, 'getAccount']);
// User Assets endpoint (SAPI)
  $router->get('/sapi/v3/asset/getUserAsset', [\Atkb\Api\Controllers\BinanceController::class, 'getUserAssets']);
  // ================================================================================================
  // NEW TRANSACTION HISTORY ROUTES
  // ================================================================================================

  // Trading History Routes
  $router->get('/api/v3/myTrades', [\Atkb\Api\Controllers\BinanceController::class, 'getTradeHistory']);
  $router->get('/api/v3/allOrders', [\Atkb\Api\Controllers\BinanceController::class, 'getOrderHistory']);

  // Transfer History Routes (SAPI endpoints - may require additional permissions)
  $router->get('/api/v1/capital/deposit/history', [\Atkb\Api\Controllers\BinanceController::class, 'getDepositHistory']);
  $router->get('/api/v1/capital/withdraw/history', [\Atkb\Api\Controllers\BinanceController::class, 'getWithdrawHistory']);

  // Comprehensive Summary Route
  $router->get('/api/v1/transaction/summary', [\Atkb\Api\Controllers\BinanceController::class, 'getTransactionSummary']);

  // ================================================================================================
  // UTILITY ROUTES FOR DEVELOPMENT AND DEBUGGING
  // ================================================================================================

  // Cache management routes (for development)
  $router->get('/api/v1/cache/stats', [\Atkb\Api\Controllers\CacheController::class, 'getStats']);
  $router->delete('/api/v1/cache/clear', [\Atkb\Api\Controllers\CacheController::class, 'clearCache']);

  // API status and configuration info
  $router->get('/api/v1/status', [\Atkb\Api\Controllers\StatusController::class, 'getStatus']);

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
      'timestamp' => date('c'),
      'trace' => $_ENV['APP_DEBUG'] === 'true' ? $e->getTraceAsString() : null
    ]
  ], $e->getCode() ?: 500);

  $errorResponse->send();
}

/**
 * Available API Endpoints:
 *
 * BASIC ENDPOINTS:
 * GET  /health                           - Health check
 * GET  /api/v3/ticker/price              - Get ticker price (optional symbol)
 * GET  /api/v3/account                   - Get account information
 *
 * TRANSACTION HISTORY ENDPOINTS:
 * GET  /api/v3/myTrades                  - Get trade history (requires symbol)
 * GET  /api/v3/allOrders                 - Get order history (requires symbol)
 * GET  /api/v1/capital/deposit/history   - Get deposit history (optional coin)
 * GET  /api/v1/capital/withdraw/history  - Get withdrawal history (optional coin)
 * GET  /api/v1/transaction/summary       - Get comprehensive summary (requires symbol)
 *
 * UTILITY ENDPOINTS:
 * GET  /api/v1/cache/stats               - Get cache statistics
 * DEL  /api/v1/cache/clear               - Clear cache
 * GET  /api/v1/status                    - Get API status
 *
 * QUERY PARAMETERS:
 * - symbol: Trading pair (e.g., BTCUSDT) - required for trades/orders
 * - coin: Asset symbol (e.g., BTC) - optional for deposits/withdrawals
 * - startTime: Start timestamp in milliseconds
 * - endTime: End timestamp in milliseconds
 * - limit: Number of records to return (max 1000)
 *
 * EXAMPLES:
 * /api/v3/myTrades?symbol=BTCUSDT&limit=100
 * /api/v3/myTrades?symbol=BTCUSDT&startTime=1609459200000&endTime=1640995199000
 * /api/v1/capital/deposit/history?coin=BTC&limit=50
 * /api/v1/transaction/summary?symbol=BTCUSDT
 */
