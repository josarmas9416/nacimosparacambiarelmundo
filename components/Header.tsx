"use client";

import { useEffect, useRef } from "react";

export default function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollRef = useRef(0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const onScroll = () => {
      const current = window.scrollY;
      if (current <= 0) {
        header.classList.remove("-translate-y-full");
        lastScrollRef.current = current;
        return;
      }
      if (current > lastScrollRef.current) {
        header.classList.add("-translate-y-full");
      } else {
        header.classList.remove("-translate-y-full");
      }
      lastScrollRef.current = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-md border-b border-primary/10 transition-transform duration-300"
    >
      <div className="national-accent-bar" />
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <span className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold tracking-tighter text-primary uppercase">
          ECUADOR<span className="text-ecu-blue">2026</span>
        </span>
      </div>
    </header>
  );
}
