<?php

namespace Atkb\Api\Controllers;

use Atkb\Core\Request;
use Atkb\Core\Response;
use Atkb\Services\BinanceService;
use Exception;

/**
 * Binance API Controller
 * Handles transaction history endpoints with comprehensive error handling
 */
class BinanceController
{
  private BinanceService $binanceService;

  public function __construct()
  {
    try {
      $this->binanceService = new BinanceService();
    } catch (Exception $e) {
      // Log the error but don't throw here - handle in individual methods
      error_log("BinanceService initialization failed: " . $e->getMessage());
    }
  }

  /**
   * Get my trades for a specific symbol
   * GET /api/v3/myTrades
   */
  public function getMyTrades(Request $request): Response
  {
    try {
      // Validate service initialization
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      // Get and validate parameters
      $symbol = $this->getRequestParam($request, 'symbol');
      if (empty($symbol)) {
        return Response::error('Symbol parameter is required', 400);
      }

      $startTime = $this->getRequestParam($request, 'startTime');
      $startTime = $startTime ? (int)$startTime : null;

      $endTime = $this->getRequestParam($request, 'endTime');
      $endTime = $endTime ? (int)$endTime : null;

      $limit = $this->getRequestParam($request, 'limit') ?? 500;
      $limit = (int)$limit;

      // Validate limit
      $limit = min(max($limit, 1), 1000);

      // Get trades from Binance
      $trades = $this->binanceService->getMyTrades($symbol, $startTime, $endTime, $limit);

      $responseData = [
        'trades' => $trades,
        'symbol' => strtoupper($symbol),
        'count' => count($trades),
        'filters' => [
          'startTime' => $startTime,
          'endTime' => $endTime,
          'limit' => $limit
        ]
      ];

      return Response::success($responseData, 'Trades retrieved successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'myTrades');
    }
  }

  /**
   * Get all orders for a specific symbol
   * GET /api/v3/allOrders
   */
  public function getAllOrders(Request $request): Response
  {
    try {
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      // Get and validate parameters
      $symbol = $this->getRequestParam($request, 'symbol');
      if (empty($symbol)) {
        return Response::error('Symbol parameter is required', 400);
      }

      $startTime = $this->getRequestParam($request, 'startTime');
      $startTime = $startTime ? (int)$startTime : null;

      $endTime = $this->getRequestParam($request, 'endTime');
      $endTime = $endTime ? (int)$endTime : null;

      $limit = $this->getRequestParam($request, 'limit') ?? 500;
      $limit = (int)$limit;

      // Validate limit
      $limit = min(max($limit, 1), 1000);

      // Get orders from Binance
      $orders = $this->binanceService->getAllOrders($symbol, $startTime, $endTime, $limit);

      $responseData = [
        'orders' => $orders,
        'symbol' => strtoupper($symbol),
        'count' => count($orders),
        'filters' => [
          'startTime' => $startTime,
          'endTime' => $endTime,
          'limit' => $limit
        ]
      ];

      return Response::success($responseData, 'Orders retrieved successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'allOrders');
    }
  }

  /**
   * Get deposit history
   * GET /api/v1/capital/deposit/history
   */
  public function getDepositHistory(Request $request): Response
  {
    try {
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      $coin = $this->getRequestParam($request, 'coin');

      $startTime = $this->getRequestParam($request, 'startTime');
      $startTime = $startTime ? (int)$startTime : null;

      $endTime = $this->getRequestParam($request, 'endTime');
      $endTime = $endTime ? (int)$endTime : null;

      $limit = $this->getRequestParam($request, 'limit') ?? 500;
      $limit = (int)$limit;

      // Validate limit
      $limit = min(max($limit, 1), 1000);

      // Get deposits from Binance
      $deposits = $this->binanceService->getDepositHistory($coin, $startTime, $endTime, $limit);

      $responseData = [
        'deposits' => $deposits,
        'coin' => $coin ? strtoupper($coin) : 'ALL',
        'count' => count($deposits),
        'filters' => [
          'startTime' => $startTime,
          'endTime' => $endTime,
          'limit' => $limit
        ]
      ];

      return Response::success($responseData, 'Deposits retrieved successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'depositHistory');
    }
  }

  /**
   * Get withdrawal history
   * GET /api/v1/capital/withdraw/history
   */
  public function getWithdrawHistory(Request $request): Response
  {
    try {
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      $coin = $this->getRequestParam($request, 'coin');

      $startTime = $this->getRequestParam($request, 'startTime');
      $startTime = $startTime ? (int)$startTime : null;

      $endTime = $this->getRequestParam($request, 'endTime');
      $endTime = $endTime ? (int)$endTime : null;

      $limit = $this->getRequestParam($request, 'limit') ?? 500;
      $limit = (int)$limit;

      // Validate limit
      $limit = min(max($limit, 1), 1000);

      // Get withdrawals from Binance
      $withdrawals = $this->binanceService->getWithdrawHistory($coin, $startTime, $endTime, $limit);

      $responseData = [
        'withdrawals' => $withdrawals,
        'coin' => $coin ? strtoupper($coin) : 'ALL',
        'count' => count($withdrawals),
        'filters' => [
          'startTime' => $startTime,
          'endTime' => $endTime,
          'limit' => $limit
        ]
      ];

      return Response::success($responseData, 'Withdrawals retrieved successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'withdrawHistory');
    }
  }

  /**
   * Get ticker price for a specific symbol
   * GET /api/v3/ticker/price
   */
  public function getTickerPrice(Request $request): Response
  {
    try {
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      // Get and validate symbol parameter (required)
      $symbol = $this->getRequestParam($request, 'symbol');
      if (empty($symbol)) {
        return Response::error('Symbol parameter is required', 400);
      }

      // Get ticker price from Binance
      $ticker = $this->binanceService->getTickerPrice($symbol);

      // Build response data
      $responseData = [
        'symbol' => strtoupper($symbol),
        'price' => $ticker['price'] ?? null,
        'tickerData' => $ticker
      ];

      return Response::success($responseData, 'Ticker price retrieved successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'tickerPrice');
    }
  }

  /**
   * Get account information
   * GET /api/v3/account
   */
  public function getAccount(Request $request): Response
  {
    try {
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      $account = $this->binanceService->getAccount();

      // Filter sensitive information for security
      $filteredAccount = [
        'accountType' => $account['accountType'] ?? 'SPOT',
        'canTrade' => $account['canTrade'] ?? false,
        'canWithdraw' => $account['canWithdraw'] ?? false,
        'canDeposit' => $account['canDeposit'] ?? false,
        'balances' => array_filter($account['balances'] ?? [], function ($balance) {
          return (float)$balance['free'] > 0 || (float)$balance['locked'] > 0;
        }),
        'permissions' => $account['permissions'] ?? []
      ];

      return Response::success($filteredAccount, 'Account information retrieved successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'account');
    }
  }

  /**
   * Get user assets with optional filters
   * GET /sapi/v3/asset/getUserAsset
   *
   * Query parameters:
   * - asset (optional): Filter by specific asset (e.g., "BTC")
   * - needBtcValuation (optional): Include BTC valuation ("true" or "false")
   */
  public function getUserAssets(Request $request): Response
  {
    try {
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      // Get optional parameters
      $asset = $this->getRequestParam($request, 'asset');
      $needBtcValuation = $this->getRequestParam($request, 'needBtcValuation') === 'true';

      // Get user assets from Binance
      $userAssets = $this->binanceService->getUserAssets($asset, $needBtcValuation);

      // Filter out assets with zero balance if no specific asset requested
      if (!$asset && is_array($userAssets)) {
        $userAssets = array_filter($userAssets, function ($assetData) {
          return (float)($assetData['free'] ?? 0) > 0
            || (float)($assetData['locked'] ?? 0) > 0
            || (float)($assetData['freeze'] ?? 0) > 0
            || (float)($assetData['withdrawing'] ?? 0) > 0;
        });

        // Re-index array after filtering
        $userAssets = array_values($userAssets);
      }

      $responseData = [
        'assets' => $userAssets,
        'count' => count($userAssets),
        'filters' => [
          'asset' => $asset,
          'needBtcValuation' => $needBtcValuation
        ]
      ];

      return Response::success($responseData, 'User assets retrieved successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'getUserAssets');
    }
  }

  /**
   * Get transaction summary for a symbol
   * GET /api/v1/transaction/summary
   */
  public function getTransactionSummary(Request $request): Response
  {
    try {
      if (!isset($this->binanceService)) {
        return $this->handleServiceError('Binance service not available');
      }

      $symbol = $this->getRequestParam($request, 'symbol');
      if (empty($symbol)) {
        return Response::error('Symbol parameter is required', 400);
      }

      $startTime = $this->getRequestParam($request, 'startTime');
      $startTime = $startTime ? (int)$startTime : null;

      $endTime = $this->getRequestParam($request, 'endTime');
      $endTime = $endTime ? (int)$endTime : null;

      // Get trades and calculate summary
      $trades = $this->binanceService->getMyTrades($symbol, $startTime, $endTime, 1000);
      $summary = $this->calculateTradingSummary($trades, $symbol);

      return Response::success($summary, 'Transaction summary calculated successfully');
    } catch (Exception $e) {
      return $this->handleBinanceError($e, 'transactionSummary');
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
   * Calculate trading summary from trades
   */
  private function calculateTradingSummary(array $trades, string $symbol): array
  {
    if (empty($trades)) {
      return [
        'symbol' => $symbol,
        'totalTrades' => 0,
        'tradingVolume' => ['buy' => 0, 'sell' => 0, 'total' => 0],
        'averagePrices' => ['buy' => 0, 'sell' => 0],
        'tradingQuantity' => ['buy' => 0, 'sell' => 0, 'net' => 0],
        'totalCommission' => 0,
        'estimatedPnl' => 0
      ];
    }

    $buyVolume = 0;
    $sellVolume = 0;
    $buyQuantity = 0;
    $sellQuantity = 0;
    $totalCommission = 0;
    $estimatedPnl = 0;
    $buyPriceSum = 0;
    $sellPriceSum = 0;
    $buyCount = 0;
    $sellCount = 0;

    foreach ($trades as $trade) {
      $price = (float)$trade['price'];
      $quantity = (float)$trade['qty'];
      $quoteQuantity = (float)$trade['quoteQty'];
      $commission = (float)$trade['commission'];
      $isBuyer = $trade['isBuyer'];

      if ($isBuyer) {
        $buyVolume += $quoteQuantity;
        $buyQuantity += $quantity;
        $buyPriceSum += $price;
        $buyCount++;
      } else {
        $sellVolume += $quoteQuantity;
        $sellQuantity += $quantity;
        $sellPriceSum += $price;
        $sellCount++;
      }

      $totalCommission += $commission;

      // Simple P&L calculation (sell - buy)
      if (isset($trade['realizedPnl'])) {
        $estimatedPnl += (float)$trade['realizedPnl'];
      }
    }

    return [
      'symbol' => $symbol,
      'totalTrades' => count($trades),
      'tradingVolume' => [
        'buy' => $buyVolume,
        'sell' => $sellVolume,
        'total' => $buyVolume + $sellVolume
      ],
      'averagePrices' => [
        'buy' => $buyCount > 0 ? $buyPriceSum / $buyCount : 0,
        'sell' => $sellCount > 0 ? $sellPriceSum / $sellCount : 0
      ],
      'tradingQuantity' => [
        'buy' => $buyQuantity,
        'sell' => $sellQuantity,
        'net' => $buyQuantity - $sellQuantity
      ],
      'totalCommission' => $totalCommission,
      'estimatedPnl' => $estimatedPnl
    ];
  }

  /**
   * Handle Binance service errors
   */
  private function handleServiceError(string $message): Response
  {
    error_log("BinanceController Service Error: " . $message);
    return Response::error($message, 503);
  }

  /**
   * Handle Binance API errors
   */
  private function handleBinanceError(Exception $e, string $endpoint): Response
  {
    $errorCode = $e->getCode() ?: 500;
    $errorMessage = $e->getMessage();

    error_log("BinanceController API Error - Endpoint: {$endpoint}, Error: {$errorMessage}, Code: {$errorCode}");

    return Response::error($errorMessage, $errorCode);
  }
}
