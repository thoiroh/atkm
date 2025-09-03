<?php

namespace Atkb\Api\Controllers;

use Atkb\Core\Request;
use Atkb\Core\Response;
use Atkb\Services\BinanceService;

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
            } catch (\Exception $e) {
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
            
        } catch (\Exception $e) {
            return Response::error(
                'Health check failed: ' . $e->getMessage(),
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
     * Get system uptime (simplified for web context)
     */
    private function getUptime(): string
    {
        // For web applications, we'll return the current request time
        // In a real application, you might want to track application start time
        return 'Current request: ' . date('Y-m-d H:i:s');
    }
}