<?php

namespace Atkb\Tools;

/**
 * Validation utility class
 * Provides common validation methods for API requests
 */
class Validator
{
  /**
   * Validate Binance symbol format
   */
  public static function isValidSymbol(string $symbol): bool
  {
    // Binance symbols are typically 6-10 characters, uppercase, no special chars
    return preg_match('/^[A-Z]{6,10}$/', $symbol);
  }

  /**
   * Validate timestamp (should be within reasonable range)
   */
  public static function isValidTimestamp(int $timestamp): bool
  {
    $now = time() * 1000; // Current time in milliseconds
    $fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Timestamp should be within 5 minutes of current time
    return abs($now - $timestamp) <= $fiveMinutes;
  }

  /**
   * Validate API key format
   */
  public static function isValidApiKey(string $apiKey): bool
  {
    // Binance API keys are 64 character hex strings
    return preg_match('/^[a-fA-F0-9]{64}$/', $apiKey);
  }

  /**
   * Sanitize string input
   */
  public static function sanitizeString(string $input): string
  {
    return trim(strip_tags($input));
  }

  /**
   * Validate required parameters
   */
  public static function validateRequired(array $data, array $required): array
  {
    $errors = [];

    foreach ($required as $field) {
      if (!isset($data[$field]) || empty($data[$field])) {
        $errors[] = "Field '{$field}' is required";
      }
    }

    return $errors;
  }

  /**
   * Validate numeric parameters
   */
  public static function validateNumeric(array $data, array $fields): array
  {
    $errors = [];

    foreach ($fields as $field) {
      if (isset($data[$field]) && !is_numeric($data[$field])) {
        $errors[] = "Field '{$field}' must be numeric";
      }
    }

    return $errors;
  }

  /**
   * Validate email format
   */
  public static function isValidEmail(string $email): bool
  {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
  }

  /**
   * Validate URL format
   */
  public static function isValidUrl(string $url): bool
  {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
  }
}
