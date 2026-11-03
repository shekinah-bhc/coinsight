/**
 * Monetary Arithmetic & Formatting Utilities for Coinsight
 *
 * CRITICAL RULE:
 * Never use JavaScript floating-point multiplication (e.g. `amount * 100`)
 * for currency conversions, as it causes binary floating-point rounding errors
 * (e.g., 19.99 * 100 = 1998.9999999999998).
 * All conversions between Rupee strings and integer paise minor currency units
 * must use strict string decimal decomposition and BigInt arithmetic.
 */

export interface MoneyParseSuccess {
  success: true;
  paise: number;
}

export interface MoneyParseError {
  success: false;
  error: string;
}

export type MoneyParseResult = MoneyParseSuccess | MoneyParseError;

const MAX_PAISE_LIMIT = BigInt("1000000000000"); // 10^12 paise = ₹10 billion
const MIN_PAISE_LIMIT = BigInt("-1000000000000");

/**
 * Parses user input in Rupees (e.g., "10000", "1,250.50", "₹500") into integer paise.
 *
 * For credit cards:
 * - Users enter outstanding debt as a positive number.
 * - Server stores it as negative paise (e.g., ₹10,000 -> -1000000 paise).
 * - Zero outstanding balance -> 0 paise.
 */
export function parseRupeesToPaise(
  rawInput: string | number,
  isCreditCard = false
): MoneyParseResult {
  if (rawInput === undefined || rawInput === null) {
    return { success: false, error: "Amount is required." };
  }

  const str = String(rawInput).trim();
  if (str === "") {
    return { success: false, error: "Please enter a valid amount." };
  }

  // Remove currency symbols, rupee abbreviations, and formatting commas
  const sanitized = str
    .replace(/[₹$€£,]/g, "")
    .replace(/\s+/g, "")
    .replace(/^rs\.?/i, "")
    .replace(/^inr/i, "");

  if (sanitized === "") {
    return { success: false, error: "Please enter a valid monetary amount." };
  }

  // Validate decimal structure: allows optional leading minus, digits, and at most 2 decimal digits
  const decimalRegex = /^-?\d+(\.\d{1,2})?$/;
  if (!decimalRegex.test(sanitized)) {
    if (/^-?\d+\.\d{3,}$/.test(sanitized)) {
      return {
        success: false,
        error: "Amounts cannot have more than 2 decimal places (paise).",
      };
    }
    return {
      success: false,
      error: "Invalid amount format. Please enter a valid number (e.g., 1500.50).",
    };
  }

  const isNegative = sanitized.startsWith("-");
  const unsignedStr = isNegative ? sanitized.slice(1) : sanitized;

  const [wholeStr, fractionalStr = ""] = unsignedStr.split(".");
  const fractionalPadded = fractionalStr.padEnd(2, "0");

  let parsedPaise: bigint;
  try {
    const wholeBig = BigInt(wholeStr);
    const fracBig = BigInt(fractionalPadded);
    parsedPaise = wholeBig * BigInt(100) + fracBig;
    if (isNegative) {
      parsedPaise = -parsedPaise;
    }
  } catch {
    return { success: false, error: "Amount value is invalid or too large." };
  }

  if (isCreditCard) {
    // For credit cards, user enters positive number representing outstanding debt
    if (parsedPaise < BigInt(0)) {
      return {
        success: false,
        error:
          "Please enter outstanding credit balance as a positive number. It will be stored as an outstanding obligation.",
      };
    }
    // Negate positive outstanding debt to represent liability
    parsedPaise = -parsedPaise;
  }

  if (parsedPaise > MAX_PAISE_LIMIT || parsedPaise < MIN_PAISE_LIMIT) {
    return {
      success: false,
      error: "Amount exceeds permissible account limits (₹10,00,00,00,000 max).",
    };
  }

  return {
    success: true,
    paise: Number(parsedPaise),
  };
}

/**
 * Formats an integer minor unit (paise) into standard Indian Rupee format (e.g. ₹1,23,456.78).
 */
export function formatPaiseToRupees(
  paise: number | string | bigint | null | undefined,
  options?: {
    showCurrencySymbol?: boolean;
    absolute?: boolean;
    decimals?: number;
  }
): string {
  if (paise === null || paise === undefined) {
    return options?.showCurrencySymbol !== false ? "₹0.00" : "0.00";
  }

  let numValue: number;
  if (typeof paise === "string") {
    // Handle numeric or decimal strings from Postgres NUMERIC/TEXT
    const parsed = Number.parseFloat(paise);
    numValue = Number.isNaN(parsed) ? 0 : parsed;
  } else {
    numValue = Number(paise);
  }

  // Convert paise to rupees
  const rupees = numValue / 100;
  const isNegative = rupees < 0;
  const absValue = Math.abs(rupees);

  const formattedAbs = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: options?.decimals ?? 2,
    maximumFractionDigits: options?.decimals ?? 2,
  }).format(options?.absolute ? absValue : absValue);

  const symbol = options?.showCurrencySymbol !== false ? "₹" : "";

  if (options?.absolute) {
    return `${symbol}${formattedAbs}`;
  }

  if (isNegative) {
    return `-${symbol}${formattedAbs}`;
  }

  return `${symbol}${formattedAbs}`;
}

/**
 * Formats a raw numeric string returned from PostgreSQL aggregations.
 */
export function formatSqlNumericToRupees(
  numericText: string | null | undefined,
  options?: {
    showCurrencySymbol?: boolean;
    absolute?: boolean;
  }
): string {
  return formatPaiseToRupees(numericText, options);
}

