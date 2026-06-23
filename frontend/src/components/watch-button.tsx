"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/format";

const STORAGE_KEY = "sunstore-watchlist";

function readWatchlist(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "number")
      : [];
  } catch {
    return [];
  }
}

function persist(ids: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

/**
 * eBay-style "Add to watchlist" heart toggle. Persisted to localStorage.
 */
export function WatchButton({
  productId,
  className,
  label = "В список"
}: {
  productId: number;
  className?: string;
  label?: string;
}) {
  const [watching, setWatching] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWatching(readWatchlist().includes(productId));
    setHydrated(true);
  }, [productId]);

  function toggle() {
    const current = readWatchlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    persist(next);
    setWatching(next.includes(productId));
  }

  return (
    <button
      type="button"
      className={cn("watch-btn", watching && "watch-btn--on", className)}
      onClick={toggle}
      aria-pressed={watching}
      aria-label={watching ? "Убрать из списка наблюдения" : "Добавить в список наблюдения"}
      title={watching ? "В списке" : "В список наблюдения"}
    >
      <Heart
        size={16}
        aria-hidden="true"
        fill={hydrated && watching ? "currentColor" : "none"}
      />
      {hydrated && watching ? <span>В списке</span> : <span>{label}</span>}
    </button>
  );
}
