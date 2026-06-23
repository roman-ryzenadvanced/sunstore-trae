"use client";

import { useState } from "react";

import { SmartImage } from "@/components/smart-image";

interface ProductGalleryProps {
  title: string;
  images?: string[];
}

/**
 * Main image + thumbnail strip for the product page.
 * Keeps the existing SmartImage (next/image + branded fallback) so a product
 * with zero images still renders the Sun Panels placeholder.
 */
export function ProductGallery({ title, images = [] }: ProductGalleryProps) {
  const slides = images.length > 0 ? images : [undefined];
  const [active, setActive] = useState(0);

  return (
    <div className="pgallery">
      <div className="pgallery__stage">
        <SmartImage
          key={slides[active] ?? "fallback"}
          src={slides[active]}
          alt={title}
          aspectRatio="auto"
          priority
          sizes="(max-width: 1040px) 100vw, 640px"
        />
        <span className="pgallery__count" aria-hidden="true">
          {active + 1} / {slides.length}
        </span>
      </div>

      {images.length > 1 ? (
        <div className="pgallery__thumbs" role="tablist" aria-label="Фото товара">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Фото ${i + 1}`}
              className={`pgallery__thumb${i === active ? " is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              <SmartImage src={src} alt="" aspectRatio="1 / 1" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
