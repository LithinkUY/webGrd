'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Slide { image: string; link: string; alt: string; }

const FALLBACK_SLIDES: Slide[] = [
  { image: '/banners/presentaciones0_7579.jpg', link: '/productos?brand=asano', alt: 'Asano' },
  { image: '/banners/presentaciones0_7654.jpg', link: '/productos?brand=biostar', alt: 'Biostar' },
  { image: '/banners/presentaciones0_7714.jpg', link: '/productos?brand=logitech', alt: 'Logitech' },
  { image: '/banners/presentaciones0_7743.jpg', link: '/productos', alt: 'Rebate' },
  { image: '/banners/presentaciones0_7798.jpg', link: '/productos?brand=bambu-lab', alt: 'Bambu Lab' },
  { image: '/banners/presentaciones0_7808.jpg', link: '/productos', alt: 'Web Service' },
  { image: '/banners/presentaciones0_7817.jpg', link: '/productos?brand=lexar', alt: 'Lexar' },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);

  useEffect(() => {
    fetch('/api/public/settings?keys=hero_slides')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.hero_slides) {
          try {
            const parsed = JSON.parse(data.hero_slides);
            if (Array.isArray(parsed) && parsed.length > 0) setSlides(parsed);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full h-full overflow-hidden bg-[#333]">
      {/* Full-width image slide */}
      <Link href={slides[current].link} className="block h-full">
        <div className="relative w-full h-full">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === current ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                className="object-cover object-top"
                sizes="100vw"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      </Link>

      {/* Left/Right arrows */}
      <button
        onClick={(e) => { e.preventDefault(); prev(); }}
        className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-black/10 hover:bg-black/30 text-white/70 hover:text-white transition-all text-3xl font-bold"
        aria-label="Anterior"
      >
        ‹
      </button>
      <button
        onClick={(e) => { e.preventDefault(); next(); }}
        className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-black/10 hover:bg-black/30 text-white/70 hover:text-white transition-all text-3xl font-bold"
        aria-label="Siguiente"
      >
        ›
      </button>

      {/* Dots — bottom area */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); setCurrent(i); }}
            className={`w-2.5 h-2.5 rounded-full border-2 border-white/60 transition-all duration-300 ${
              i === current ? 'bg-white' : 'bg-transparent hover:bg-white/40'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
