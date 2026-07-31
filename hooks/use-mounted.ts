"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/** True after client mount — gate localStorage-hydrated UI to avoid SSR mismatch. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
