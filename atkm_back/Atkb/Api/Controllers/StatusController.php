<?php

namespace Atkb\Api\Controllers;

use Atkb\Core\Request;
use Atkb\Core\Response;
use Atkb\Services\BinanceService;

/**
 * Status Controller
 * Provides API status and configuration information
 */
class StatusController
{
  private BinanceService $binanceService;

  public function __construct()
  {
    $this->binanceService = new BinanceService();
  }

  /**
   * Get comprehensive API status
   * GET /api/v1/status
   */
  public function getStatus(Request $request): Response
  {
    try {
      $status = [
        'api' => [
          'name' => 'ATK Backend API',
          'version' => '1.0.0-beta',
          'environment' => $_ENV['APP_ENV'] ?? 'production',
          'debug' => ($_ENV['APP_DEBUG'] ?? 'false') === 'true',
          'timezone' => $_ENV['APP_TIMEZONE'] ?? 'UTC',
          'timestamp' => date('c'),
          'uptime' => $this->getUptime()
        ],
        'binance' => $this->getBinanceStatus(),
        'system' => $this->getSystemInfo(),
        'features' => $this->getEnabledFeatures(),
        'health' => 'healthy'
      ];

      // Determine overall health
      if (!$status['binance']['connectivity']) {
        $status['health'] = 'degraded';
      }

      return Response::success($status, 'API status retrieved successfully');
    } catch (\Exception $e) {
      return Response::error(
        'Failed to get API status: ' . $e->getMessage(),
        500
      );
    }
  }

  /**
   * Get Binance API connectivity status
   */
  private function getBinanceStatus(): array
  {
    $status = [
      'connectivity' => false,
      'server_time_diff' => null,
      'api_key_configured' => !empty($_ENV['BINANCE_API_KEY']),
      'secret_key_configured' => !empty($_ENV['BINANCE_SECRET_KEY']),
      'base_url' => $_ENV['BINANCE_BASE_URL'] ?? 'https://api.binance.com',
      'sapi_url' => $_ENV['BINANCE_SAPI_URL'] ?? 'https://api.binance.com',
      'endpoints' => [
        'public' => false,
        'private' => false,
        'sapi' => false
      ]
    ];

    try {
      // Test public endpoint
      $ping = $this->binanceService->ping();
      $status['endpoints']['public'] = true;
      $status['connectivity'] = true;

      // Test server time
      $serverTime = $this->binanceService->getServerTime();
      if (isset($serverTime['serverTime'])) {
        $serverTimestamp = $serverTime['serverTime'];
        $localTimestamp = time() * 1000;
        $status['server_time_diff'] = abs($serverTimestamp - $localTimestamp);
      }
    } catch (\Exception $e) {
      $status['public_error'] = $e->getMessage();
    }

    // Test private endpoint if keys are configured
    if ($status['api_key_configured'] && $status['secret_key_configured']) {
      try {
        $account = $this->binanceService->getAccount();
        $status['endpoints']['private'] = true;
        $status['account_type'] = $account['accountType'] ?? 'unknown';
        $status['permissions'] = $account['permissions'] ?? [];
      } catch (\Exception $e) {
        $status['private_error'] = $e->getMessage();
      }

      // Test SAPI endpoint
      try {
        $userAssets = $this->binanceService->getUserAssets();
        $status['endpoints']['sapi'] = !empty($userAssets);
      } catch (\Exception $e) {
        $status['sapi_error'] = $e->getMessage();
      }
    }

    return $status;
  }

  /**
   * Get system information
   */
  private function getSystemInfo(): array
  {
    return [
      'php_version' => PHP_VERSION,
      'php_sapi' => PHP_SAPI,
      'os' => PHP_OS_FAMILY,
      'memory_limit' => ini_get('memory_limit'),
      'memory_usage' => $this->formatBytes(memory_get_usage(true)),
      'peak_memory' => $this->formatBytes(memory_get_peak_usage(true)),
      'cache_enabled' => $this->isCacheEnabled(),
      'cache_directory' => $_ENV['CACHE_DIR'] ?? __DIR__ . '/../../cache/binance',
      'extensions' => [
        'curl' => extension_loaded('curl'),
        'json' => extension_loaded('json'),
        'openssl' => extension_loaded('openssl'),
        'hash' => extension_loaded('hash')
      ]
    ];
  }

  /**
   * Get enabled features
   */
  private function getEnabledFeatures(): array
  {
    return [
      'transaction_history' => true,
      'account_info' => true,
      'ticker_prices' => true,
      'deposit_history' => $this->isFeatureEnabled('deposit_history'),
      'withdrawal_history' => $this->isFeatureEnabled('withdrawal_history'),
      'user_assets' => $this->isFeatureEnabled('user_assets'),
      'cache_management' => true,
      'file_cache' => $this->isCacheEnabled(),
      'cors_enabled' => $this->isCorsEnabled()
    ];
  }

  /**
   * Check if a feature is enabled
   */
  private function isFeatureEnabled(string $feature): bool
  {
    switch ($feature) {
      case 'deposit_history':
      case 'withdrawal_history':
      case 'user_assets':
        // These require SAPI access
        return !empty($_ENV['BINANCE_API_KEY']) && !empty($_ENV['BINANCE_SECRET_KEY']);
      default:
        return true;
    }
  }

  /**
   * Check if cache is enabled
   */
  private function isCacheEnabled(): bool
  {
    $cacheDir = $_ENV['CACHE_DIR'] ?? __DIR__ . '/../../cache/binance';
    return file_exists($cacheDir) && is_writable($cacheDir);
  }

  /**
   * Check if CORS is enabled
   */
  private function isCorsEnabled(): bool
  {
    return !empty($_ENV['CORS_ALLOWED_ORIGINS']);
  }

  /**
   * Get API uptime
   */
  private function getUptime(): string
  {
    // Simple uptime based on when the process started
    $startTime = $_SERVER['REQUEST_TIME'] ?? time();
    $uptime = time() - $startTime;

    if ($uptime < 60) {
      return "{$uptime} seconds";
    } elseif ($uptime < 3600) {
      return floor($uptime / 60) . " minutes";
    } else {
      return floor($uptime / 3600) . " hours";
    }
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
}
