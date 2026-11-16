"use client";

import * as React from "react";

const subscribeNever = () => () => {};

export function formatTodayLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

/** Today's date in the viewer's timezone. Empty during SSR so the markup matches on hydration. */
export function useTodayLabel(): string {
  return React.useSyncExternalStore(
    subscribeNever,
    () => formatTodayLabel(),
    () => ""
  );
}
