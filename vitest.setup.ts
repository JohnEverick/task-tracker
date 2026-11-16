import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { resetNavigation } from "./tests/helpers/navigation-mock";

// The App Router isn't mounted in tests; components get a controllable mock.
vi.mock("next/navigation", async () => await import("./tests/helpers/navigation-mock"));

// Radix measures elements with ResizeObserver, which jsdom doesn't provide.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", { value: ResizeObserverStub, writable: true });
}

beforeEach(() => {
  window.localStorage.clear();
  resetNavigation();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
