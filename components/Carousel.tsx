"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const SLIDES = [
  {
    src: "https://ajzbtmnyihqynsreailk.supabase.co/storage/v1/object/public/img/image_1781135481585_compressed.jpg",
    alt: "Camiseta Ecuador 2026 – vista 1",
  },
  {
    src: "https://ajzbtmnyihqynsreailk.supabase.co/storage/v1/object/public/img/image_1781135480568_compressed.jpg",
    alt: "Camiseta Ecuador 2026 – vista 2",
  },
  {
    src: "https://ajzbtmnyihqynsreailk.supabase.co/storage/v1/object/public/img/image_1781135479547_compressed.jpg",
    alt: "Camiseta Ecuador 2026 – vista 3",
  },
];

const AUTO_INTERVAL = 4000;

export default function Carousel() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef(0);
  const total = SLIDES.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % total) + total) % total);
    },
    [total]
  );

  const startAuto = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setCurrent((c) => (c + 1) % total),
      AUTO_INTERVAL
    );
  }, [total]);

  useEffect(() => {
    startAuto();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startAuto]);

  const handlePrev = () => {
    goTo(current - 1);
    startAuto();
  };

  const handleNext = () => {
    goTo(current + 1);
    startAuto();
  };

  const handleDot = (i: number) => {
    goTo(i);
    startAuto();
  };

  return (
    <div>
      {/* Track */}
      <div
        className="relative aspect-square bg-surface-container border border-primary/5 shadow-2xl overflow-hidden"
        onTouchStart={(e) => {
          touchStartRef.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const diff = touchStartRef.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) {
            goTo(current + (diff > 0 ? 1 : -1));
            startAuto();
          }
        }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {SLIDES.map((slide) => (
            <div key={slide.src} className="relative min-w-full h-full flex-shrink-0">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>

        {/* Prev */}
        <button
          onClick={handlePrev}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-primary/10 flex items-center justify-center hover:bg-ecu-blue hover:text-white hover:border-ecu-blue transition-all duration-200 shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* Next */}
        <button
          onClick={handleNext}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-primary/10 flex items-center justify-center hover:bg-ecu-blue hover:text-white hover:border-ecu-blue transition-all duration-200 shadow-md"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>

        {/* Counter */}
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm px-2 py-1">
          <span className="font-label-sm text-label-sm text-white tabular-nums">
            {current + 1} / {total}
          </span>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDot(i)}
            aria-label={`Foto ${i + 1}`}
            className={`h-1 transition-all duration-300 ${
              i === current ? "w-6 bg-primary" : "w-2 bg-primary/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
