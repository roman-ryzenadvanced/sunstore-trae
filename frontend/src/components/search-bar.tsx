"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/**
 * Marketplace-style search bar for the header.
 * Submits to /catalog?q=… and preserves any active category.
 */
export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const search = new URLSearchParams();
    const category = params.get("category");
    if (category) search.set("category", category);
    const q = query.trim();
    if (q) search.set("q", q);
    const qs = search.toString();
    router.push(qs ? `/catalog?${qs}` : "/catalog");
  }

  return (
    <form className="search-bar" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        className="search-bar__input"
        placeholder="Поиск по солнечным панелям, инверторам…"
        aria-label="Поиск товаров"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit" className="search-bar__btn" aria-label="Найти">
        <Search size={18} aria-hidden="true" />
        <span>Найти</span>
      </button>
    </form>
  );
}
