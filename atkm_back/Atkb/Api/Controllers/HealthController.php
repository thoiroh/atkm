<?php

namespace Atkb\Api\Controllers;

use Atkb\Core\Request;
use Atkb\Core\Response;
use Atkb\Services\BinanceService;
use Exception;

/**
 * Health Check Controller
 * Provides health status and connectivity checks
 */
class HealthController
{
  /**
   * Basic health check
   * GET /health
   */
  public function check(Request $request): Response
  {
    try {
      // Check if environment variables are loaded
      $envCheck = [
        'binance_api_key' => !empty($_ENV['BINANCE_API_KEY']),
        'binance_secret_key' => !empty($_ENV['BINANCE_SECRET_KEY']),
        'binance_base_url' => !empty($_ENV['BINANCE_BASE_URL'])
      ];

      // Test Binance connectivity (public endpoint)
      $binanceStatus = 'unknown';
      $binanceLatency = 0;

      try {
        $startTime = microtime(true);
        $binanceService = new BinanceService();
        $binanceService->ping();
        $endTime = microtime(true);

        $binanceStatus = 'connected';
        $binanceLatency = round(($endTime - $startTime) * 1000, 2); // ms
      } catch (Exception $e) {
        $binanceStatus = 'error: ' . $e->getMessage();
      }

      $healthData = [
        'status' => 'healthy',
        'version' => '1.0.0',
        'environment' => $_ENV['APP_ENV'] ?? 'unknown',
        'php_version' => phpversion(),
        'memory_usage' => $this->formatBytes(memory_get_usage(true)),
        'uptime' => $this->getUptime(),
        'checks' => [
          'environment' => $envCheck,
          'binance' => [
            'status' => $binanceStatus,
            'latency_ms' => $binanceLatency,
            'base_url' => $_ENV['BINANCE_BASE_URL'] ?? 'not set'
          ]
        ]
      ];

      return Response::success($healthData, 'Health check completed');
    } catch (Exception $e) {
      return Response::error(
        'Health check failed: ' . $e->getMessage(),
        500
      );
    }
  }

  /**
   * Extended Binance connection test
   * GET /health/binance
   */
  public function testBinanceConnection(Request $request): Response
  {
    try {
      $binanceService = new BinanceService();
      $results = $binanceService->testConnection();

      // Add additional debug information
      $results['debug_info'] = [
        'api_key_length' => strlen($_ENV['BINANCE_API_KEY'] ?? ''),
        'secret_key_length' => strlen($_ENV['BINANCE_SECRET_KEY'] ?? ''),
        'base_url' => $_ENV['BINANCE_BASE_URL'] ?? 'not set',
        'timestamp' => date('Y-m-d H:i:s'),
        'binance_timestamp' => time() * 1000 // Generate timestamp directly instead
      ];

      return Response::success($results, 'Binance connection test completed');
    } catch (Exception $e) {
      // Create a simple error message instead of array
      $errorMessage = 'Binance connection test failed: ' . $e->getMessage();

      return Response::error($errorMessage, 500);
    }
  }

  /**
   * Test specific symbol trades
   * GET /health/binance/trades/{symbol}
   */
  public function testTrades(Request $request): Response
  {
    $symbol = $this->getRequestParam($request, 'symbol') ?? 'BTCUSDT';

    try {
      $binanceService = new BinanceService();

      // Test with minimal limit to avoid heavy data
      $trades = $binanceService->getMyTrades($symbol, null, null, 1);

      $responseData = [
        'symbol' => $symbol,
        'trades_count' => count($trades),
        'test_successful' => true,
        'sample_trade' => count($trades) > 0 ? $trades[0] : null
      ];

      return Response::success($responseData, 'Trades test completed');
    } catch (Exception $e) {
      $errorData = [
        'symbol' => $symbol,
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'test_successful' => false
      ];

      return Response::error($e->getMessage(), $e->getCode() ?: 500);
    }
  }

  /**
   * Test account access
   * GET /health/binance/account
   */
  public function testAccount(Request $request): Response
  {
    try {
      $binanceService = new BinanceService();
      $account = $binanceService->getAccount();

      // Don't expose sensitive account data, just confirm access
      $responseData = [
        'account_access' => true,
        'balances_count' => count($account['balances'] ?? []),
        'account_type' => $account['accountType'] ?? 'unknown',
        'can_trade' => $account['canTrade'] ?? false,
        'can_withdraw' => $account['canWithdraw'] ?? false,
        'can_deposit' => $account['canDeposit'] ?? false
      ];

      return Response::success($responseData, 'Account test completed');
    } catch (Exception $e) {
      return Response::error($e->getMessage(), $e->getCode() ?: 500);
    }
  }

  /**
   * Clear Binance cache
   * DELETE /health/binance/cache
   */
  public function clearCache(Request $request): Response
  {
    try {
      $binanceService = new BinanceService();
      $success = $binanceService->clearCache();

      $responseData = [
        'cache_cleared' => $success,
        'timestamp' => date('Y-m-d H:i:s')
      ];

      return Response::success($responseData, 'Cache cleared successfully');
    } catch (Exception $e) {
      return Response::error('Failed to clear cache: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Get cache statistics
   * GET /health/binance/cache/stats
   */
  public function getCacheStats(Request $request): Response
  {
    try {
      $binanceService = new BinanceService();
      $stats = $binanceService->getCacheStats();

      return Response::success($stats, 'Cache statistics retrieved');
    } catch (Exception $e) {
      return Response::error('Failed to get cache stats: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Get request parameter using the actual Request class methods
   */
  private function getRequestParam(Request $request, string $param): ?string
  {
    // First try query parameters (GET)
    $value = $request->getQueryParam($param);

    // If not found, try body parameters (POST)
    if ($value === null) {
      $value = $request->getBodyParam($param);
    }

    return $value;
  }

  /**
   * Format bytes to human readable format
   */
  private function formatBytes(int $bytes, int $precision = 2): string
  {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];

    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
      $bytes /= 1024;
    }

    return round($bytes, $precision) . ' ' . $units[$i];
  }

  /**
   * Get system uptime (simplified for web context)
   */
  private function getUptime(): string
  {
    // For web applications, we'll return the current request time
    // In a real application, you might want to track application start time
    return 'Current request: ' . date('Y-m-d H:i:s');
  }
}
