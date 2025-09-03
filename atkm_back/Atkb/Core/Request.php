<?php

namespace Atkb\Core;

/**
 * Request class for handling HTTP requests
 * Provides access to request data and parameters
 */
class Request
{
    private string $method;
    private string $path;
    private array $headers;
    private array $query;
    private array $body;

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $this->headers = $this->getAllHeaders();
        $this->query = $_GET;
        $this->body = $this->getRequestBody();
    }

    /**
     * Get HTTP method
     */
    public function getMethod(): string
    {
        return $this->method;
    }

    /**
     * Get request path
     */
    public function getPath(): string
    {
        return $this->path;
    }

    /**
     * Get all headers
     */
    public function getHeaders(): array
    {
        return $this->headers;
    }

    /**
     * Get specific header
     */
    public function getHeader(string $name): ?string
    {
        $name = strtolower($name);
        foreach ($this->headers as $key => $value) {
            if (strtolower($key) === $name) {
                return $value;
            }
        }
        return null;
    }

    /**
     * Get query parameters
     */
    public function getQuery(): array
    {
        return $this->query;
    }

    /**
     * Get specific query parameter
     */
    public function getQueryParam(string $name, $default = null)
    {
        return $this->query[$name] ?? $default;
    }

    /**
     * Get request body
     */
    public function getBody(): array
    {
        return $this->body;
    }

    /**
     * Get specific body parameter
     */
    public function getBodyParam(string $name, $default = null)
    {
        return $this->body[$name] ?? $default;
    }

    /**
     * Get all request parameters (query + body)
     */
    public function getAllParams(): array
    {
        return array_merge($this->query, $this->body);
    }

    /**
     * Get all headers (cross-platform)
     */
    private function getAllHeaders(): array
    {
        $headers = [];

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $headerName = str_replace('_', '-', substr($key, 5));
                    $headerName = ucwords(strtolower($headerName), '-');
                    $headers[$headerName] = $value;
                }
            }
        }

        return $headers;
    }

    /**
     * Parse request body based on content type
     */
    private function getRequestBody(): array
    {
        $contentType = $this->getHeader('Content-Type') ?? '';
        $rawBody = file_get_contents('php://input');

        if (empty($rawBody)) {
            return $_POST;
        }

        if (strpos($contentType, 'application/json') !== false) {
            $decoded = json_decode($rawBody, true);
            return is_array($decoded) ? $decoded : [];
        }

        if (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
            parse_str($rawBody, $parsed);
            return $parsed;
        }

        return $_POST;
    }
}