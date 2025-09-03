<?php

namespace Atkb\Tools;

/**
 * HTTP Client utility class
 * Handles HTTP requests with proper error handling
 */
class Http
{
  private int $timeout;
  private array $defaultHeaders;

  public function __construct(int $timeout = 30)
  {
    $this->timeout = $timeout;
    $this->defaultHeaders = [
      'User-Agent: ATK-Backend/1.0',
      'Accept: application/json',
      'Content-Type: application/json'
    ];
  }

  /**
   * Make GET request
   */
  public function get(string $url, array $headers = []): array
  {
    return $this->makeRequest('GET', $url, null, $headers);
  }

  /**
   * Make POST request
   */
  public function post(string $url, $data = null, array $headers = []): array
  {
    return $this->makeRequest('POST', $url, $data, $headers);
  }

  /**
   * Make PUT request
   */
  public function put(string $url, $data = null, array $headers = []): array
  {
    return $this->makeRequest('PUT', $url, $data, $headers);
  }

  /**
   * Make DELETE request
   */
  public function delete(string $url, array $headers = []): array
  {
    return $this->makeRequest('DELETE', $url, null, $headers);
  }

  /**
   * Make HTTP request using cURL
   */
  private function makeRequest(string $method, string $url, $data = null, array $headers = []): array
  {
    $curl = curl_init();

    // Merge headers
    $allHeaders = array_merge($this->defaultHeaders, $headers);

    // Basic cURL options
    curl_setopt_array($curl, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => $this->timeout,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS => 3,
      CURLOPT_SSL_VERIFYPEER => true,
      CURLOPT_SSL_VERIFYHOST => 2,
      CURLOPT_HTTPHEADER => $allHeaders,
      CURLOPT_USERAGENT => 'ATK-Backend/1.0'
    ]);

    // Set method-specific options
    switch (strtoupper($method)) {
      case 'POST':
        curl_setopt($curl, CURLOPT_POST, true);
        if ($data !== null) {
          curl_setopt($curl, CURLOPT_POSTFIELDS, $this->prepareData($data));
        }
        break;

      case 'PUT':
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data !== null) {
          curl_setopt($curl, CURLOPT_POSTFIELDS, $this->prepareData($data));
        }
        break;

      case 'DELETE':
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, 'DELETE');
        break;

      case 'GET':
      default:
        // GET is default, no additional options needed
        break;
    }

    // Execute request
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    $info = curl_getinfo($curl);

    curl_close($curl);

    // Handle cURL errors
    if ($response === false || !empty($error)) {
      return [
        'success' => false,
        'error' => $error ?: 'Unknown cURL error',
        'httpCode' => $httpCode,
        'data' => null
      ];
    }

    // Parse response
    $decodedResponse = json_decode($response, true);

    return [
      'success' => $httpCode >= 200 && $httpCode < 300,
      'httpCode' => $httpCode,
      'data' => $decodedResponse !== null ? $decodedResponse : $response,
      'error' => $httpCode >= 400 ? $this->getHttpErrorMessage($httpCode) : null,
      'info' => $info
    ];
  }

  /**
   * Prepare data for request body
   */
  private function prepareData($data): string
  {
    if (is_array($data) || is_object($data)) {
      return json_encode($data);
    }

    return (string) $data;
  }

  /**
   * Get HTTP error message by status code
   */
  private function getHttpErrorMessage(int $code): string
  {
    $messages = [
      400 => 'Bad Request',
      401 => 'Unauthorized',
      403 => 'Forbidden',
      404 => 'Not Found',
      429 => 'Too Many Requests',
      500 => 'Internal Server Error',
      502 => 'Bad Gateway',
      503 => 'Service Unavailable',
      504 => 'Gateway Timeout'
    ];

    return $messages[$code] ?? "HTTP Error $code";
  }

  /**
   * Set request timeout
   */
  public function setTimeout(int $timeout): void
  {
    $this->timeout = $timeout;
  }

  /**
   * Add default header
   */
  public function addDefaultHeader(string $header): void
  {
    $this->defaultHeaders[] = $header;
  }
}
