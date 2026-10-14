"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State mirrored into the query string (`?key=value`) so any view can be shared as a link.
 * Static export: the value is read after mount (the server render always uses the default).
 */
export function useUrlState(key: string, initial: string): [string, (v: string) => void] {
  const [value, setValue] = useState(initial);
  const ready = useRef(false);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get(key);
    if (v != null) setValue(v);
    ready.current = true;
  }, [key]);
  const set = useCallback(
    (v: string) => {
      setValue(v);
      const url = new URL(window.location.href);
      if (v === initial) url.searchParams.delete(key);
      else url.searchParams.set(key, v);
      window.history.replaceState(null, "", url);
    },
    [key, initial],
  );
  return [value, set];
}
