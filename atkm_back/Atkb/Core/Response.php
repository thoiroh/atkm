<?php

namespace Atkb\Core;

/**
 * Response class for handling HTTP responses
 * Provides standardized response format for Angular frontend
 */
class Response
{
    private array $data;
    private int $statusCode;
    private array $headers;

    public function __construct(array $data = [], int $statusCode = 200, array $headers = [])
    {
        $this->data = $data;
        $this->statusCode = $statusCode;
        $this->headers = array_merge([
            'Content-Type' => 'application/json; charset=UTF-8'
        ], $headers);
    }

    /**
     * Set response data
     */
    public function setData(array $data): self
    {
        $this->data = $data;
        return $this;
    }

    /**
     * Set status code
     */
    public function setStatusCode(int $statusCode): self
    {
        $this->statusCode = $statusCode;
        return $this;
    }

    /**
     * Add header
     */
    public function setHeader(string $name, string $value): self
    {
        $this->headers[$name] = $value;
        return $this;
    }

    /**
     * Send response to client
     */
    public function send(): void
    {
        // Set status code
        http_response_code($this->statusCode);

        // Set headers
        foreach ($this->headers as $name => $value) {
            header("{$name}: {$value}");
        }

        // Send JSON response
        echo json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Create success response
     */
    public static function success(array $data = [], string $message = 'Success'): self
    {
        return new self([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], 200);
    }

    /**
     * Create error response
     */
    public static function error(string $message, int $code = 400, array $details = []): self
    {
        return new self([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
                'timestamp' => date('c')
            ]
        ], $code);
    }

    /**
     * Create Binance API response wrapper
     */
    public static function binanceSuccess(array $binanceData, string $endpoint): self
    {
        return new self([
            'success' => true,
            'source' => 'binance',
            'endpoint' => $endpoint,
            'data' => $binanceData,
            'timestamp' => date('c')
        ], 200);
    }

    /**
     * Create Binance API error response
     */
    public static function binanceError(string $message, int $code = 400, string $endpoint = ''): self
    {
        return new self([
            'success' => false,
            'source' => 'binance',
            'endpoint' => $endpoint,
            'error' => [
                'code' => $code,
                'message' => $message,
                'timestamp' => date('c')
            ]
        ], $code);
    }
}