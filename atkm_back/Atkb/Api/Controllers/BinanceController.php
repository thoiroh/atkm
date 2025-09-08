<?php

namespace Atkb\Api\Controllers;

use Atkb\Core\Request;
use Atkb\Core\Response;
use Atkb\Services\BinanceService;

/**
 * Binance API Controller
 * Handles Binance API endpoints with custom wrapper responses
 */
class BinanceController
{
  private BinanceService $binanceService;

  public function __construct()
  {
    $this->binanceService = new BinanceService();
  }

  /**
   * Get ticker price - Public endpoint
   * GET /api/v3/ticker/price?symbol=BTCUSDT (optional)
   */
  public function getTickerPrice(Request $request): Response
  {
    try {
      $symbol = $request->getQueryParam('symbol');

      $data = $this->binanceService->getTickerPrice($symbol);

      return Response::binanceSuccess($data, '/api/v3/ticker/price');
    } catch (\Exception $e) {
      return Response::binanceError(
        $e->getMessage(),
        $e->getCode() ?: 500,
        '/api/v3/ticker/price'
      );
    }
  }

  /**
   * Get account information - Private endpoint
   * GET /api/v3/account
   */
  public function getAccount(Request $request): Response
  {
    try {
      $data = $this->binanceService->getAccount();

      // Custom wrapper for Angular frontend
      $formattedData = [
        'accountType' => $data['accountType'] ?? 'SPOT',
        'canTrade' => $data['canTrade'] ?? false,
        'canWithdraw' => $data['canWithdraw'] ?? false,
        'canDeposit' => $data['canDeposit'] ?? false,
        'updateTime' => $data['updateTime'] ?? null,
        'balances' => $this->formatBalances($data['balances'] ?? []),
        'permissions' => $data['permissions'] ?? []
      ];

      return Response::binanceSuccess($formattedData, '/api/v3/account');
    } catch (\Exception $e) {
      return Response::binanceError(
        $e->getMessage(),
        $e->getCode() ?: 500,
        '/api/v3/account'
      );
    }
  }

  /**
   * Format balances for frontend consumption
   */
  private function formatBalances(array $balances): array
  {
    $formatted = [];

    foreach ($balances as $balance) {
      $free = (float) ($balance['free'] ?? 0);
      $locked = (float) ($balance['locked'] ?? 0);
      $total = $free + $locked;

      // Only include assets with balance > 0
      if ($total > 0) {
        $formatted[] = [
          'asset' => $balance['asset'],
          'free' => $free,
          'locked' => $locked,
          'total' => $total
        ];
      }
    }

    // Sort by total balance descending
    usort($formatted, function ($a, $b) {
      return $b['total'] <=> $a['total'];
    });

    return $formatted;
  }
}
