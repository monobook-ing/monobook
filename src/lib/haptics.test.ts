import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerSelectionHaptic } from "@/lib/haptics";

const setNavigatorProp = (key: "maxTouchPoints" | "vibrate", value: unknown) => {
  Object.defineProperty(navigator, key, {
    value,
    configurable: true,
  });
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "maxTouchPoints");
  Reflect.deleteProperty(navigator, "vibrate");

  vi.restoreAllMocks();
});

describe("triggerSelectionHaptic", () => {
  it("does not vibrate on non-touch devices", () => {
    const vibrateSpy = vi.fn();
    setNavigatorProp("maxTouchPoints", 0);
    setNavigatorProp("vibrate", vibrateSpy);

    triggerSelectionHaptic();

    expect(vibrateSpy).not.toHaveBeenCalled();
  });

  it("vibrates on touch-capable devices", () => {
    const vibrateSpy = vi.fn();
    setNavigatorProp("maxTouchPoints", 1);
    setNavigatorProp("vibrate", vibrateSpy);

    triggerSelectionHaptic();

    expect(vibrateSpy).toHaveBeenCalledWith(10);
  });

  it("does not throw when vibrate fails", () => {
    setNavigatorProp("maxTouchPoints", 1);
    setNavigatorProp("vibrate", vi.fn(() => {
      throw new Error("not supported");
    }));

    expect(() => triggerSelectionHaptic()).not.toThrow();
  });
});
