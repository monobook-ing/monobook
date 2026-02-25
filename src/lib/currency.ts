const ALPHA_CURRENCY_RE = /[A-Za-z]/;

export const DEFAULT_CURRENCY_CODE = "USD";
export const DEFAULT_CURRENCY_DISPLAY = "$";

export const normalizeCurrencyCode = (value?: string | null): string => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized || normalized.length !== 3) {
    return DEFAULT_CURRENCY_CODE;
  }
  return normalized;
};

export const resolveCurrencyDisplay = (
  currencyDisplay?: string | null,
  currencyCode?: string | null
): string => {
  const normalizedDisplay = currencyDisplay?.trim();
  if (normalizedDisplay) return normalizedDisplay;
  const normalizedCode = normalizeCurrencyCode(currencyCode);
  if (normalizedCode === DEFAULT_CURRENCY_CODE) {
    return DEFAULT_CURRENCY_DISPLAY;
  }
  return normalizedCode;
};

export const isPrefixCurrencyDisplay = (currencyDisplay: string): boolean => {
  return !ALPHA_CURRENCY_RE.test(currencyDisplay);
};

export const formatCurrencyAmount = (
  amount: number,
  currencyDisplay?: string | null,
  currencyCode?: string | null,
  maximumFractionDigits = 0
): string => {
  const display = resolveCurrencyDisplay(currencyDisplay, currencyCode);
  const formattedAmount = Number.isFinite(amount)
    ? amount.toLocaleString("en-US", { maximumFractionDigits })
    : "0";

  if (isPrefixCurrencyDisplay(display)) {
    return `${display}${formattedAmount}`;
  }
  return `${formattedAmount} ${display}`;
};

