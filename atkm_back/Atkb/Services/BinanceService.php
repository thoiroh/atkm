<?php

namespace Atkb\Services;

use Atkb\Tools\Http;

/**
 * Binance API Service
 * Handles all Binance API interactions with proper authentication
 */
class BinanceService
{
  private string $apiKey;
  private string $secretKey;
  private string $baseUrl;
  private Http $httpClient;

  public function __construct()
  {
    $this->apiKey = $_ENV['BINANCE_API_KEY'] ?? '';
    $this->secretKey = $_ENV['BINANCE_SECRET_KEY'] ?? '';
    $this->baseUrl = $_ENV['BINANCE_BASE_URL'] ?? 'https://api.binance.com';
    $this->httpClient = new Http();

    if (empty($this->apiKey) || empty($this->secretKey)) {
      throw new \Exception('Binance API credentials not configured');
    }
  }

  /**
   * Get ticker price (public endpoint)
   */
  public function getTickerPrice(?string $symbol = null): array
  {
    $endpoint = '/api/v3/ticker/price';
    $params = [];

    if ($symbol) {
      $params['symbol'] = strtoupper($symbol);
    }

    return $this->makePublicRequest($endpoint, $params);
  }

  /**
   * Get account information (private endpoint)
   */
  public function getAccount(): array
  {
    $endpoint = '/api/v3/account';
    $params = [
      'timestamp' => $this->getTimestamp()
    ];

    return $this->makePrivateRequest($endpoint, $params);
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
   * Handle API response
   */
  private function handleResponse(array $response, string $endpoint): array
  {
    if (!$response['success']) {
      throw new \Exception(
        'Binance API Error: ' . $response['error'],
        $response['httpCode'] ?? 500
      );
    }

    $data = $response['data'];

    // Check for Binance API errors in response
    if (isset($data['code']) && isset($data['msg'])) {
      throw new \Exception(
        'Binance API Error: ' . $data['msg'],
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
}
