import { vi } from "vitest";

export const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let pathname = "/today";

export function setPathname(next: string) {
  pathname = next;
}

export function resetNavigation() {
  pathname = "/today";
  Object.values(router).forEach((fn) => fn.mockClear());
}

export const useRouter = () => router;
export const usePathname = () => pathname;
export const useSearchParams = () => new URLSearchParams();
export const redirect = vi.fn();
export const notFound = vi.fn();
