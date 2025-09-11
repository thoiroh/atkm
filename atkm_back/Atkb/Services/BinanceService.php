<?php

namespace Atkb\Services;

use Atkb\Tools\Http;

/**
 * Binance API Service - Extended with Transaction History & Caching
 * Handles all Binance API interactions with intelligent file-based caching
 */
class BinanceService
{
  private string $apiKey;
  private string $secretKey;
  private string $baseUrl;
  private string $sapiUrl;
  private Http $httpClient;
  private string $cacheDir;
  private int $cacheExpiry;

  public function __construct()
  {
    $this->apiKey = $_ENV['BINANCE_API_KEY'] ?? '';
    $this->secretKey = $_ENV['BINANCE_SECRET_KEY'] ?? '';
    $this->baseUrl = $_ENV['BINANCE_BASE_URL'] ?? 'https://api.binance.com';
    $this->sapiUrl = $_ENV['BINANCE_SAPI_URL'] ?? 'https://api.binance.com';
    $this->httpClient = new Http();

    // Cache configuration
    $this->cacheDir = $_ENV['CACHE_DIR'] ?? __DIR__ . '/../../cache/binance';
    $this->cacheExpiry = (int) ($_ENV['CACHE_EXPIRY'] ?? 300); // 5 minutes default

    $this->initializeCache();

    if (empty($this->apiKey) || empty($this->secretKey)) {
      throw new \Exception('Binance API credentials not configured');
    }
  }

  /**
   * Validate API credentials
   */
  public function validateCredentials(): bool
  {
    if (empty($this->apiKey) || empty($this->secretKey)) {
      return false;
    }

    try {
      // Test with server time first (public endpoint)
      $this->getServerTime();
      return true;
    } catch (\Exception $e) {
      error_log("Binance credentials validation failed: " . $e->getMessage());
      return false;
    }
  }

  /**
   * Test Binance API connection and permissions
   */
  public function testConnection(): array
  {
    $results = [
      'api_keys_configured' => !empty($this->apiKey) && !empty($this->secretKey),
      'ping_success' => false,
      'server_time_sync' => false,
      'account_access' => false,
      'trades_access' => false,
      'errors' => []
    ];

    try {
      // Test ping
      $this->ping();
      $results['ping_success'] = true;
    } catch (\Exception $e) {
      $results['errors'][] = "Ping failed: " . $e->getMessage();
    }

    try {
      // Test server time
      $serverTime = $this->getServerTime();
      $results['server_time_sync'] = true;
      $results['server_time'] = $serverTime;
    } catch (\Exception $e) {
      $results['errors'][] = "Server time failed: " . $e->getMessage();
    }

    try {
      // Test account access
      $this->getAccount();
      $results['account_access'] = true;
    } catch (\Exception $e) {
      $results['errors'][] = "Account access failed: " . $e->getMessage();
    }

    try {
      // Test trades access with a common symbol
      $this->getMyTrades('BTCUSDT', null, null, 1);
      $results['trades_access'] = true;
    } catch (\Exception $e) {
      $results['errors'][] = "Trades access failed: " . $e->getMessage();
    }

    return $results;
  }

  /**
   * Initialize cache directory
   */
  private function initializeCache(): void
  {
    if (!file_exists($this->cacheDir)) {
      mkdir($this->cacheDir, 0755, true);
    }
  }

  /**
   * Get cache key for request
   */
  private function getCacheKey(string $endpoint, array $params = []): string
  {
    ksort($params);
    return md5($endpoint . '_' . serialize($params));
  }

  /**
   * Get cached data if available and not expired
   */
  private function getCache(string $cacheKey): ?array
  {
    $cacheFile = $this->cacheDir . '/' . $cacheKey . '.json';

    if (!file_exists($cacheFile)) {
      return null;
    }

    $cacheData = json_decode(file_get_contents($cacheFile), true);

    if (!$cacheData || !isset($cacheData['timestamp'], $cacheData['data'])) {
      return null;
    }

    // Check if cache is expired
    if (time() - $cacheData['timestamp'] > $this->cacheExpiry) {
      unlink($cacheFile); // Clean up expired cache
      return null;
    }

    return $cacheData['data'];
  }

  /**
   * Store data in cache
   */
  private function setCache(string $cacheKey, array $data): void
  {
    $cacheFile = $this->cacheDir . '/' . $cacheKey . '.json';
    $cacheData = [
      'timestamp' => time(),
      'data' => $data
    ];

    file_put_contents($cacheFile, json_encode($cacheData, JSON_PRETTY_PRINT));
  }

  /**
   * Get ticker price (public endpoint with caching)
   */
  public function getTickerPrice(?string $symbol = null): array
  {
    $endpoint = '/api/v3/ticker/price';
    $params = [];

    if ($symbol) {
      $params['symbol'] = strtoupper($symbol);
    }

    // Check cache for public data (longer expiry)
    $cacheKey = $this->getCacheKey($endpoint, $params);
    $cachedData = $this->getCache($cacheKey);

    if ($cachedData !== null) {
      return $cachedData;
    }

    $data = $this->makePublicRequest($endpoint, $params);

    // Cache public data for 1 minute
    $this->setCache($cacheKey, $data);

    return $data;
  }

  /**
   * Get account information (private endpoint with short cache)
   */
  public function getAccount(): array
  {
    $endpoint = '/api/v3/account';
    $params = [
      'timestamp' => $this->getTimestamp()
    ];

    // Short cache for account data (30 seconds)
    $cacheKey = $this->getCacheKey($endpoint, ['account']);
    $cachedData = $this->getCache($cacheKey);

    if ($cachedData !== null && (time() - ($cachedData['_cached_at'] ?? 0)) < 30) {
      return $cachedData;
    }

    $data = $this->makePrivateRequest($endpoint, $params);
    $data['_cached_at'] = time();

    $this->setCache($cacheKey, $data);

    return $data;
  }

  /**
   * Get my trades for specific symbol
   * GET /api/v3/myTrades
   */
  public function getMyTrades(string $symbol, ?int $startTime = null, ?int $endTime = null, int $limit = 500): array
  {
    $endpoint = '/api/v3/myTrades';
    $params = [
      'symbol' => strtoupper($symbol),
      'limit' => min($limit, 1000), // Binance max is 1000
      'timestamp' => $this->getTimestamp()
    ];

    if ($startTime) {
      $params['startTime'] = $startTime;
    }

    if ($endTime) {
      $params['endTime'] = $endTime;
    }

    // Cache trades for longer period if they are historical
    $cacheKey = $this->getCacheKey($endpoint, $params);
    $cacheExpiry = $this->getCacheExpiryForHistoricalData($startTime, $endTime);

    $cachedData = $this->getCache($cacheKey);
    if ($cachedData !== null) {
      return $cachedData;
    }

    $data = $this->makePrivateRequest($endpoint, $params);

    // Cache with appropriate expiry
    $this->setCache($cacheKey, $data);

    return $data;
  }

  /**
   * Get all orders for specific symbol
   * GET /api/v3/allOrders
   */
  public function getAllOrders(string $symbol, ?int $startTime = null, ?int $endTime = null, int $limit = 500): array
  {
    $endpoint = '/api/v3/allOrders';
    $params = [
      'symbol' => strtoupper($symbol),
      'limit' => min($limit, 1000),
      'timestamp' => $this->getTimestamp()
    ];

    if ($startTime) {
      $params['startTime'] = $startTime;
    }

    if ($endTime) {
      $params['endTime'] = $endTime;
    }

    $cacheKey = $this->getCacheKey($endpoint, $params);
    $cachedData = $this->getCache($cacheKey);

    if ($cachedData !== null) {
      return $cachedData;
    }

    $data = $this->makePrivateRequest($endpoint, $params);
    $this->setCache($cacheKey, $data);

    return $data;
  }

  /**
   * Get deposit history (SAPI endpoint)
   * GET /sapi/v1/capital/deposit/hisrec
   */
  public function getDepositHistory(?string $coin = null, ?int $startTime = null, ?int $endTime = null, int $limit = 500): array
  {
    $endpoint = '/sapi/v1/capital/deposit/hisrec';
    $params = [
      'limit' => min($limit, 1000),
      'timestamp' => $this->getTimestamp()
    ];

    if ($coin) {
      $params['coin'] = strtoupper($coin);
    }

    if ($startTime) {
      $params['startTime'] = $startTime;
    }

    if ($endTime) {
      $params['endTime'] = $endTime;
    }

    try {
      $cacheKey = $this->getCacheKey($endpoint, $params);
      $cachedData = $this->getCache($cacheKey);

      if ($cachedData !== null) {
        return $cachedData;
      }

      $data = $this->makeSapiRequest($endpoint, $params);
      $this->setCache($cacheKey, $data);

      return $data;
    } catch (\Exception $e) {
      // Return empty array if SAPI access not enabled
      error_log("Deposit history not available: " . $e->getMessage());
      return [];
    }
  }

  /**
   * Get withdrawal history (SAPI endpoint)
   * GET /sapi/v1/capital/withdraw/history
   */
  public function getWithdrawHistory(?string $coin = null, ?int $startTime = null, ?int $endTime = null, int $limit = 500): array
  {
    $endpoint = '/sapi/v1/capital/withdraw/history';
    $params = [
      'limit' => min($limit, 1000),
      'timestamp' => $this->getTimestamp()
    ];

    if ($coin) {
      $params['coin'] = strtoupper($coin);
    }

    if ($startTime) {
      $params['startTime'] = $startTime;
    }

    if ($endTime) {
      $params['endTime'] = $endTime;
    }

    try {
      $cacheKey = $this->getCacheKey($endpoint, $params);
      $cachedData = $this->getCache($cacheKey);

      if ($cachedData !== null) {
        return $cachedData;
      }

      $data = $this->makeSapiRequest($endpoint, $params);
      $this->setCache($cacheKey, $data);

      return $data;
    } catch (\Exception $e) {
      // Return empty array if SAPI access not enabled
      error_log("Withdrawal history not available: " . $e->getMessage());
      return [];
    }
  }

  /**
   * Get all user assets (SAPI endpoint)
   * GET /sapi/v3/asset/getUserAsset
   */
  public function getUserAssets(): array
  {
    $endpoint = '/sapi/v3/asset/getUserAsset';
    $params = [
      'timestamp' => $this->getTimestamp()
    ];

    try {
      $cacheKey = $this->getCacheKey($endpoint, $params);
      $cachedData = $this->getCache($cacheKey);

      if ($cachedData !== null && (time() - ($cachedData['_cached_at'] ?? 0)) < 60) {
        return $cachedData;
      }

      $data = $this->makeSapiRequest($endpoint, $params);
      $data['_cached_at'] = time();

      $this->setCache($cacheKey, $data);

      return $data;
    } catch (\Exception $e) {
      error_log("User assets not available: " . $e->getMessage());
      return [];
    }
  }

  /**
   * Make public API request (no authentication required)
   */
  private function makePublicRequest(string $endpoint, array $params = []): array
  {
    $url = $this->baseUrl . $endpoint;

    if (!empty($params)) {
      $url .= '?' . http_build_query($params);
    }

    $response = $this->httpClient->get($url);

    return $this->handleResponse($response, $endpoint);
  }

  /**
   * Make private API request (requires authentication)
   */
  private function makePrivateRequest(string $endpoint, array $params = []): array
  {
    // Add timestamp if not present
    if (!isset($params['timestamp'])) {
      $params['timestamp'] = $this->getTimestamp();
    }

    // Create query string
    $queryString = http_build_query($params);

    // Create signature
    $signature = $this->createSignature($queryString);
    $params['signature'] = $signature;

    // Build URL
    $url = $this->baseUrl . $endpoint . '?' . http_build_query($params);

    // Set headers
    $headers = [
      'X-MBX-APIKEY: ' . $this->apiKey,
      'Content-Type: application/x-www-form-urlencoded'
    ];

    $response = $this->httpClient->get($url, $headers);

    return $this->handleResponse($response, $endpoint);
  }

  /**
   * Make SAPI request (Spot Account/Margin endpoints)
   */
  private function makeSapiRequest(string $endpoint, array $params = []): array
  {
    // Add timestamp if not present
    if (!isset($params['timestamp'])) {
      $params['timestamp'] = $this->getTimestamp();
    }

    // Create query string
    $queryString = http_build_query($params);

    // Create signature
    $signature = $this->createSignature($queryString);
    $params['signature'] = $signature;

    // Build URL
    $url = $this->sapiUrl . $endpoint . '?' . http_build_query($params);

    // Set headers
    $headers = [
      'X-MBX-APIKEY: ' . $this->apiKey,
      'Content-Type: application/x-www-form-urlencoded'
    ];

    $response = $this->httpClient->get($url, $headers);

    return $this->handleResponse($response, $endpoint);
  }

  /**
   * Create HMAC SHA256 signature
   */
  private function createSignature(string $queryString): string
  {
    return hash_hmac('sha256', $queryString, $this->secretKey);
  }

  /**
   * Get current timestamp in milliseconds
   */
  private function getTimestamp(): int
  {
    return intval(microtime(true) * 1000);
  }

  /**
   * Determine cache expiry based on data age
   */
  private function getCacheExpiryForHistoricalData(?int $startTime, ?int $endTime): int
  {
    $now = time() * 1000;

    // If no end time or end time is recent (last hour), short cache
    if (!$endTime || ($now - $endTime) < 3600000) {
      return 60; // 1 minute
    }

    // If data is from last 24 hours, medium cache
    if (($now - $endTime) < 86400000) {
      return 300; // 5 minutes
    }

    // If data is older than 24 hours, long cache
    return 3600; // 1 hour
  }

  /**
   * Handle API response with better error handling
   */
  private function handleResponse(array $response, string $endpoint): array
  {
    if (!$response['success']) {
      $errorMessage = $response['error'] ?? 'Unknown error';
      $httpCode = $response['httpCode'] ?? 500;

      error_log("Binance API request failed - Endpoint: {$endpoint}, Error: {$errorMessage}, Code: {$httpCode}");

      throw new \Exception(
        'Binance API Error: ' . $errorMessage,
        $httpCode
      );
    }

    $data = $response['data'];

    // Check for Binance API errors in response
    if (isset($data['code']) && isset($data['msg'])) {
      $binanceError = "Code {$data['code']}: {$data['msg']}";
      error_log("Binance API Error Response - Endpoint: {$endpoint}, Error: {$binanceError}");

      throw new \Exception(
        'Binance API Error: ' . $binanceError,
        $data['code']
      );
    }

    return $data;
  }

  /**
   * Get server time from Binance
   */
  public function getServerTime(): array
  {
    return $this->makePublicRequest('/api/v3/time');
  }

  /**
   * Test connectivity to Binance API
   */
  public function ping(): array
  {
    return $this->makePublicRequest('/api/v3/ping');
  }

  /**
   * Clear cache for specific endpoint or all cache
   */
  public function clearCache(?string $endpoint = null): bool
  {
    try {
      if ($endpoint) {
        $pattern = $this->cacheDir . '/' . md5($endpoint . '_*') . '.json';
        $files = glob($pattern);
        foreach ($files as $file) {
          unlink($file);
        }
      } else {
        $files = glob($this->cacheDir . '/*.json');
        foreach ($files as $file) {
          unlink($file);
        }
      }
      return true;
    } catch (\Exception $e) {
      error_log("Cache clear error: " . $e->getMessage());
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public function getCacheStats(): array
  {
    $files = glob($this->cacheDir . '/*.json');
    $totalFiles = count($files);
    $totalSize = 0;
    $oldestFile = null;
    $newestFile = null;

    foreach ($files as $file) {
      $size = filesize($file);
      $mtime = filemtime($file);

      $totalSize += $size;

      if (!$oldestFile || $mtime < filemtime($oldestFile)) {
        $oldestFile = $file;
      }

      if (!$newestFile || $mtime > filemtime($newestFile)) {
        $newestFile = $file;
      }
    }

    return [
      'totalFiles' => $totalFiles,
      'totalSizeBytes' => $totalSize,
      'totalSizeMB' => round($totalSize / 1024 / 1024, 2),
      'oldestCacheAge' => $oldestFile ? time() - filemtime($oldestFile) : 0,
      'newestCacheAge' => $newestFile ? time() - filemtime($newestFile) : 0,
      'cacheDirectory' => $this->cacheDir
    ];
  }
}
