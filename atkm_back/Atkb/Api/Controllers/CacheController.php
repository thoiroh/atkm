<?php

namespace Atkb\Api\Controllers;

use Atkb\Core\Request;
use Atkb\Core\Response;
use Atkb\Services\BinanceService;

/**
 * Cache Management Controller
 * Handles cache operations for development and monitoring
 */
class CacheController
{
  private BinanceService $binanceService;
  private string $cacheDir;

  public function __construct()
  {
    $this->binanceService = new BinanceService();
    $this->cacheDir = $_ENV['CACHE_DIR'] ?? __DIR__ . '/../../cache/binance';
  }

  /**
   * Get cache statistics
   * GET /api/v1/cache/stats
   */
  public function getStats(Request $request): Response
  {
    try {
      // Get cache stats from BinanceService
      $cacheStats = $this->binanceService->getCacheStats();

      // Add additional filesystem information
      $additionalStats = [
        'cacheEnabled' => true,
        'cacheDirectory' => $this->cacheDir,
        'diskSpaceAvailable' => $this->formatBytes(disk_free_space($this->cacheDir)),
        'cacheExpiryDefault' => $_ENV['CACHE_EXPIRY'] ?? 300,
        'lastCleared' => $this->getLastClearTime(),
        'uptime' => $this->getUptimeInfo()
      ];

      $responseData = array_merge($cacheStats, $additionalStats);

      return Response::success($responseData, 'Cache statistics retrieved successfully');
    } catch (\Exception $e) {
      return Response::error(
        'Failed to get cache statistics: ' . $e->getMessage(),
        500
      );
    }
  }

  /**
   * Clear cache
   * DELETE /api/v1/cache/clear?endpoint=optional
   */
  public function clearCache(Request $request): Response
  {
    try {
      $endpoint = $request->getQueryParam('endpoint');
      $force = $request->getQueryParam('force', false);

      // Safety check for production
      if (($_ENV['APP_ENV'] ?? 'production') === 'production' && !$force) {
        return Response::error(
          'Cache clearing is disabled in production. Use force=true parameter if needed.',
          403
        );
      }

      $result = $this->binanceService->clearCache($endpoint);

      if ($result) {
        $this->recordClearTime();

        $message = $endpoint
          ? "Cache cleared for endpoint: {$endpoint}"
          : "All cache cleared successfully";

        return Response::success([
          'cleared' => true,
          'endpoint' => $endpoint ?: 'all',
          'timestamp' => date('c')
        ], $message);
      } else {
        return Response::error('Failed to clear cache', 500);
      }
    } catch (\Exception $e) {
      return Response::error(
        'Failed to clear cache: ' . $e->getMessage(),
        500
      );
    }
  }

  /**
   * Get cache health status
   * GET /api/v1/cache/health
   */
  public function getHealth(Request $request): Response
  {
    try {
      $health = [
        'status' => 'healthy',
        'checks' => []
      ];

      // Check if cache directory exists and is writable
      if (!file_exists($this->cacheDir)) {
        $health['checks']['directory_exists'] = false;
        $health['status'] = 'unhealthy';
      } else {
        $health['checks']['directory_exists'] = true;
      }

      if (!is_writable($this->cacheDir)) {
        $health['checks']['directory_writable'] = false;
        $health['status'] = 'unhealthy';
      } else {
        $health['checks']['directory_writable'] = true;
      }

      // Check disk space
      $freeSpace = disk_free_space($this->cacheDir);
      $health['checks']['disk_space_available'] = $freeSpace > (100 * 1024 * 1024); // 100MB minimum

      if (!$health['checks']['disk_space_available']) {
        $health['status'] = 'warning';
      }

      // Check cache file count
      $cacheFiles = glob($this->cacheDir . '/*.json');
      $fileCount = count($cacheFiles);
      $health['checks']['cache_files_count'] = $fileCount;
      $health['checks']['cache_files_reasonable'] = $fileCount < 1000; // Warning if too many files

      if (!$health['checks']['cache_files_reasonable']) {
        $health['status'] = 'warning';
      }

      $statusCode = $health['status'] === 'healthy' ? 200 : ($health['status'] === 'warning' ? 200 : 503);

      return new Response([
        'success' => true,
        'data' => $health,
        'timestamp' => date('c')
      ], $statusCode);
    } catch (\Exception $e) {
      return Response::error(
        'Failed to check cache health: ' . $e->getMessage(),
        500
      );
    }
  }

  /**
   * Warm up cache with common requests
   * POST /api/v1/cache/warmup
   */
  public function warmupCache(Request $request): Response
  {
    try {
      $symbols = $request->getBodyParam('symbols', ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']);
      $warmupResults = [];

      foreach ($symbols as $symbol) {
        try {
          // Warm up ticker price
          $this->binanceService->getTickerPrice($symbol);
          $warmupResults[$symbol]['ticker'] = 'success';

          // Warm up account info (once)
          if ($symbol === $symbols[0]) {
            $this->binanceService->getAccount();
            $warmupResults['account'] = 'success';
          }
        } catch (\Exception $e) {
          $warmupResults[$symbol]['error'] = $e->getMessage();
        }
      }

      return Response::success([
        'warmedUp' => true,
        'symbols' => $symbols,
        'results' => $warmupResults,
        'timestamp' => date('c')
      ], 'Cache warmed up successfully');
    } catch (\Exception $e) {
      return Response::error(
        'Failed to warm up cache: ' . $e->getMessage(),
        500
      );
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

  /**
   * Record cache clear time
   */
  private function recordClearTime(): void
  {
    try {
      $clearFile = $this->cacheDir . '/.last_clear';
      file_put_contents($clearFile, time());
    } catch (\Exception $e) {
      // Silently fail if we can't record clear time
    }
  }

  /**
   * Get last cache clear time
   */
  private function getLastClearTime(): ?string
  {
    try {
      $clearFile = $this->cacheDir . '/.last_clear';
      if (file_exists($clearFile)) {
        $timestamp = (int) file_get_contents($clearFile);
        return date('c', $timestamp);
      }
    } catch (\Exception $e) {
      // Silently fail
    }

    return null;
  }

  /**
   * Get uptime information
   */
  private function getUptimeInfo(): array
  {
    return [
      'serverUptime' => $this->getServerUptime(),
      'phpUptime' => $this->getPhpUptime(),
      'cacheUptime' => $this->getCacheUptime()
    ];
  }

  /**
   * Get server uptime
   */
  private function getServerUptime(): ?string
  {
    try {
      if (function_exists('shell_exec') && PHP_OS_FAMILY !== 'Windows') {
        $uptime = shell_exec('uptime');
        return trim($uptime ?: 'Unknown');
      }
    } catch (\Exception $e) {
      // Silently fail
    }

    return 'Not available';
  }

  /**
   * Get PHP process uptime
   */
  private function getPhpUptime(): string
  {
    return date('c', $_SERVER['REQUEST_TIME'] ?? time());
  }

  /**
   * Get cache uptime (when cache directory was created)
   */
  private function getCacheUptime(): ?string
  {
    try {
      if (file_exists($this->cacheDir)) {
        return date('c', filectime($this->cacheDir));
      }
    } catch (\Exception $e) {
      // Silently fail
    }

    return null;
  }
}
