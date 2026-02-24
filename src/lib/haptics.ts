export const triggerSelectionHaptic = (): void => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return;
  }

  if (!navigator.maxTouchPoints || navigator.maxTouchPoints <= 0) {
    return;
  }

  if (typeof navigator.vibrate !== "function") {
    return;
  }

  try {
    navigator.vibrate(10);
  } catch {
    // Ignore unsupported runtime behavior; haptics are best-effort.
  }
};
