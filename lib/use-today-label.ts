"use client";

import * as React from "react";

/** Today's date in the viewer's timezone. Empty during SSR to avoid a hydration mismatch. */
export function useTodayLabel(): string {
  const [label, setLabel] = React.useState("");
  React.useEffect(() => {
    setLabel(
      new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })
    );
  }, []);
  return label;
}
